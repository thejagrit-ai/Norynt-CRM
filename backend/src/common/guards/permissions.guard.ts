// src/common/guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const user = ctx.switchToHttp().getRequest().user as
      AuthenticatedUser | undefined;
    if (!user) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const granted = new Set(user.permissions ?? []);
    if (granted.has('*') || user.roles?.includes('ADMIN')) {
      return true;
    }

    const ok = required.every((p) => granted.has(p));
    if (!ok) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }
    return true;
  }
}
