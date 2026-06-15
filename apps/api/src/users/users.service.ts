/**
 * SGIP — Users Service
 * Ticket: SGIP-2.1.1.1
 *
 * Provides user lookup and creation operations for the auth layer.
 * Enforces soft-delete semantics (User.deletedAt — never hard delete).
 * Ownership checks are the responsibility of callers, not this service.
 */
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Finders ────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
    });
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  // ── Mutators ────────────────────────────────────────────────────────────────

  async create(data: {
    email: string;
    passwordHash: string;
    role?: 'STUDENT' | 'ADMIN';
  }): Promise<User> {
    const email = data.email.toLowerCase().trim();

    // Check for existing active OR soft-deleted account with this email
    const existing = await this.findByEmailIncludingDeleted(email);
    if (existing) {
      throw new ConflictException(
        'An account with this email address already exists.',
      );
    }

    return this.prisma.user.create({
      data: {
        email,
        passwordHash: data.passwordHash,
        role: data.role ?? 'STUDENT',
        tokenVersion: 0,
        // emailVerifiedAt is null until the user clicks the verification link
      },
    });
  }

  async markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async updatePasswordHash(userId: string, newHash: string): Promise<User> {
    // Incrementing tokenVersion invalidates all existing JWT access tokens
    // and triggers reauth on next request (ADR-2.1.4.2).
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 },
      },
    });
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });
    return updated.tokenVersion;
  }

  async softDelete(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    this.logger.log({ msg: 'User soft-deleted', userId });
  }

  // ── Session / Refresh Token helpers ────────────────────────────────────────

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string; // Token family for rotation chain; full family revoked on reuse
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    return this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async findRefreshTokenByHashIncludingRevoked(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async findRefreshTokenById(id: string) {
    return this.prisma.refreshToken.findUnique({ where: { id } });
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { count: result.count };
  }

  async listActiveSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        deviceInfo: true,
        ipAddress: true,
      },
    });
  }
}
