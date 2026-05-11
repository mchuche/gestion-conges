import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserPayload } from './auth.types';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

/** Réponse commune login / register / refresh */
export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserPayload;
};

/**
 * Inscription, connexion, refresh opaque, déconnexion (révocation refresh).
 * Les mots de passe sont hashés avec bcrypt ; l’access est un JWT court.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Mappe un enregistrement Prisma User (+ appAdmin optionnel) vers le DTO front.
   */
  private toUserPayload(user: {
    id: string;
    email: string;
    name: string;
    appAdmin: { role: string } | null;
  }): AuthUserPayload {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: !!user.appAdmin,
      is_super_admin: user.appAdmin?.role === 'super_admin',
    };
  }

  /**
   * Crée un utilisateur et retourne les tokens (auto-login).
   */
  async register(dto: RegisterDto): Promise<AuthTokensResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name.trim(),
      },
      include: { appAdmin: true },
    });

    return this.issueTokensForUser(user);
  }

  /**
   * Vérifie le mot de passe et émet access + refresh.
   */
  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { appAdmin: true },
    });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.issueTokensForUser(user);
  }

  /**
   * Échange un refresh valide contre un nouvel access (+ rotation du refresh).
   */
  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { appAdmin: true } } },
    });
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée ou invalide');
    }

    // Rotation : on invalide l’ancien jeton pour limiter la réutilisation
    await this.prisma.refreshToken.delete({ where: { id: row.id } });

    return this.issueTokensForUser(row.user);
  }

  /**
   * Révoque un refresh (déconnexion sur ce device).
   */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Profil courant à partir du payload JWT déjà validé (GET /auth/me).
   */
  async getProfile(userId: string): Promise<AuthUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { appAdmin: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return this.toUserPayload(user);
  }

  /**
   * Signe l’access JWT et persiste un refresh opaque avec date d’expiration.
   */
  private async issueTokensForUser(user: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    appAdmin: { role: string } | null;
  }): Promise<AuthTokensResponse> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const days = Number(this.config.get('JWT_REFRESH_EXPIRES_DAYS') ?? 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(days) ? days : 7));

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserPayload(user),
    };
  }
}
