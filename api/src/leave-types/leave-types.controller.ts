import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { LeaveTypesService } from './leave-types.service';
import { UpdateCustomizationDto } from './dto/update-customization.dto';
import { SaveLeaveTypesDto } from './dto/save-leave-types.dto';

/**
 * Types de congés fusionnés (globaux + personnalisation utilisateur).
 */
@Controller('leave-types')
@UseGuards(JwtAuthGuard)
export class LeaveTypesController {
  constructor(private readonly leaveTypes: LeaveTypesService) {}

  @Get()
  async list(@CurrentUser() user: AuthUserPayload) {
    const leaveTypes = await this.leaveTypes.getMergedForUser(user.id);
    return { leaveTypes };
  }

  @Patch('customizations')
  async patchCustomization(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateCustomizationDto,
  ) {
    await this.leaveTypes.upsertColor(user.id, dto.globalTypeId, dto.color);
    return { ok: true };
  }

  /**
   * Sauvegarde batch des couleurs (après édition dans les paramètres / modale).
   * Validation légère : les couleurs sont vérifiées dans upsert côté service si besoin.
   */
  @Post('save')
  async save(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: SaveLeaveTypesDto,
  ) {
    await this.leaveTypes.saveManyFromMerged(user.id, body.items ?? []);
    return { ok: true };
  }
}
