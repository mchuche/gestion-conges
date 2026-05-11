import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUserPayload) {
    return this.notifications.listMine(user.id).then((items) => ({ items }));
  }

  @Post()
  create(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notifications.createFromClient(user.id, dto);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(id, user.id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthUserPayload) {
    return this.notifications.markAllRead(user.id);
  }

  /** Doit rester avant @Delete(':id') pour ne pas interpréter « read » comme un UUID. */
  @Delete('read/all')
  deleteAllRead(@CurrentUser() user: AuthUserPayload) {
    return this.notifications.deleteAllRead(user.id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    return this.notifications.deleteOne(id, user.id);
  }
}
