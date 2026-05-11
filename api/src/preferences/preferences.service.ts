import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PatchPreferencesDto } from './dto/patch-preferences.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(p: {
    selectedCountry: string;
    weekStartDay: number;
    eventOpacity: number;
    holidayWeekendIntensity: string;
    themeMode: string;
  }) {
    return {
      selected_country: p.selectedCountry,
      week_start_day: p.weekStartDay,
      event_opacity: p.eventOpacity,
      holiday_weekend_intensity: p.holidayWeekendIntensity,
      theme_mode: p.themeMode,
    };
  }

  async getMine(userId: string) {
    let p = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    if (!p) {
      p = await this.prisma.userPreferences.create({
        data: { userId },
      });
    }
    return this.toResponse(p);
  }

  async patch(userId: string, dto: PatchPreferencesDto) {
    return this.prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...(dto.selectedCountry != null && { selectedCountry: dto.selectedCountry }),
        ...(dto.weekStartDay != null && { weekStartDay: dto.weekStartDay }),
        ...(dto.eventOpacity != null && { eventOpacity: dto.eventOpacity }),
        ...(dto.holidayWeekendIntensity != null && {
          holidayWeekendIntensity: dto.holidayWeekendIntensity,
        }),
        ...(dto.themeMode != null && { themeMode: dto.themeMode }),
      },
      update: {
        ...(dto.selectedCountry != null && { selectedCountry: dto.selectedCountry }),
        ...(dto.weekStartDay != null && { weekStartDay: dto.weekStartDay }),
        ...(dto.eventOpacity != null && { eventOpacity: dto.eventOpacity }),
        ...(dto.holidayWeekendIntensity != null && {
          holidayWeekendIntensity: dto.holidayWeekendIntensity,
        }),
        ...(dto.themeMode != null && { themeMode: dto.themeMode }),
      },
    });
  }
}
