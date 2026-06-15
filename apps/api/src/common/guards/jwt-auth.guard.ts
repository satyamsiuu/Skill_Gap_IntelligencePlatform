/**
 * SGIP — JWT Authentication Guard (Global)
 *
 * This guard is registered globally via APP_GUARD in AppModule.
 * It enforces authentication on ALL routes by default (default-deny, ADR-006).
 *
 * Routes that need to be public must use the @Public() decorator.
 * Routes must also have @Roles() to be accessible after authentication.
 *
 * Validates:
 * 1. JWT signature and expiry
 * 2. tokenVersion — prevents access with tokens issued before a password change
 *    or "log out all devices" action (Document 3, Section 3)
 */
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // ── @Public() check ───────────────────────────────────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // ── Enforce @Roles() or @Public() requirement ─────────────────────────────
    // A route with NEITHER decorator is a misconfiguration — fail loudly.
    // This enforces the Auth Law (ADR-006). The CI check (SGIP-1.2.1.3)
    // catches this statically; this is the runtime safety net.
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      const request = context.switchToHttp().getRequest();
      this.logger.error(
        `SECURITY: Route ${request.method} ${request.url} has neither @Public() nor @Roles() decorator. ` +
          `This violates the Auth Law (ADR-006). Route will be denied.`,
      );
      // Deny access — misconfigured routes are treated as unauthorized, not open
      throw new UnauthorizedException(
        'Route authorization is not configured. Please contact the platform administrator.',
      );
    }

    // Delegate to passport JWT strategy for token verification
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        err?.message ?? 'Authentication required. Please log in.',
      );
    }
    return user;
  }
}
