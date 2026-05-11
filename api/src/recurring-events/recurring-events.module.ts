import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RecurringEventsService } from './recurring-events.service';
import { RecurringEventsController } from './recurring-events.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RecurringEventsController],
  providers: [RecurringEventsService],
  exports: [RecurringEventsService],
})
export class RecurringEventsModule {}
