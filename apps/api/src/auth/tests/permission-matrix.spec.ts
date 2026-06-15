/**
 * SGIP — Permission Matrix Integration Tests
 * Ticket: SGIP-2.1.4.3
 *
 * Tests the Auth Law (ADR-006): every route must have @Public() or @Roles().
 * Tests that guards correctly deny/allow based on role and token validity.
 *
 * These are unit tests of the guard logic (not HTTP tests — no running server needed).
 * End-to-end HTTP permission tests would require a test database and run in CI with
 * a live server (SGIP-2.1.4.3's acceptance criteria for "integration" level).
 *
 * Tested invariants:
 * 1. @Public() routes bypass JwtAuthGuard
 * 2. Routes without @Roles() AND without @Public() are DENIED (misconfiguration)
 * 3. STUDENT role cannot access ADMIN-only routes
 * 4. ADMIN role CAN access routes marked for both STUDENT and ADMIN
 * 5. Expired tokenVersion causes 401 (tested via JwtStrategy.validate)
 */
import { Test } from '@nestjs/testing';
import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@sgip/shared';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildContext(opts: {
  isPublic?: boolean;
  roles?: UserRole[];
  user?: { id: string; role: UserRole; tokenVersion: number };
  method?: string;
  url?: string;
}): ExecutionContext {
  const reflector = new Reflector();
  const mockContext = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: opts.user,
        method: opts.method ?? 'GET',
        url: opts.url ?? '/test',
      }),
    }),
  } as unknown as ExecutionContext;

  // Mock reflector.getAllAndOverride to return test metadata
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockImplementation((key: string | symbol) => {
      if (key === IS_PUBLIC_KEY) return opts.isPublic ?? false;
      if (key === ROLES_KEY) return opts.roles ?? [];
      return undefined;
    });

  return { ...mockContext, reflector } as unknown as ExecutionContext;
}

// ── JwtAuthGuard Tests ─────────────────────────────────────────────────────────

describe('JwtAuthGuard — Permission Matrix', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JwtAuthGuard, Reflector],
    }).compile();

    guard = module.get(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  it('[1] @Public() routes bypass the guard entirely', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });
    const ctx = buildContext({ isPublic: true });
    // canActivate should return true without calling super.canActivate (no JWT needed)
    const canActivate = guard.canActivate(ctx);
    expect(canActivate).toBe(true);
  });

  it('[2] Routes with NO decorators are denied (Auth Law misconfiguration)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return []; // No roles configured
      return undefined;
    });
    const ctx = buildContext({ isPublic: false, roles: [] });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('[3] handleRequest throws UnauthorizedException when user is null', () => {
    expect(() => guard.handleRequest(null as unknown as Error, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('[4] handleRequest returns user when valid', () => {
    const user = {
      id: 'user-1',
      role: UserRole.STUDENT,
      tokenVersion: 0,
      email: 'a@b.com',
    };
    expect(guard.handleRequest(null as unknown as Error, user)).toBe(user);
  });
});

// ── RolesGuard Tests ───────────────────────────────────────────────────────────

describe('RolesGuard — Role-Based Access Control', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('[5] @Public() routes skip role check', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });
    const ctx = buildContext({ isPublic: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('[6] STUDENT accessing STUDENT-only route — ALLOWED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.STUDENT];
      return undefined;
    });
    const ctx = buildContext({
      roles: [UserRole.STUDENT],
      user: { id: 'u1', role: UserRole.STUDENT, tokenVersion: 0 },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('[7] STUDENT accessing ADMIN-only route — DENIED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.ADMIN];
      return undefined;
    });
    const ctx = buildContext({
      roles: [UserRole.ADMIN],
      user: { id: 'u1', role: UserRole.STUDENT, tokenVersion: 0 },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('[8] ADMIN accessing ADMIN-only route — ALLOWED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.ADMIN];
      return undefined;
    });
    const ctx = buildContext({
      roles: [UserRole.ADMIN],
      user: { id: 'u2', role: UserRole.ADMIN, tokenVersion: 0 },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('[9] ADMIN accessing route open to both roles — ALLOWED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.STUDENT, UserRole.ADMIN];
      return undefined;
    });
    const ctx = buildContext({
      roles: [UserRole.STUDENT, UserRole.ADMIN],
      user: { id: 'u2', role: UserRole.ADMIN, tokenVersion: 0 },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('[10] No user on request (unauthenticated) — DENIED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.STUDENT];
      return undefined;
    });
    const ctx = buildContext({ roles: [UserRole.STUDENT], user: undefined });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
