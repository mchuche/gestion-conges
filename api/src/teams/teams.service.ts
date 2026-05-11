import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateTeamDto } from './dto/create-team.dto';
import type { InviteMemberDto } from './dto/invite-member.dto';
import type { TransferTeamDto } from './dto/transfer-team.dto';

/** Réponse alignée sur l’ancien `teams.js` (front). */
export type TeamSummary = {
  id: string;
  name: string;
  description: string;
  role: string;
  createdBy: string;
  createdAt: Date;
};

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getMembership(teamId: string, userId: string) {
    return this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  private async assertMember(teamId: string, userId: string) {
    const m = await this.getMembership(teamId, userId);
    if (!m) {
      throw new ForbiddenException('Vous n’êtes pas membre de cette équipe');
    }
    return m;
  }

  private async assertOwner(teamId: string, userId: string) {
    const m = await this.assertMember(teamId, userId);
    if (m.role !== 'owner') {
      throw new ForbiddenException('Seul le propriétaire peut effectuer cette action');
    }
    return m;
  }

  /** Liste des équipes dont l’utilisateur est membre. */
  async listMine(userId: string): Promise<TeamSummary[]> {
    const rows = await this.prisma.teamMember.findMany({
      where: { userId },
      include: { team: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.team.id,
      name: r.team.name,
      description: r.team.description,
      role: r.role,
      createdBy: r.team.ownerId,
      createdAt: r.team.createdAt,
    }));
  }

  async create(userId: string, dto: CreateTeamDto) {
    const team = await this.prisma.team.create({
      data: {
        name: dto.name.trim(),
        description: (dto.description ?? '').trim(),
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
            invitedById: userId,
          },
        },
      },
    });
    return team;
  }

  async getMembers(teamId: string, requesterId: string) {
    await this.assertMember(teamId, requesterId);
    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return members.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      name: m.user.name || m.user.email,
      role: m.role,
    }));
  }

  async getTeamInvitations(teamId: string, requesterId: string) {
    await this.assertMember(teamId, requesterId);
    const invs = await this.prisma.teamInvitation.findMany({
      where: { teamId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return invs.map((inv) => ({
      id: inv.id,
      userId: null as null,
      email: inv.email,
      status: inv.status,
      createdAt: inv.createdAt,
      acceptedAt: inv.acceptedAt,
    }));
  }

  async invite(teamId: string, inviterId: string, dto: InviteMemberDto) {
    await this.assertOwner(teamId, inviterId);
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const already = await this.getMembership(teamId, existingUser.id);
      if (already) {
        throw new ConflictException('Cet utilisateur est déjà membre de l’équipe');
      }
    }

    const dup = await this.prisma.teamInvitation.findFirst({
      where: { teamId, email, status: 'pending' },
    });
    if (dup) {
      throw new ConflictException('Une invitation est déjà en attente pour cet email');
    }

    const inv = await this.prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        invitedById: inviterId,
        status: 'pending',
      },
    });

    if (existingUser) {
      const team = await this.prisma.team.findUnique({ where: { id: teamId } });
      const inviter = await this.prisma.user.findUnique({ where: { id: inviterId } });
      await this.notifications.createSystemNotification(existingUser.id, {
        type: 'team_invite',
        title: `Invitation à rejoindre "${team?.name ?? 'une équipe'}"`,
        message: `${inviter?.email ?? 'Un utilisateur'} vous a invité à rejoindre l’équipe « ${team?.name ?? '' } ». Ouvrez « Équipes » pour accepter.`,
        data: { team_id: teamId, invitation_id: inv.id },
      });
    }

    return inv;
  }

  /** Invitations `pending` dont l’email correspond au compte connecté. */
  async listMyPendingInvitations(userEmail: string) {
    const email = userEmail.toLowerCase().trim();
    const list = await this.prisma.teamInvitation.findMany({
      where: { email, status: 'pending' },
      include: {
        team: true,
        invitedBy: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((inv) => ({
      id: inv.id,
      team_id: inv.teamId,
      team_name: inv.team.name,
      team_description: inv.team.description,
      email: inv.email,
      invited_by_email: inv.invitedBy.email,
      status: inv.status,
      created_at: inv.createdAt,
    }));
  }

  async acceptInvitation(invitationId: string, userId: string, userEmail: string) {
    const inv = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!inv || inv.status !== 'pending') {
      throw new BadRequestException('Invitation invalide ou déjà traitée');
    }
    if (inv.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Cette invitation ne vous est pas destinée');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
          teamId: inv.teamId,
          userId,
          role: 'member',
          invitedById: inv.invitedById,
        },
      });
      await tx.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
    });

    return { success: true };
  }

  async declineInvitation(invitationId: string, userEmail: string) {
    const inv = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!inv || inv.status !== 'pending') {
      throw new BadRequestException('Invitation invalide ou déjà traitée');
    }
    if (inv.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Cette invitation ne vous est pas destinée');
    }
    await this.prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'declined' },
    });
    return { success: true };
  }

  async removeMember(teamId: string, requesterId: string, targetUserId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Équipe introuvable');

    await this.assertOwner(teamId, requesterId);

    if (targetUserId === team.ownerId) {
      throw new BadRequestException('Impossible de retirer le propriétaire ; transférez d’abord la propriété');
    }

    const m = await this.getMembership(teamId, targetUserId);
    if (!m) throw new NotFoundException('Membre introuvable');

    await this.prisma.teamMember.delete({ where: { id: m.id } });
    return { success: true };
  }

  async deleteInvitation(teamId: string, requesterId: string, invitationId: string) {
    await this.assertOwner(teamId, requesterId);
    const inv = await this.prisma.teamInvitation.findFirst({
      where: { id: invitationId, teamId },
    });
    if (!inv) throw new NotFoundException('Invitation introuvable');
    await this.prisma.teamInvitation.delete({ where: { id: invitationId } });
    return { success: true };
  }

  async transfer(teamId: string, requesterId: string, dto: TransferTeamDto) {
    await this.assertOwner(teamId, requesterId);
    const newOwnerId = dto.newOwnerId;
    if (newOwnerId === requesterId) {
      throw new BadRequestException('Vous êtes déjà propriétaire');
    }

    const newM = await this.getMembership(teamId, newOwnerId);
    if (!newM) {
      throw new BadRequestException('Le nouveau propriétaire doit être membre de l’équipe');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: { ownerId: newOwnerId },
      });
      await tx.teamMember.update({
        where: { id: newM.id },
        data: { role: 'owner' },
      });
      const oldOwnerMem = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: requesterId } },
      });
      if (oldOwnerMem) {
        await tx.teamMember.update({
          where: { id: oldOwnerMem.id },
          data: { role: 'member' },
        });
      }
    });

    return { success: true };
  }

  async deleteTeam(teamId: string, requesterId: string) {
    await this.assertOwner(teamId, requesterId);
    await this.prisma.team.delete({ where: { id: teamId } });
    return { success: true };
  }
}
