import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { QuotasService } from './quotas.service';
import { SyncQuotasDto } from './dto/sync-quotas.dto';

@Controller('quotas')
@UseGuards(JwtAuthGuard)
export class QuotasController {
  constructor(private readonly quotas: QuotasService) {}

  @Get()
  getMine(@CurrentUser() user: AuthUserPayload) {
    return this.quotas.getMine(user.id);
  }

  @Put()
  sync(@CurrentUser() user: AuthUserPayload, @Body() body: SyncQuotasDto) {
    return this.quotas.sync(user.id, body.byYear ?? {}).then(() => ({ ok: true }));
  }
}
