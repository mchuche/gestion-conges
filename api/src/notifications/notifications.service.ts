import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Notification créée par le serveur (invitation équipe, etc.) — pas de garde métier.
   */
  async createSystemNotification(
    targetUserId: string,
    payload: {
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    },
  ) {
    return this.prisma.notification.create({
      data: {
        userId: targetUserId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        ...(payload.data != null
          ? { data: payload.data as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  /**
   * Vérifie que l’appelant peut envoyer une notif « event_modified » à la cible
   * (soi-même, ou propriétaire d’une équipe dont la cible est membre).
   */
  private async assertCanNotify(
    callerId: string,
    targetUserId: string,
    type: string,
  ): Promise<void> {
    if (callerId === targetUserId) {
      return;
    }
    if (type !== 'event_modified') {
      throw new ForbiddenException(
        'Seul le type « event_modified » peut cibler un autre utilisateur',
      );
    }
    const owned = await this.prisma.teamMember.findMany({
      where: { userId: callerId, role: 'owner' },
      select: { teamId: true },
    });
    for (const { teamId } of owned) {
      const m = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: targetUserId } },
      });
      if (m) return;
    }
    throw new ForbiddenException(
      'Vous ne pouvez notifier cet utilisateur que pour un membre de vos équipes',
    );
  }

  async createFromClient(callerId: string, dto: CreateNotificationDto) {
    await this.assertCanNotify(callerId, dto.targetUserId, dto.type);
    return this.prisma.notification.create({
      data: {
        userId: dto.targetUserId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        ...(dto.data != null
          ? { data: dto.data as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async listMine(userId: string, take = 50) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows.map((n) => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      read_at: n.readAt,
      data: n.data,
      created: n.createdAt,
    }));
  }

  async markRead(notificationId: string, userId: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!n) throw new NotFoundException('Notification introuvable');
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async deleteOne(notificationId: string, userId: string) {
    const r = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    if (r.count === 0) throw new NotFoundException();
    return { ok: true };
  }

  async deleteAllRead(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId, read: true },
    });
    return { ok: true };
  }
}
