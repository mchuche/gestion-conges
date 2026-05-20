import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Couleurs par défaut alignées sur le front (`leaveTypes.js`) si aucune personnalisation en base.
 */
const DEFAULT_COLORS: Record<string, string> = {
  'congé-payé': '#4a90e2',
  rtt: '#50c878',
  'jours-hiver': '#87ceeb',
  maladie: '#ff6b6b',
  télétravail: '#9b59b6',
  formation: '#f39c12',
  grève: '#e74c3c',
};

/** Élément fusionné renvoyé au client (même forme que l’ancien store Vue). */
export type MergedLeaveTypeDto = {
  id: string;
  global_type_id: string;
  name: string;
  label: string;
  color: string;
  category: string;
  eligible_for_main_balance: boolean;
};

/**
 * Types globaux (admin / seed) + personnalisations couleur par utilisateur.
 */
@Injectable()
export class LeaveTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste fusionnée : pour chaque GlobalLeaveType, applique la couleur perso ou la défaut.
   * Crée les lignes LeaveTypeCustomization manquantes avec la couleur par défaut (comme l’ancien loadLeaveTypes).
   */
  async getMergedForUser(userId: string): Promise<MergedLeaveTypeDto[]> {
    const globals = await this.prisma.globalLeaveType.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const customs = await this.prisma.leaveTypeCustomization.findMany({
      where: { userId },
    });
    const customByGlobal = new Map(customs.map((c) => [c.globalTypeId, c]));

    for (const g of globals) {
      if (!customByGlobal.has(g.id)) {
        const color = DEFAULT_COLORS[g.id] ?? '#4a90e2';
        const created = await this.prisma.leaveTypeCustomization.create({
          data: {
            userId,
            globalTypeId: g.id,
            color,
          },
        });
        customByGlobal.set(g.id, created);
      }
    }

    return globals.map((g) => {
      const c = customByGlobal.get(g.id)!;
      return {
        id: g.id,
        global_type_id: g.id,
        name: g.name,
        label: g.label,
        color: c.color,
        category: g.category || 'absence',
        eligible_for_main_balance: g.eligibleForMainBalance ?? true,
      };
    });
  }

  /**
   * Met à jour (upsert) la couleur pour un type global donné.
   */
  async upsertColor(
    userId: string,
    globalTypeId: string,
    color: string,
  ): Promise<void> {
    const exists = await this.prisma.globalLeaveType.findUnique({
      where: { id: globalTypeId },
    });
    if (!exists) {
      throw new BadRequestException(`Type global inconnu : ${globalTypeId}`);
    }

    await this.prisma.leaveTypeCustomization.upsert({
      where: {
        userId_globalTypeId: { userId, globalTypeId },
      },
      create: { userId, globalTypeId, color },
      update: { color },
    });
  }

  /**
   * Sauvegarde en masse des couleurs (équivalent de saveLeaveTypes côté PocketBase).
   * Reçoit la liste fusionnée telle qu’affichée dans l’UI.
   */
  async saveManyFromMerged(
    userId: string,
    items: Array<{ global_type_id?: string; id?: string; color: string }>,
  ): Promise<void> {
    for (const t of items) {
      const gid = t.global_type_id ?? t.id;
      if (!gid) continue;
      await this.upsertColor(userId, gid, t.color);
    }
  }
}
