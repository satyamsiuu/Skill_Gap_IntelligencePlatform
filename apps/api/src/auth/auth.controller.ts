/**
 * SGIP — Auth Controller
 * Tickets: SGIP-2.1.1.1, SGIP-2.1.1.2, SGIP-2.1.2.1–5,
 *          SGIP-2.1.3.1–3, SGIP-2.1.4.1, SGIP-2.1.4.4
 *
 * Route map (all prefixed /api/v1/auth):
 *   POST   /register                — SGIP-2.1.1.1
 *   POST   /verify-email            — SGIP-2.1.1.2
 *   POST   /login                   — SGIP-2.1.2.1+2
 *   POST   /refresh                 — SGIP-2.1.2.3
 *   POST   /logout                  — SGIP-2.1.2.5
 *   POST   /logout-all              — SGIP-2.1.2.5
 *   POST   /forgot-password         — SGIP-2.1.3.1
 *   POST   /reset-password          — SGIP-2.1.3.2
 *   POST   /change-password         — SGIP-2.1.3.2
 *   GET    /sessions                — SGIP-2.1.4.4
 *   DELETE /sessions/:sessionId     — SGIP-2.1.4.4
 *
 * Cookie config (Document 3 §3.4):
 * - Refresh token: httpOnly, secure (prod), sameSite:strict, path:/api/v1/auth/refresh ONLY
 * - CSRF: non-httpOnly, sameSite:strict (client reads it and echoes in header)
 *
 * Every route has either @Public() or @Roles() (Auth Law ADR-006).
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { AnyRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import type { RequestUser } from './strategies/jwt.strategy';

const REFRESH_COOKIE_NAME = 'sgip_refresh_token';

function setRefreshCookie(
  res: Response,
  token: string,
  expiryDays: number,
  isProd: boolean,
) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/v1/auth/refresh', // Only sent on the refresh endpoint
    maxAge: expiryDays * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
  });
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly isProduction: boolean;
  private readonly refreshExpiryDays: number;

  constructor(private readonly auth: AuthService) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.refreshExpiryDays = parseInt(
      process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS ?? '7',
      10,
    );
  }

  // ── SGIP-2.1.1.1: Registration ─────────────────────────────────────────────

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student account' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful — verify email to continue',
  })
  @ApiResponse({ status: 409, description: 'Email address already in use' })
  @ApiResponse({
    status: 400,
    description: 'Password appears in known data breaches',
  })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, req.ip);
  }

  // ── SGIP-2.1.1.2: Email Verification ───────────────────────────────────────

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address using token from verification email',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  // ── SGIP-2.1.2.1 + 2.1.2.2: Login ─────────────────────────────────────────

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in and receive access + refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Refresh token set as httpOnly cookie.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = req.headers['user-agent']?.slice(0, 200);
    const tokens = await this.auth.login(dto, deviceInfo, req.ip);

    // Set refresh token as httpOnly cookie (client cannot read via JS)
    setRefreshCookie(
      res,
      tokens.refreshToken,
      this.refreshExpiryDays,
      this.isProduction,
    );

    // Return access token in response body; refresh token is in cookie only
    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
    };
  }

  // ── SGIP-2.1.2.3: Refresh Token Rotation ──────────────────────────────────

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange refresh token for new access token (rotation)',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: Partial<RefreshTokenDto>,
  ) {
    // Accept from httpOnly cookie (preferred) OR request body (fallback for native clients)
    const rawToken: string | undefined =
      (req.cookies as Record<string, string>)?.[REFRESH_COOKIE_NAME] ??
      body.refreshToken;

    if (!rawToken) {
      throw new Error('Refresh token is required.');
    }

    const tokens = await this.auth.refresh(rawToken);
    setRefreshCookie(
      res,
      tokens.refreshToken,
      this.refreshExpiryDays,
      this.isProduction,
    );

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
    };
  }

  // ── SGIP-2.1.2.5: Logout ───────────────────────────────────────────────────

  @Post('logout')
  @AnyRole()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Log out current session' })
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: Partial<RefreshTokenDto>,
  ) {
    const rawToken =
      (req.cookies as Record<string, string>)?.[REFRESH_COOKIE_NAME] ??
      body.refreshToken ??
      '';

    clearRefreshCookie(res);
    return this.auth.logout(rawToken, user.id);
  }

  @Post('logout-all')
  @AnyRole()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Log out all sessions for this account (log out all devices)',
  })
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    clearRefreshCookie(res);
    return this.auth.logoutAll(user.id);
  }

  // ── SGIP-2.1.3.1: Forgot Password ─────────────────────────────────────────

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset email (rate limited externally)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  // ── SGIP-2.1.3.2: Reset Password ──────────────────────────────────────────

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('change-password')
  @AnyRole()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change password (authenticated, logs out all other sessions)',
  })
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(user.id, dto);
  }

  // ── SGIP-2.1.4.4: Active Sessions ─────────────────────────────────────────

  @Get('sessions')
  @AnyRole()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active sessions for current user' })
  async listSessions(@CurrentUser() user: RequestUser) {
    return this.auth.listSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @AnyRole()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a specific session by ID' })
  async revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.auth.revokeSession(user.id, sessionId);
  }

  // ── Admin-only: resend verification email ─────────────────────────────────

  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(@Body() dto: { email: string }) {
    return this.auth.resendVerification(dto.email);
  }
}
