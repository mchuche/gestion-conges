import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { LeavesService } from './leaves.service';
import { SyncLeavesDto } from './dto/sync-leaves.dto';
import { PatchLeaveDto } from './dto/patch-leave.dto';
import { PatchLeaveForUserDto } from './dto/patch-leave-for-user.dto';

/**
 * CRUD congés pour l’utilisateur JWT courant + lecture agrégée pour le calendrier équipe.
 */
@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leaves: LeavesService) {}

  /**
   * Liste des congés du user connecté (tableau d’objets ; le front peut en faire une map dateKey -> type).
   */
  @Get()
  async list(@CurrentUser() user: AuthUserPayload) {
    const items = await this.leaves.listMine(user.id);
    return { items };
  }

  /**
   * Congés groupés par userId pour les IDs demandés (séparés par des virgules).
   */
  @Get('team')
  async team(
    @CurrentUser() _user: AuthUserPayload,
    @Query('userIds') userIdsRaw: string,
  ) {
    const userIds = (userIdsRaw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const byUser = await this.leaves.listForUsers(userIds);
    return { byUser };
  }

  /** Synchronisation complète (remplace l’état serveur par `entries`). */
  @Post('sync')
  async sync(@CurrentUser() user: AuthUserPayload, @Body() dto: SyncLeavesDto) {
    await this.leaves.sync(user.id, dto.entries ?? {});
    return { ok: true };
  }

  /** Mise à jour / suppression d’un jour pour l’utilisateur connecté. */
  @Patch()
  async patch(@CurrentUser() user: AuthUserPayload, @Body() dto: PatchLeaveDto) {
    const row = await this.leaves.patch(user.id, dto.dateKey, dto.leaveTypeId);
    return { item: row };
  }

  /**
   * Même chose pour un autre utilisateur (règles « événement seulement » si ce n’est pas soi).
   * Body identique à PATCH /leaves + `targetUserId`.
   */
  @Patch('for-user')
  async patchForUser(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: PatchLeaveForUserDto,
  ) {
    const row = await this.leaves.patchForUser(
      user.id,
      dto.targetUserId,
      dto.dateKey,
      dto.leaveTypeId,
    );
    return { item: row };
  }
}
