/**
 * SGIP — Auth DTOs
 * Tickets: SGIP-2.1.1.1, SGIP-2.1.2.1, SGIP-2.1.3.1, SGIP-2.1.3.2
 *
 * Validated at the controller layer by the global ValidationPipe.
 * whitelist:true strips unknown fields; forbidNonWhitelisted:true rejects them.
 */
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ── Registration ──────────────────────────────────────────────────────────────

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128, { message: 'Password must be at most 128 characters.' })
  password!: string;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export class LoginDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

// ── Email Verification ────────────────────────────────────────────────────────

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

// ── Password Reset Request ────────────────────────────────────────────────────

export class ForgotPasswordDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

// ── Password Reset Confirmation ───────────────────────────────────────────────

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  newPassword!: string;
}

// ── Change Password ───────────────────────────────────────────────────────────

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

// ── Revoke Session ────────────────────────────────────────────────────────────

export class RevokeSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  reason?: string;
}
