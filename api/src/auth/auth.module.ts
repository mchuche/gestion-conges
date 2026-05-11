import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Module Auth : JWT access + refresh opaque en base, stratégie Passport « jwt ».
 * Exporte JwtModule pour réutilisation éventuelle ; les autres modules importent
 * AuthModule pour disposer de JwtAuthGuard + JwtStrategy enregistrés.
 */
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // getOrThrow : secret obligatoire au démarrage (évite undefined côté typings JWT)
        const secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
        const expiresRaw = config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
        return {
          secret,
          signOptions: {
            // Cast : @nestjs/jwt attend le type `StringValue` de `ms`, compatible avec "15m", "7d", etc.
            expiresIn: expiresRaw as `${number}m` | `${number}d` | `${number}s` | number,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
