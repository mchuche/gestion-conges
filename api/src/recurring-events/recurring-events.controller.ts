import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { RecurringEventsService } from './recurring-events.service';
import { CreateRecurringEventDto } from './dto/create-recurring-event.dto';
import { UpdateRecurringEventDto } from './dto/update-recurring-event.dto';

@Controller('recurring-events')
@UseGuards(JwtAuthGuard)
export class RecurringEventsController {
  constructor(private readonly recurring: RecurringEventsService) {}

  @Get('team')
  team(@CurrentUser() _user: AuthUserPayload, @Query('userIds') userIdsRaw: string) {
    const userIds = (userIdsRaw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.recurring.listForUsers(userIds).then((byUser) => ({ byUser }));
  }

  @Get()
  listMine(@CurrentUser() user: AuthUserPayload) {
    return this.recurring.listMine(user.id).then((events) => ({ events }));
  }

  @Post()
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateRecurringEventDto) {
    return this.recurring.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringEventDto,
  ) {
    return this.recurring.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.recurring.delete(user.id, id);
  }
}
