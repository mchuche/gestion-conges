import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';

/**
 * Module congés : dépend de AuthModule pour JwtAuthGuard / stratégie JWT.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
