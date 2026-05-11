import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotasService } from './quotas.service';
import { QuotasController } from './quotas.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [QuotasController],
  providers: [QuotasService],
  exports: [QuotasService],
})
export class QuotasModule {}
