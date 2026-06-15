/**
 * SGIP — Roles Decorator
 *
 * Declares which user roles are permitted to access a route.
 *
 * CRITICAL (Document 3 §2.1 / ADR-006): Every route must have EITHER this decorator
 * OR @Public(). A route with neither is rejected by the JwtAuthGuard (default-deny).
 *
 * Usage:
 *   @Roles(UserRole.ADMIN)
 *   @Get('users')
 *   async listUsers() { ... }
 *
 *   @Roles(UserRole.STUDENT, UserRole.ADMIN)  // Multiple roles allowed
 *   @Get('profile')
 *   async getProfile() { ... }
 */
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@sgip/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Shorthand decorators for common single-role guards.
 * These are convenience wrappers — they produce the same effect as @Roles().
 */
export const StudentOnly = () => Roles(UserRole.STUDENT);
export const AdminOnly = () => Roles(UserRole.ADMIN);
export const AnyRole = () => Roles(UserRole.STUDENT, UserRole.ADMIN);
