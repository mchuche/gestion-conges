import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Opérations sur la ressource utilisateur (hors auth login/register).
 * La suppression s’appuie sur les `onDelete: Cascade` du schéma Prisma.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Supprime définitivement le compte : congés, refresh tokens, personnalisations de types, entrée app_admins.
   * Les types globaux (seed) ne sont pas touchés.
   */
  async deleteSelf(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2025') {
        throw new NotFoundException('Utilisateur déjà supprimé');
      }
      throw e;
    }
  }
}
