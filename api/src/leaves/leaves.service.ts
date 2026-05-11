import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Forme renvoyée au client (camelCase) pour chaque ligne de congé. */
export type LeaveRowDto = {
  id: string;
  dateKey: string;
  leaveTypeId: string;
};

/**
 * Congés personnels : synchro complète (comme l’ancien store), patch unitaire,
 * lecture équipe par liste d’utilisateurs (contrôle d’accès à renforcer plus tard avec les équipes).
 */
@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie que l’identifiant correspond à un type global en base (seed).
   */
  private async assertGlobalLeaveTypeExists(leaveTypeId: string): Promise<void> {
    const t = await this.prisma.globalLeaveType.findUnique({
      where: { id: leaveTypeId },
    });
    if (!t) {
      throw new BadRequestException(`Type de congé inconnu : ${leaveTypeId}`);
    }
  }

  /**
   * Liste tous les congés de l’utilisateur (pour reconstruire { date_key: type_id } côté front).
   */
  async listMine(userId: string): Promise<LeaveRowDto[]> {
    const rows = await this.prisma.leave.findMany({
      where: { userId },
      orderBy: { dateKey: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      dateKey: r.dateKey,
      leaveTypeId: r.leaveTypeId,
    }));
  }

  /**
   * Congés de plusieurs utilisateurs (vue équipe / calendrier).
   * Les `userIds` sont fournis par le front (filtrage métier équipe côté client pour l’instant).
   */
  async listForUsers(userIds: string[]): Promise<Record<string, Record<string, string>>> {
    if (!userIds.length) {
      return {};
    }
    const rows = await this.prisma.leave.findMany({
      where: { userId: { in: userIds } },
    });
    const out: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      if (!out[r.userId]) {
        out[r.userId] = {};
      }
      out[r.userId][r.dateKey] = r.leaveTypeId;
    }
    return out;
  }

  /**
   * Synchronise l’état complet : supprime les dates absentes de `entries`, upsert le reste.
   */
  async sync(userId: string, entries: Record<string, string>): Promise<void> {
    for (const leaveTypeId of Object.values(entries)) {
      await this.assertGlobalLeaveTypeExists(leaveTypeId);
    }

    const existing = await this.prisma.leave.findMany({ where: { userId } });
    const desiredKeys = new Set(Object.keys(entries));

    const toRemove = existing.filter((l) => !desiredKeys.has(l.dateKey));
    if (toRemove.length) {
      await this.prisma.leave.deleteMany({
        where: { id: { in: toRemove.map((l) => l.id) } },
      });
    }

    for (const [dateKey, leaveTypeId] of Object.entries(entries)) {
      await this.prisma.leave.upsert({
        where: {
          userId_dateKey: { userId, dateKey },
        },
        create: { userId, dateKey, leaveTypeId },
        update: { leaveTypeId },
      });
    }
  }

  /**
   * Met à jour ou supprime un seul jour.
   */
  async patch(
    userId: string,
    dateKey: string,
    leaveTypeId: string | null | undefined,
  ): Promise<LeaveRowDto | null> {
    if (leaveTypeId === null || leaveTypeId === undefined) {
      const deleted = await this.prisma.leave.deleteMany({
        where: { userId, dateKey },
      });
      if (deleted.count === 0) {
        return null;
      }
      return null;
    }

    await this.assertGlobalLeaveTypeExists(leaveTypeId);

    const row = await this.prisma.leave.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      create: { userId, dateKey, leaveTypeId },
      update: { leaveTypeId },
    });

    return {
      id: row.id,
      dateKey: row.dateKey,
      leaveTypeId: row.leaveTypeId,
    };
  }

  /**
   * Modifie le congé d’un autre utilisateur (ex. propriétaire d’équipe sur événements).
   * Règle métier alignée sur le front : si ce n’est pas soi-même, seuls les types « event » sont autorisés.
   * TODO: vérifier appartenance à la même équipe / rôle owner via tables équipes (pas encore en Prisma).
   */
  async patchForUser(
    actorId: string,
    targetUserId: string,
    dateKey: string,
    leaveTypeId: string | null | undefined,
  ): Promise<LeaveRowDto | null> {
    if (targetUserId === actorId) {
      return this.patch(actorId, dateKey, leaveTypeId);
    }

    if (leaveTypeId) {
      const gt = await this.prisma.globalLeaveType.findUnique({
        where: { id: leaveTypeId },
      });
      if (!gt) {
        throw new BadRequestException(`Type de congé inconnu : ${leaveTypeId}`);
      }
      if (gt.category !== 'event') {
        throw new BadRequestException(
          'Vous ne pouvez modifier que les événements des autres utilisateurs, pas les congés.',
        );
      }
    }

    return this.patch(targetUserId, dateKey, leaveTypeId);
  }
}
