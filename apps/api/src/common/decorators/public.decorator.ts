/**
 * SGIP — Public Route Decorator
 *
 * Marks a route as publicly accessible (no authentication required).
 * Must be applied to authentication routes (login, register, etc.)
 *
 * CRITICAL (Document 3 §2.1 / ADR-006): Every route must have EITHER this decorator
 * OR @Roles(...). A route with neither is rejected at the JwtAuthGuard level.
 *
 * The CI check from SGIP-1.2.1.3 scans for routes missing both decorators.
 *
 * Usage:
 *   @Public()
 *   @Post('login')
 *   async login(@Body() dto: LoginDto) { ... }
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
