/**
 * SGIP — Auth Service
 * Tickets: SGIP-2.1.1.1, SGIP-2.1.1.2, SGIP-2.1.2.1, SGIP-2.1.2.2,
 *          SGIP-2.1.2.3, SGIP-2.1.2.5, SGIP-2.1.3.1, SGIP-2.1.3.2,
 *          SGIP-2.1.3.3, SGIP-2.1.4.2
 *
 * Core authentication business logic. All auth operations funnel through here.
 *
 * Security invariants enforced here:
 * - Argon2id params: memory=65536 (64MB), timeCost=3, parallelism=4 (OWASP minimum)
 * - Refresh token raw value is NEVER stored — only SHA-256(raw) is persisted
 * - Refresh token rotation: old token consumed, new one issued on every refresh
 * - Reuse detection: presenting a revoked token triggers full session revocation
 * - tokenVersion increments on password change and logout-all
 * - Timing-safe comparison for all token/hash operations
 * - HIBP breached-password check on registration (SGIP-2.1.3.3)
 */
import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../common/email/email.service';
import { RedisService } from '../common/redis/redis.service';
import type { UserRole } from '@sgip/shared';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';

// ── Constants ─────────────────────────────────────────────────────────────────

// OWASP Argon2id minimum (Document 3 §3.1). MUST NOT be lowered without security review.
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

// ── Response types ─────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string; // Raw value — return to client, do NOT persist
  expiresIn: number; // Access token TTL in seconds
}

export interface RegisterResult {
  userId: string;
  email: string;
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtPrivateKey: string | null;
  private readonly jwtPublicKey: string | null;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiryDays: number;

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly redis: RedisService,
  ) {
    const priv = config.get<string>('JWT_PRIVATE_KEY');
    const pub = config.get<string>('JWT_PUBLIC_KEY');
    this.jwtPrivateKey = priv
      ? Buffer.from(priv, 'base64').toString('utf-8')
      : null;
    this.jwtPublicKey = pub
      ? Buffer.from(pub, 'base64').toString('utf-8')
      : null;
    this.accessTokenExpiry = config.get<string>(
      'JWT_ACCESS_TOKEN_EXPIRY',
      '15m',
    );
    this.refreshTokenExpiryDays = config.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRY_DAYS',
      7,
    );
  }

  // ── SGIP-2.1.1.1: Registration ─────────────────────────────────────────────

  async register(
    dto: RegisterDto,
    ipAddress?: string,
  ): Promise<RegisterResult> {
    // 1. Breached-password check (SGIP-2.1.3.3)
    await this.checkBreachedPassword(dto.password);

    // 2. Hash password with Argon2id (OWASP params — fixed, not configurable)
    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);

    // 3. Create user (UsersService throws ConflictException if email taken)
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
    });

    // 4. Issue email verification token (SGIP-2.1.1.2)
    const verifyToken = this.signEmailVerifyToken(user.id);
    await this.email.sendEmailVerification(user.email, user.id, verifyToken);

    this.logger.log({ msg: 'User registered', userId: user.id, ip: ipAddress });

    return {
      userId: user.id,
      email: user.email,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // ── SGIP-2.1.1.2: Email Verification ───────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwt.verify<{ sub: string; purpose: string }>(token, {
        secret: this.getEmailTokenSecret(),
      });
    } catch {
      throw new BadRequestException('Invalid or expired verification link.');
    }

    if (payload.purpose !== 'email-verify') {
      throw new BadRequestException('Invalid verification token.');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new BadRequestException('User not found.');

    if (user.emailVerifiedAt) {
      return { message: 'Email address is already verified.' };
    }

    await this.users.markEmailVerified(payload.sub);
    this.logger.log({ msg: 'Email verified', userId: payload.sub });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // ── SGIP-2.1.2.1 + 2.1.2.2: Login ─────────────────────────────────────────

  async login(
    dto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const user = await this.users.findByEmail(dto.email);

    // Constant-time failure path — do not reveal whether email exists
    if (!user) {
      // Still hash to prevent timing attacks
      await argon2.hash('dummy-timing-pad', ARGON2_OPTIONS);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      this.logger.warn({
        msg: 'Failed login attempt',
        email: dto.email,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Please verify your email address before logging in. Check your inbox for the verification link.',
      );
    }

    return this.issueTokens(user, deviceInfo, ipAddress);
  }

  // ── SGIP-2.1.2.3: Refresh Token Rotation ──────────────────────────────────

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.users.findRefreshToken(tokenHash);

    if (!stored) {
      // Token not found OR already revoked — this is a reuse attempt
      // Check if a token with this hash was ever issued (across all statuses)
      const abused = await this.checkRevokedTokenReuse(rawRefreshToken);
      if (abused) {
        // Revoke ALL sessions for this user — potential account takeover signal
        await this.users.revokeAllRefreshTokens(abused.userId);
        this.logger.warn({
          msg: 'Refresh token reuse detected — all sessions revoked',
          userId: abused.userId,
        });
        throw new UnauthorizedException(
          'Security alert: your session appears to have been compromised. Please log in again.',
        );
      }
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Consume old token (rotation)
    await this.users.revokeRefreshToken(stored.id);

    // Issue new token pair — carry the familyId forward in the rotation chain
    const user = await this.users.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User account not found.');

    return this.issueTokens(
      user,
      stored.deviceInfo ?? undefined,
      stored.ipAddress ?? undefined,
      stored.familyId, // Same family — enables reuse detection on stolen tokens
    );
  }

  // ── SGIP-2.1.2.5: Logout ───────────────────────────────────────────────────

  async logout(
    rawRefreshToken: string,
    userId: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.users.findRefreshToken(tokenHash);
    if (stored && stored.userId === userId) {
      await this.users.revokeRefreshToken(stored.id);
    }
    // Invalidate tokenVersion cache entry
    await this.invalidateTokenVersionCache(userId);
    this.logger.log({ msg: 'User logged out', userId });
    return { message: 'Logged out successfully.' };
  }

  async logoutAll(
    userId: string,
  ): Promise<{ message: string; sessionsRevoked: number }> {
    const [{ count }, newVersion] = await Promise.all([
      this.users.revokeAllRefreshTokens(userId),
      this.users.incrementTokenVersion(userId),
    ]);
    // Invalidate cache so JwtStrategy picks up new version immediately
    await this.invalidateTokenVersionCache(userId);
    this.logger.log({ msg: 'All sessions revoked', userId, count, newVersion });
    return {
      message: 'All sessions have been logged out.',
      sessionsRevoked: count,
    };
  }

  // ── SGIP-2.1.3.1 + 2.1.3.2: Password Reset ────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.users.findByEmail(dto.email);

    // Always return the same response whether or not the email exists
    // (prevents user enumeration — Document 3 §2.3)
    const genericMessage = {
      message:
        'If that email address is registered, you will receive a password reset link shortly.',
    };

    if (!user || !user.emailVerifiedAt) return genericMessage;

    const resetToken = this.signPasswordResetToken(user.id);
    await this.email.sendPasswordReset(user.email, user.id, resetToken);
    this.logger.log({ msg: 'Password reset email sent', userId: user.id });

    return genericMessage;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwt.verify<{ sub: string; purpose: string }>(dto.token, {
        secret: this.getPasswordResetSecret(),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid reset token.');
    }

    // Check breached password before accepting
    await this.checkBreachedPassword(dto.newPassword);

    const newHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);
    await this.users.updatePasswordHash(payload.sub, newHash);
    // updatePasswordHash increments tokenVersion, invalidating all existing JWTs
    await this.users.revokeAllRefreshTokens(payload.sub);
    await this.invalidateTokenVersionCache(payload.sub);

    this.logger.log({ msg: 'Password reset completed', userId: payload.sub });
    return {
      message:
        'Password reset successfully. Please log in with your new password.',
    };
  }

  // ── SGIP-2.1.3.2: Change Password (authenticated) ─────────────────────────

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found.');

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect.');

    await this.checkBreachedPassword(dto.newPassword);
    const newHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.users.updatePasswordHash(userId, newHash);
    await this.users.revokeAllRefreshTokens(userId);
    await this.invalidateTokenVersionCache(userId);

    this.logger.log({ msg: 'Password changed', userId });
    return {
      message:
        'Password changed successfully. All sessions have been logged out.',
    };
  }

  // ── SGIP-2.1.4.4: Sessions ─────────────────────────────────────────────────

  async listSessions(userId: string) {
    return this.users.listActiveSessions(userId);
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    // Verify ownership — user can only revoke their own sessions (BOLA protection)
    const token = await this.users.findRefreshTokenById(sessionId);
    if (!token || token.userId !== userId) {
      throw new BadRequestException('Session not found.');
    }
    await this.users.revokeRefreshToken(sessionId);
    return { message: 'Session revoked successfully.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const genericMsg = {
      message:
        'If that email is registered and unverified, a new link has been sent.',
    };
    const user = await this.users.findByEmail(email);
    if (!user || user.emailVerifiedAt) return genericMsg;
    const token = this.signEmailVerifyToken(user.id);
    await this.email.sendEmailVerification(user.email, user.id, token);
    return genericMsg;
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private async issueTokens(
    user: { id: string; email: string; role: string; tokenVersion: number },
    deviceInfo?: string,
    ipAddress?: string,
    existingFamilyId?: string, // Pass when rotating — creates same family
  ): Promise<AuthTokens> {
    // Access token (RS256 or symmetric fallback in dev)
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = this.jwtPrivateKey
      ? this.jwt.sign(payload, {
          algorithm: 'RS256' as const,
          privateKey: this.jwtPrivateKey,
          expiresIn: this
            .accessTokenExpiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
        })
      : this.jwt.sign(payload, {
          expiresIn: this
            .accessTokenExpiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
        });

    // Refresh token — random 32 bytes, hash stored, raw returned to client
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = existingFamilyId ?? crypto.randomUUID(); // New family for fresh login
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    await this.users.createRefreshToken({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
      deviceInfo,
      ipAddress,
    });

    const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);
    return { accessToken, refreshToken: rawRefreshToken, expiresIn };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private signEmailVerifyToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId, purpose: 'email-verify' },
      {
        secret: this.getEmailTokenSecret(),
        expiresIn: '24h' as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  private signPasswordResetToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId, purpose: 'password-reset' },
      {
        secret: this.getPasswordResetSecret(),
        expiresIn: '1h' as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  private getEmailTokenSecret(): string {
    // Email verify tokens use a CSRF_SECRET derived secret, not the JWT signing key
    const csrf =
      this.config.get<string>('CSRF_SECRET') ?? 'dev-email-verify-secret';
    return `email-verify:${csrf}`;
  }

  private getPasswordResetSecret(): string {
    const csrf =
      this.config.get<string>('CSRF_SECRET') ?? 'dev-password-reset-secret';
    return `password-reset:${csrf}`;
  }

  private async invalidateTokenVersionCache(userId: string): Promise<void> {
    try {
      await this.redis.del(`user:${userId}:tokenVersion`);
    } catch {
      // Non-fatal — cache eviction failure
    }
  }

  private async checkRevokedTokenReuse(
    rawToken: string,
  ): Promise<{ userId: string } | null> {
    // Look up the hash in the DB — if found but revoked, it's a reuse attempt
    const tokenHash = this.hashToken(rawToken);
    const token =
      await this.users.findRefreshTokenByHashIncludingRevoked(tokenHash);
    if (token?.revokedAt) {
      return { userId: token.userId };
    }
    return null;
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // 15m default
    const [, num, unit] = match;
    const n = parseInt(num, 10);
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return n * (multipliers[unit] ?? 1);
  }

  // ── SGIP-2.1.3.3: Breached Password Check (HIBP k-Anonymity) ──────────────

  private async checkBreachedPassword(password: string): Promise<void> {
    // SHA-1 of password, send first 5 chars to HIBP API (k-anonymity — no full hash sent)
    const sha1 = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    try {
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          headers: {
            'Add-Padding': 'true', // Padding mode to prevent traffic analysis
            'User-Agent': 'SGIP-Platform/0.1.0',
          },
          signal: AbortSignal.timeout(3000), // 3s timeout — don't block registration
        },
      );

      if (!response.ok) {
        // HIBP unavailable — log warning but allow registration (availability > security here)
        this.logger.warn({
          msg: 'HIBP service unavailable, skipping check',
          status: response.status,
        });
        return;
      }

      const text = await response.text();
      const lines = text.split('\r\n');
      for (const line of lines) {
        const [hashSuffix, countStr] = line.split(':');
        if (hashSuffix === suffix) {
          const count = parseInt(countStr, 10);
          if (count > 0) {
            throw new BadRequestException(
              `This password has appeared in ${count.toLocaleString()} data breaches. Please choose a different password.`,
            );
          }
        }
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      // Network error — log and proceed (availability > security for this check)
      this.logger.warn({
        msg: 'HIBP check failed, skipping',
        error: (err as Error).message,
      });
    }
  }
}
