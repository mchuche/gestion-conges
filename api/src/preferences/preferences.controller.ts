import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { PreferencesService } from './preferences.service';
import { PatchPreferencesDto } from './dto/patch-preferences.dto';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get()
  getMine(@CurrentUser() user: AuthUserPayload) {
    return this.preferences.getMine(user.id);
  }

  @Patch()
  patch(@CurrentUser() user: AuthUserPayload, @Body() dto: PatchPreferencesDto) {
    return this.preferences.patch(user.id, dto);
  }
}
