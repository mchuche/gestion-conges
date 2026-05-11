import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRecurringEventDto } from './dto/create-recurring-event.dto';
import type { UpdateRecurringEventDto } from './dto/update-recurring-event.dto';

/** Format attendu par `generateRecurringOccurrences` (snake_case). */
function toSnake(e: {
  id: string;
  userId: string;
  leaveTypeId: string;
  period: string;
  recurrenceType: string;
  recurrencePattern: Prisma.JsonValue;
  startDate: Date;
  endDate: Date | null;
  maxOccurrences: number | null;
  excludedDates: Prisma.JsonValue;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: e.id,
    user_id: e.userId,
    leave_type_id: e.leaveTypeId,
    period: e.period,
    recurrence_type: e.recurrenceType,
    recurrence_pattern: e.recurrencePattern,
    start_date: e.startDate.toISOString().split('T')[0],
    end_date: e.endDate ? e.endDate.toISOString().split('T')[0] : null,
    max_occurrences: e.maxOccurrences,
    excluded_dates: e.excludedDates,
    name: e.name,
    is_active: e.isActive,
    created: e.createdAt,
    updated_at: e.updatedAt,
  };
}

function parseDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Date invalide');
  return d;
}

@Injectable()
export class RecurringEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    const rows = await this.prisma.recurringEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSnake);
  }

  async listForUsers(userIds: string[]) {
    if (!userIds.length) return {};
    const rows = await this.prisma.recurringEvent.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const out: Record<string, ReturnType<typeof toSnake>[]> = {};
    for (const r of rows) {
      const o = toSnake(r);
      if (!out[r.userId]) out[r.userId] = [];
      out[r.userId].push(o);
    }
    return out;
  }

  async create(userId: string, dto: CreateRecurringEventDto) {
    const row = await this.prisma.recurringEvent.create({
      data: {
        userId,
        leaveTypeId: dto.leaveTypeId,
        period: dto.period ?? 'full',
        recurrenceType: dto.recurrenceType,
        recurrencePattern: dto.recurrencePattern as Prisma.InputJsonValue,
        startDate: parseDate(dto.startDate),
        endDate: dto.endDate ? parseDate(dto.endDate) : null,
        maxOccurrences: dto.maxOccurrences ?? null,
        excludedDates: (dto.excludedDates ?? []) as Prisma.InputJsonValue,
        name: dto.name ?? null,
        isActive: dto.isActive !== false,
      },
    });
    return toSnake(row);
  }

  async update(userId: string, eventId: string, dto: UpdateRecurringEventDto) {
    const existing = await this.prisma.recurringEvent.findUnique({
      where: { id: eventId },
    });
    if (!existing || existing.userId !== userId) {
      throw new ForbiddenException('Événement introuvable ou non autorisé');
    }
    const row = await this.prisma.recurringEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.leaveTypeId != null && { leaveTypeId: dto.leaveTypeId }),
        ...(dto.period != null && { period: dto.period }),
        ...(dto.recurrenceType != null && { recurrenceType: dto.recurrenceType }),
        ...(dto.recurrencePattern != null && {
          recurrencePattern: dto.recurrencePattern as Prisma.InputJsonValue,
        }),
        ...(dto.startDate != null && { startDate: parseDate(dto.startDate) }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? parseDate(dto.endDate) : null,
        }),
        ...(dto.maxOccurrences !== undefined && {
          maxOccurrences: dto.maxOccurrences,
        }),
        ...(dto.excludedDates != null && {
          excludedDates: dto.excludedDates as Prisma.InputJsonValue,
        }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive != null && { isActive: dto.isActive }),
      },
    });
    return toSnake(row);
  }

  async delete(userId: string, eventId: string) {
    const existing = await this.prisma.recurringEvent.findUnique({
      where: { id: eventId },
    });
    if (!existing || existing.userId !== userId) {
      throw new ForbiddenException('Événement introuvable ou non autorisé');
    }
    await this.prisma.recurringEvent.delete({ where: { id: eventId } });
    return { ok: true };
  }

  async findOneForUser(userId: string, eventId: string) {
    const e = await this.prisma.recurringEvent.findFirst({
      where: { id: eventId, userId },
    });
    if (!e) throw new NotFoundException();
    return toSnake(e);
  }
}
