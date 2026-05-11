import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUserPayload } from '../auth.types';

/**
 * Extrait l’utilisateur authentifié depuis la requête HTTP (rempli par JwtStrategy).
 *
 * @example async me(@CurrentUser() user: AuthUserPayload) { … }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUserPayload }>();
    return request.user;
  },
);
