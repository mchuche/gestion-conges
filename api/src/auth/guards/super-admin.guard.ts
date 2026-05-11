import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthUserPayload } from '../auth.types';

/** Suppression d’utilisateurs, actions sensibles — JWT : is_super_admin. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: AuthUserPayload }>();
    const user = req.user;
    if (!user?.is_super_admin) {
      throw new ForbiddenException('Accès super-administrateur requis');
    }
    return true;
  }
}
