import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { LeavesModule } from './leaves/leaves.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QuotasModule } from './quotas/quotas.module';
import { PreferencesModule } from './preferences/preferences.module';
import { RecurringEventsModule } from './recurring-events/recurring-events.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    LeavesModule,
    LeaveTypesModule,
    UsersModule,
    TeamsModule,
    NotificationsModule,
    QuotasModule,
    PreferencesModule,
    RecurringEventsModule,
    AdminModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
