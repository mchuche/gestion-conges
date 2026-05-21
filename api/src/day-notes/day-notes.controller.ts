import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { DayNotesService } from './day-notes.service';
import { PatchDayNoteDto } from './dto/patch-day-note.dto';

@Controller('day-notes')
@UseGuards(JwtAuthGuard)
export class DayNotesController {
  constructor(private readonly dayNotes: DayNotesService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUserPayload,
    @Query('year') yearRaw?: string,
  ) {
    const year = parseInt(yearRaw ?? String(new Date().getFullYear()), 10);
    const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
    const items = await this.dayNotes.listForYear(user.id, safeYear);
    return { items };
  }

  @Patch()
  async patch(@CurrentUser() user: AuthUserPayload, @Body() dto: PatchDayNoteDto) {
    const item = await this.dayNotes.upsert(user.id, dto.dateKey, dto.text ?? '');
    return { item };
  }
}
