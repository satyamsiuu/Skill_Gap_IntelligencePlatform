/**
 * SGIP — JWT Strategy (Passport)
 * Tickets: SGIP-2.1.2.2, SGIP-2.1.4.1, SGIP-2.1.4.2
 *
 * Validates RS256-signed access tokens from the Authorization Bearer header.
 *
 * Token payload schema:
 * {
 *   sub:          string  — userId
 *   email:        string
 *   role:         UserRole
 *   tokenVersion: number  — compared to User.tokenVersion to detect invalidation
 *   iat:          number
 *   exp:          number
 * }
 *
 * tokenVersion check (ADR-2.1.4.2):
 * If token.tokenVersion < user.currentTokenVersion, the token was issued before
 * a password change or "log out all devices" action → reject with 401.
 * A short-TTL Redis cache (60s) reduces DB reads per request.
 */
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { RedisService } from '../../common/redis/redis.service';
import { UserRole } from '@sgip/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// This is what gets attached to request.user after strategy validates
export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly TOKEN_VERSION_CACHE_TTL = 60; // seconds

  constructor(
    config: ConfigService,
    private readonly users: UsersService,
    private readonly redis: RedisService,
  ) {
    const publicKey = config.get<string>('JWT_PUBLIC_KEY');

    if (!publicKey && config.get<string>('NODE_ENV') === 'production') {
      throw new Error('JWT_PUBLIC_KEY is required in production');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      // In dev without keys, use a fallback symmetric secret for easier local testing
      secretOrKey: publicKey
        ? Buffer.from(publicKey, 'base64').toString('utf-8')
        : 'dev-fallback-symmetric-secret-NOT-FOR-PRODUCTION',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const { sub: userId, tokenVersion } = payload;

    // ── tokenVersion check (SGIP-2.1.4.2) ────────────────────────────────────
    // Check Redis cache first, then DB
    const cacheKey = `user:${userId}:tokenVersion`;
    let currentVersion: number | null = null;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) {
        currentVersion = parseInt(cached, 10);
      }
    } catch {
      // Redis unavailable — fall through to DB check
    }

    if (currentVersion === null) {
      const user = await this.users.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User account not found.');
      }
      if (user.deletedAt) {
        throw new UnauthorizedException('User account has been deactivated.');
      }
      currentVersion = user.tokenVersion;

      // Cache the tokenVersion briefly to reduce DB reads
      try {
        await this.redis.set(
          cacheKey,
          String(currentVersion),
          this.TOKEN_VERSION_CACHE_TTL,
        );
      } catch {
        // Redis cache write failure is non-fatal
      }
    }

    if (tokenVersion < currentVersion) {
      throw new UnauthorizedException(
        'Your session has been invalidated. Please log in again.',
      );
    }

    return {
      id: userId,
      email: payload.email,
      role: payload.role,
      tokenVersion,
    };
  }
}
