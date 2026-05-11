import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';

/**
 * Routes utilisateur authentifiées (profil / compte).
 * GET /users/me est un alias de GET /auth/me (certains clients REST attendent /users/me).
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  /**
   * Profil du compte courant — même corps que GET /auth/me.
   */
  @Get('me')
  getMe(@CurrentUser() user: AuthUserPayload) {
    return this.auth.getProfile(user.id);
  }

  /**
   * Suppression du compte courant (identifié par le JWT).
   * Après succès, le client doit effacer access/refresh en local (voir store auth).
   */
  @Delete('me')
  async deleteMe(@CurrentUser() user: AuthUserPayload) {
    await this.users.deleteSelf(user.id);
    return { ok: true };
  }
}
