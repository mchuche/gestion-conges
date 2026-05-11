import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthUserPayload } from '../auth.types';

/** Accès réservé aux comptes avec entrée `app_admins` (JWT : is_admin). */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: AuthUserPayload }>();
    const user = req.user;
    if (!user?.is_admin) {
      throw new ForbiddenException('Accès administrateur requis');
    }
    return true;
  }
}
