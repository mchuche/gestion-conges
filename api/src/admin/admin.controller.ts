import {

  Body,

  Controller,

  Delete,

  Get,

  Param,

  Patch,

  Post,

  Put,

  Query,

  UseGuards,

} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AdminGuard } from '../auth/guards/admin.guard';

import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthUserPayload } from '../auth/auth.types';

import { AdminService } from './admin.service';

import { CreateGlobalLeaveTypeDto } from './dto/create-global-leave-type.dto';

import { PutAppSettingsDto } from './dto/put-app-settings.dto';

import { UpdateGlobalLeaveTypeDto } from './dto/update-global-leave-type.dto';



@Controller('admin')

@UseGuards(JwtAuthGuard, AdminGuard)

export class AdminController {

  constructor(private readonly admin: AdminService) {}



  @Get('stats')

  stats(@CurrentUser() _user: AuthUserPayload) {

    return this.admin.stats();

  }



  @Get('users')

  users(@Query('q') q?: string) {

    return this.admin.listUsers(q).then((users) => ({ users }));

  }



  @Delete('users/:id')

  @UseGuards(SuperAdminGuard)

  deleteUser(

    @CurrentUser() actor: AuthUserPayload,

    @Param('id') id: string,

  ) {

    return this.admin.deleteUser(id, actor.id);

  }



  @Get('teams')

  teams() {

    return this.admin.listTeams().then((teams) => ({ teams }));

  }



  @Delete('teams/:id')

  deleteTeam(@CurrentUser() actor: AuthUserPayload, @Param('id') id: string) {

    return this.admin.deleteTeam(id, actor.id);

  }



  @Get('global-leave-types')

  globalLeaveTypes() {

    return this.admin.listGlobalLeaveTypes().then((types) => ({ types }));

  }



  @Post('global-leave-types')

  createGlobalLeaveType(

    @CurrentUser() actor: AuthUserPayload,

    @Body() dto: CreateGlobalLeaveTypeDto,

  ) {

    return this.admin.createGlobalLeaveType(dto, actor.id);

  }



  @Patch('global-leave-types/:id')

  updateGlobalLeaveType(

    @CurrentUser() actor: AuthUserPayload,

    @Param('id') id: string,

    @Body() dto: UpdateGlobalLeaveTypeDto,

  ) {

    return this.admin.updateGlobalLeaveType(id, dto, actor.id);

  }



  @Delete('global-leave-types/:id')

  deleteGlobalLeaveType(

    @CurrentUser() actor: AuthUserPayload,

    @Param('id') id: string,

  ) {

    return this.admin.deleteGlobalLeaveType(id, actor.id);

  }



  /** Paramètres globaux JSON (types / quotas par défaut pour nouveaux comptes). */

  @Get('app-settings')

  getAppSettings() {

    return this.admin.getAppSettings();

  }



  @Put('app-settings')

  putAppSettings(

    @CurrentUser() actor: AuthUserPayload,

    @Body() dto: PutAppSettingsDto,

  ) {

    return this.admin.putAppSettings(dto, actor.id);

  }



  /** Journal d’audit (actions admin récentes). */

  @Get('audit-logs')

  auditLogs(@Query('limit') limit?: string) {

    const n = limit != null && limit !== '' ? parseInt(limit, 10) : undefined;

    return this.admin.listAuditLogs(n);

  }

}


