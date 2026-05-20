import {

  BadRequestException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateGlobalLeaveTypeDto } from './dto/create-global-leave-type.dto';

import type { PutAppSettingsDto } from './dto/put-app-settings.dto';

import type { UpdateGlobalLeaveTypeDto } from './dto/update-global-leave-type.dto';



const APP_KEY_DEFAULT_LEAVE_TYPES = 'default_leave_types';

const APP_KEY_DEFAULT_QUOTAS = 'default_quotas';



@Injectable()

export class AdminService {

  constructor(private readonly prisma: PrismaService) {}



  /** Trace une action dans le journal d’audit (acteur = admin connecté). */

  private async audit(

    actorUserId: string,

    action: string,

    entityType?: string | null,

    entityId?: string | null,

    details?: Prisma.InputJsonValue,

  ) {

    await this.prisma.auditLog.create({

      data: {

        userId: actorUserId,

        action,

        entityType: entityType ?? undefined,

        entityId: entityId ?? undefined,

        details: details ?? undefined,

      },

    });

  }



  async stats() {

    const [totalUsers, totalTeams, totalLeaves, pendingInvitations] =

      await Promise.all([

        this.prisma.user.count(),

        this.prisma.team.count(),

        this.prisma.leave.count(),

        this.prisma.teamInvitation.count({ where: { status: 'pending' } }),

      ]);

    return {

      totalUsers,

      totalTeams,

      totalLeaves,

      pendingInvitations,

    };

  }



  async listUsers(q?: string) {

    const users = await this.prisma.user.findMany({

      where: q

        ? { email: { contains: q.trim(), mode: 'insensitive' } }

        : {},

      select: { id: true, email: true, name: true, createdAt: true },

      orderBy: { createdAt: 'desc' },

      take: 500,

    });

    return Promise.all(

      users.map(async (u) => {

        const [leavesCount, teamsCount] = await Promise.all([

          this.prisma.leave.count({ where: { userId: u.id } }),

          this.prisma.teamMember.count({ where: { userId: u.id } }),

        ]);

        return {

          id: u.id,

          email: u.email,

          createdAt: u.createdAt,

          leavesCount,

          teamsCount,

        };

      }),

    );

  }



  async deleteUser(userId: string, actorUserId: string) {

    const target = await this.prisma.user.findUnique({

      where: { id: userId },

      select: { email: true },

    });

    if (!target) {

      throw new NotFoundException('Utilisateur introuvable');

    }

    await this.audit(actorUserId, 'user_deleted', 'user', userId, {

      email: target.email,

    });

    await this.prisma.user.delete({ where: { id: userId } });

    return { ok: true };

  }



  async listTeams() {

    const teams = await this.prisma.team.findMany({

      orderBy: { createdAt: 'desc' },

      take: 500,

    });

    return Promise.all(

      teams.map(async (t) => ({

        id: t.id,

        name: t.name,

        createdAt: t.createdAt,

        membersCount: await this.prisma.teamMember.count({

          where: { teamId: t.id },

        }),

      })),

    );

  }



  async deleteTeam(teamId: string, actorUserId: string) {

    const team = await this.prisma.team.findUnique({

      where: { id: teamId },

      select: { name: true },

    });

    if (!team) {

      throw new NotFoundException('Équipe introuvable');

    }

    await this.audit(actorUserId, 'team_deleted', 'team', teamId, {

      name: team.name,

    });

    await this.prisma.team.delete({ where: { id: teamId } });

    return { ok: true };

  }



  async listGlobalLeaveTypes() {

    return this.prisma.globalLeaveType.findMany({

      orderBy: { sortOrder: 'asc' },

    });

  }



  async createGlobalLeaveType(data: CreateGlobalLeaveTypeDto, actorUserId: string) {

    const exists = await this.prisma.globalLeaveType.findUnique({

      where: { id: data.id },

    });

    if (exists) {

      throw new BadRequestException(`Un type avec l’id « ${data.id} » existe déjà`);

    }

    const maxSort = await this.prisma.globalLeaveType.aggregate({

      _max: { sortOrder: true },

    });

    const sortOrder =

      data.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1;

    const row = await this.prisma.globalLeaveType.create({

      data: {

        id: data.id,

        name: data.name,

        label: data.label,

        category: data.category ?? 'absence',

        sortOrder,

        eligibleForMainBalance: data.eligibleForMainBalance ?? true,

      },

    });

    await this.audit(

      actorUserId,

      'global_leave_type_created',

      'global_leave_type',

      row.id,

      { id: row.id, name: row.name, label: row.label },

    );

    return row;

  }



  async updateGlobalLeaveType(

    id: string,

    data: UpdateGlobalLeaveTypeDto,

    actorUserId: string,

  ) {

    const before = await this.prisma.globalLeaveType.findUnique({

      where: { id },

    });

    if (!before) {

      throw new NotFoundException('Type introuvable');

    }

    await this.prisma.globalLeaveType.update({

      where: { id },

      data,

    });

    await this.audit(
      actorUserId,
      'global_leave_type_updated',
      'global_leave_type',
      id,
      {
        before: { name: before.name, label: before.label, category: before.category },
        patch: JSON.parse(JSON.stringify(data)),
      } as Prisma.InputJsonValue,
    );

    return { ok: true };

  }



  async deleteGlobalLeaveType(id: string, actorUserId: string) {

    const gt = await this.prisma.globalLeaveType.findUnique({

      where: { id },

      select: { name: true, label: true },

    });

    if (!gt) {

      throw new NotFoundException('Type introuvable');

    }

    const leaves = await this.prisma.leave.count({ where: { leaveTypeId: id } });

    const quotas = await this.prisma.leaveQuota.count({

      where: { leaveTypeId: id },

    });

    if (leaves > 0 || quotas > 0) {

      await this.prisma.leave.deleteMany({ where: { leaveTypeId: id } });

      await this.prisma.leaveQuota.deleteMany({ where: { leaveTypeId: id } });

    }

    await this.prisma.leaveTypeCustomization.deleteMany({

      where: { globalTypeId: id },

    });

    await this.prisma.globalLeaveType.delete({ where: { id } });

    await this.audit(actorUserId, 'global_leave_type_deleted', 'global_leave_type', id, {

      name: gt.name,

      label: gt.label,

      removedLeaves: leaves,

      removedQuotas: quotas,

    });

    return { ok: true };

  }



  /** Lecture des deux JSON globaux (null si jamais enregistrés). */

  async getAppSettings() {

    const rows = await this.prisma.appSetting.findMany({

      where: {

        key: { in: [APP_KEY_DEFAULT_LEAVE_TYPES, APP_KEY_DEFAULT_QUOTAS] },

      },

    });

    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {

      defaultLeaveTypes: map[APP_KEY_DEFAULT_LEAVE_TYPES] ?? null,

      defaultQuotas: map[APP_KEY_DEFAULT_QUOTAS] ?? null,

    };

  }



  async putAppSettings(dto: PutAppSettingsDto, actorUserId: string) {

    if (

      dto.defaultLeaveTypes === undefined &&

      dto.defaultQuotas === undefined

    ) {

      throw new BadRequestException(

        'Fournir au moins defaultLeaveTypes ou defaultQuotas',

      );

    }



    const updatedKeys: string[] = [];



    if (dto.defaultLeaveTypes !== undefined) {

      if (!Array.isArray(dto.defaultLeaveTypes)) {

        throw new BadRequestException('defaultLeaveTypes doit être un tableau');

      }

      await this.prisma.appSetting.upsert({

        where: { key: APP_KEY_DEFAULT_LEAVE_TYPES },

        create: {

          key: APP_KEY_DEFAULT_LEAVE_TYPES,

          value: dto.defaultLeaveTypes as Prisma.InputJsonValue,

          updatedById: actorUserId,

        },

        update: {

          value: dto.defaultLeaveTypes as Prisma.InputJsonValue,

          updatedById: actorUserId,

        },

      });

      updatedKeys.push(APP_KEY_DEFAULT_LEAVE_TYPES);

    }



    if (dto.defaultQuotas !== undefined) {

      if (

        typeof dto.defaultQuotas !== 'object' ||

        dto.defaultQuotas === null ||

        Array.isArray(dto.defaultQuotas)

      ) {

        throw new BadRequestException('defaultQuotas doit être un objet');

      }

      await this.prisma.appSetting.upsert({

        where: { key: APP_KEY_DEFAULT_QUOTAS },

        create: {

          key: APP_KEY_DEFAULT_QUOTAS,

          value: dto.defaultQuotas as Prisma.InputJsonValue,

          updatedById: actorUserId,

        },

        update: {

          value: dto.defaultQuotas as Prisma.InputJsonValue,

          updatedById: actorUserId,

        },

      });

      updatedKeys.push(APP_KEY_DEFAULT_QUOTAS);

    }



    await this.audit(actorUserId, 'settings_updated', 'app_settings', null, {

      keys: updatedKeys,

    });



    return this.getAppSettings();

  }



  async listAuditLogs(limitRaw?: number) {

    const limit = Number.isFinite(limitRaw)

      ? Math.min(Math.max(1, Math.floor(limitRaw as number)), 500)

      : 200;

    const rows = await this.prisma.auditLog.findMany({

      take: limit,

      orderBy: { createdAt: 'desc' },

      include: { user: { select: { email: true } } },

    });

    return {

      logs: rows.map((r) => ({

        id: r.id,

        userId: r.userId,

        userEmail: r.user?.email ?? (r.userId ? 'Utilisateur inconnu' : 'Système'),

        action: r.action,

        entityType: r.entityType,

        entityId: r.entityId,

        details: r.details,

        createdAt: r.createdAt,

      })),

    };

  }

}


