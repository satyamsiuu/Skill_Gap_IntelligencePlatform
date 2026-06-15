/**
 * SGIP — Roles Guard
 *
 * Enforces role-based access control after JWT authentication.
 * Works in conjunction with JwtAuthGuard (which runs first).
 *
 * Checks: user.role matches any of the roles specified by @Roles() on the route.
 *
 * Note on ownership (BOLA / IDOR, Document 3, Section 2.3):
 * This guard enforces ROLE-level access. For resource-level ownership checks
 * (e.g., "only the owning student can access this StudentProfile"), those
 * must be implemented at the SERVICE layer, not here.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '@sgip/shared';
import { RequestUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Public routes skip role checks entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() means JwtAuthGuard already denied the request — we won't reach here
    if (!requiredRoles || requiredRoles.length === 0) return false;

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;

    if (!user) return false;

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
