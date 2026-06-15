/**
 * SGIP — Current User Decorator
 *
 * Extracts the authenticated user from the request object.
 * Populated by JwtAuthGuard after token verification.
 *
 * Usage:
 *   @Roles(UserRole.STUDENT)
 *   @Get('me/profile')
 *   async getProfile(@CurrentUser() user: RequestUser) { ... }
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@sgip/shared';

/**
 * The shape of the user object attached to every authenticated request.
 * Contains only the JWT claims — no PII (per Document 3, Section 3).
 */
export interface RequestUser {
  sub: string; // userId (UUID)
  role: UserRole;
  studentProfileId?: string; // Present if role = STUDENT
  tokenVersion: number; // Used to invalidate tokens on password change / role change
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);
