import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PatchPreferencesDto } from './dto/patch-preferences.dto';
import {
  DEFAULT_MAIN_BALANCE_TYPE_IDS,
  normalizeMainBalanceTypeIds,
} from './main-balance-defaults';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(p: {
    selectedCountry: string;
    weekStartDay: number;
    eventOpacity: number;
    holidayWeekendIntensity: string;
    themeMode: string;
    mainBalanceTypeIds: Prisma.JsonValue;
    allowWeekendHolidayLeave: boolean;
    showSchoolHolidays: boolean;
    schoolHolidayZone: string | null;
  }) {
    const zone = p.schoolHolidayZone?.trim().toUpperCase() || null;
    return {
      selected_country: p.selectedCountry,
      week_start_day: p.weekStartDay,
      event_opacity: p.eventOpacity,
      holiday_weekend_intensity: p.holidayWeekendIntensity,
      theme_mode: p.themeMode,
      main_balance_type_ids: normalizeMainBalanceTypeIds(p.mainBalanceTypeIds),
      allow_weekend_holiday_leave: p.allowWeekendHolidayLeave,
      show_school_holidays: p.showSchoolHolidays,
      school_holiday_zone: zone && ['A', 'B', 'C'].includes(zone) ? zone : null,
    };
  }

  private normalizeSchoolHolidayZone(value?: string | null): string | null {
    if (value == null || value === '') return null;
    const z = value.trim().toUpperCase();
    return ['A', 'B', 'C'].includes(z) ? z : null;
  }

  /** Ne garde que les types existants et éligibles au bandeau principal. */
  private async sanitizeMainBalanceTypeIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [...DEFAULT_MAIN_BALANCE_TYPE_IDS];

    const eligible = await this.prisma.globalLeaveType.findMany({
      where: { eligibleForMainBalance: true, id: { in: ids } },
      select: { id: true },
    });
    const allowed = new Set(eligible.map((r) => r.id));
    const filtered = ids.filter((id) => allowed.has(id));
    return filtered.length > 0 ? filtered : [...DEFAULT_MAIN_BALANCE_TYPE_IDS];
  }

  async getMine(userId: string) {
    let p = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    if (!p) {
      p = await this.prisma.userPreferences.create({
        data: {
          userId,
          mainBalanceTypeIds: [...DEFAULT_MAIN_BALANCE_TYPE_IDS],
        },
      });
    }
    return this.toResponse(p);
  }

  async patch(userId: string, dto: PatchPreferencesDto) {
    let mainBalancePatch: Prisma.InputJsonValue | undefined;
    if (dto.mainBalanceTypeIds !== undefined) {
      if (!Array.isArray(dto.mainBalanceTypeIds)) {
        throw new BadRequestException(
          'mainBalanceTypeIds doit être un tableau de chaînes',
        );
      }
      const sanitized = await this.sanitizeMainBalanceTypeIds(
        dto.mainBalanceTypeIds,
      );
      mainBalancePatch = sanitized;
    }

    const row = await this.prisma.userPreferences.upsert({
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
        ...(mainBalancePatch !== undefined && {
          mainBalanceTypeIds: mainBalancePatch,
        }),
        ...(dto.allowWeekendHolidayLeave != null && {
          allowWeekendHolidayLeave: dto.allowWeekendHolidayLeave,
        }),
        ...(dto.showSchoolHolidays != null && {
          showSchoolHolidays: dto.showSchoolHolidays,
        }),
        ...(dto.schoolHolidayZone !== undefined && {
          schoolHolidayZone: this.normalizeSchoolHolidayZone(dto.schoolHolidayZone),
        }),
      },
      update: {
        ...(dto.selectedCountry != null && { selectedCountry: dto.selectedCountry }),
        ...(dto.weekStartDay != null && { weekStartDay: dto.weekStartDay }),
        ...(dto.eventOpacity != null && { eventOpacity: dto.eventOpacity }),
        ...(dto.holidayWeekendIntensity != null && {
          holidayWeekendIntensity: dto.holidayWeekendIntensity,
        }),
        ...(dto.themeMode != null && { themeMode: dto.themeMode }),
        ...(mainBalancePatch !== undefined && {
          mainBalanceTypeIds: mainBalancePatch,
        }),
        ...(dto.allowWeekendHolidayLeave != null && {
          allowWeekendHolidayLeave: dto.allowWeekendHolidayLeave,
        }),
        ...(dto.showSchoolHolidays != null && {
          showSchoolHolidays: dto.showSchoolHolidays,
        }),
        ...(dto.schoolHolidayZone !== undefined && {
          schoolHolidayZone: this.normalizeSchoolHolidayZone(dto.schoolHolidayZone),
        }),
      },
    });

    return this.toResponse(row);
  }
}
