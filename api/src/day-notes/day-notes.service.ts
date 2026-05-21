import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_TEXT = 500;

@Injectable()
export class DayNotesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Notes de l'utilisateur pour une année civile (dateKey commence par YYYY-). */
  async listForYear(userId: string, year: number) {
    const prefix = `${year}-`;
    const rows = await this.prisma.dayNote.findMany({
      where: {
        userId,
        dateKey: { startsWith: prefix },
        NOT: { text: '' },
      },
      orderBy: { dateKey: 'asc' },
      select: { dateKey: true, text: true, updatedAt: true },
    });
    return rows;
  }

  /** Crée, met à jour ou supprime la note du jour (texte vide → suppression). */
  async upsert(userId: string, dateKey: string, rawText: string) {
    const text = rawText.trim().slice(0, MAX_TEXT);

    if (!text) {
      await this.prisma.dayNote.deleteMany({
        where: { userId, dateKey },
      });
      return null;
    }

    return this.prisma.dayNote.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      create: { userId, dateKey, text },
      update: { text },
      select: { dateKey: true, text: true, updatedAt: true },
    });
  }
}
