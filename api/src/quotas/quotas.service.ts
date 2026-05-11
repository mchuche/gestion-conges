import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Structure front : { [year: string]: { [leaveTypeId: string]: number } } */
export type QuotasByYear = Record<string, Record<string, number>>;

@Injectable()
export class QuotasService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string): Promise<{ byYear: QuotasByYear }> {
    const rows = await this.prisma.leaveQuota.findMany({ where: { userId } });
    const byYear: QuotasByYear = {};
    for (const r of rows) {
      const y = String(r.year);
      if (!byYear[y]) byYear[y] = {};
      byYear[y][r.leaveTypeId] = r.quota;
    }
    return { byYear };
  }

  /** Remplace l’état des quotas pour l’utilisateur (sync complète). */
  async sync(userId: string, byYear: QuotasByYear): Promise<void> {
    const existing = await this.prisma.leaveQuota.findMany({ where: { userId } });
    const desiredKeys = new Set<string>();
    for (const [yearStr, types] of Object.entries(byYear)) {
      const year = parseInt(yearStr, 10);
      if (Number.isNaN(year)) continue;
      for (const [leaveTypeId, quota] of Object.entries(types)) {
        desiredKeys.add(`${year}|${leaveTypeId}`);
      }
    }

    const toDelete = existing.filter((r) => {
      const k = `${r.year}|${r.leaveTypeId}`;
      return !desiredKeys.has(k);
    });
    if (toDelete.length) {
      await this.prisma.leaveQuota.deleteMany({
        where: { id: { in: toDelete.map((x) => x.id) } },
      });
    }

    for (const [yearStr, types] of Object.entries(byYear)) {
      const year = parseInt(yearStr, 10);
      if (Number.isNaN(year)) continue;
      for (const [leaveTypeId, quota] of Object.entries(types)) {
        await this.prisma.leaveQuota.upsert({
          where: {
            userId_year_leaveTypeId: { userId, year, leaveTypeId },
          },
          create: { userId, year, leaveTypeId, quota },
          update: { quota },
        });
      }
    }
  }
}
