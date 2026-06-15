/**
 * SGIP — Email Service
 * Ticket: SGIP-2.1.1.1 / SGIP-2.1.1.2
 *
 * Sends transactional emails via SMTP (nodemailer).
 * Designed with a port/adapter pattern — the interface is stable, the transport
 * is swappable (SMTP → Resend → SES → stub) without changing callers.
 *
 * In development (no SMTP configured): logs email content to console.
 * In production: requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM.
 *
 * NEVER log: token values in URLs (only log the userId receiving the email).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly baseUrl: string;
  private readonly isDevMode: boolean;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = config.get<number>('SMTP_PORT', 587);
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    this.from = config.get<string>('EMAIL_FROM', 'noreply@sgip.local');
    this.baseUrl = config.get<string>('APP_BASE_URL', 'http://localhost:3000');
    this.isDevMode = config.get<string>('NODE_ENV') !== 'production';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Email transport: SMTP → ${host}:${port}`);
    } else {
      this.transporter = null;
      this.logger.warn(
        'Email transport: STUB (no SMTP config). Emails will be logged to console.',
      );
    }
  }

  // ── Verification ───────────────────────────────────────────────────────────

  async sendEmailVerification(
    to: string,
    userId: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${this.baseUrl}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your SGIP account',
      html: `
        <h2>Welcome to SGIP</h2>
        <p>Click the link below to verify your email address. The link expires in 24 hours.</p>
        <a href="${verifyUrl}" style="padding:12px 24px;background:#6E6AF6;color:#fff;border-radius:8px;text-decoration:none;display:inline-block;">
          Verify Email
        </a>
        <p style="color:#9AA4B2;font-size:12px;margin-top:16px;">If you didn't create an account, you can safely ignore this email.</p>
      `,
    });
    this.logger.log({ msg: 'Verification email sent', userId });
  }

  // ── Password Reset ─────────────────────────────────────────────────────────

  async sendPasswordReset(
    to: string,
    userId: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your SGIP password',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. The link expires in 1 hour.</p>
        <a href="${resetUrl}" style="padding:12px 24px;background:#6E6AF6;color:#fff;border-radius:8px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
        <p style="color:#9AA4B2;font-size:12px;margin-top:16px;">If you didn't request this, you can safely ignore this email. Your password has not changed.</p>
      `,
    });
    this.logger.log({ msg: 'Password reset email sent', userId });
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async send(opts: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      // Dev stub: log to console
      this.logger.log({
        msg: '[EMAIL STUB] Would send email',
        to: opts.to,
        subject: opts.subject,
        // Log a preview snippet only, not the full HTML (no token in logs)
        preview:
          opts.html
            .slice(0, 100)
            .replace(/<[^>]+>/g, '')
            .trim() + '...',
      });
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  }
}
