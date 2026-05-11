import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUserPayload } from '../auth.types';

/** Payload minimal signé dans l’access token JWT */
type JwtPayload = {
  sub: string;
  email: string;
};

/**
 * Stratégie Passport « jwt » : lit le Bearer token, vérifie la signature,
 * recharge l’utilisateur et les droits admin depuis Prisma.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Résultat attaché à `req.user` pour les contrôleurs (@CurrentUser).
   */
  async validate(payload: JwtPayload): Promise<AuthUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { appAdmin: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      is_admin: !!user.appAdmin,
      is_super_admin: user.appAdmin?.role === 'super_admin',
    };
  }
}
