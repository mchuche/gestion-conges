import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.types';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { TransferTeamDto } from './dto/transfer-team.dto';

/**
 * Routes équipes — ordre des décorateurs : routes statiques (`invitations/mine`) avant `:teamId`.
 */
@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthUserPayload) {
    return this.teams.listMine(user.id).then((teams) => ({ teams }));
  }

  @Get('invitations/mine')
  myInvitations(@CurrentUser() user: AuthUserPayload) {
    return this.teams
      .listMyPendingInvitations(user.email)
      .then((invitations) => ({ invitations }));
  }

  @Post('invitations/:invitationId/accept')
  accept(
    @CurrentUser() user: AuthUserPayload,
    @Param('invitationId') invitationId: string,
  ) {
    return this.teams.acceptInvitation(invitationId, user.id, user.email);
  }

  @Post('invitations/:invitationId/decline')
  decline(
    @CurrentUser() user: AuthUserPayload,
    @Param('invitationId') invitationId: string,
  ) {
    return this.teams.declineInvitation(invitationId, user.email);
  }

  @Post()
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateTeamDto) {
    return this.teams.create(user.id, dto);
  }

  @Get(':teamId/members')
  members(
    @CurrentUser() user: AuthUserPayload,
    @Param('teamId') teamId: string,
  ) {
    return this.teams.getMembers(teamId, user.id).then((members) => ({ members }));
  }

  @Get(':teamId/invitations')
  teamInvitations(
    @CurrentUser() user: AuthUserPayload,
    @Param('teamId') teamId: string,
  ) {
    return this.teams
      .getTeamInvitations(teamId, user.id)
      .then((invitations) => ({ invitations }));
  }

  @Post(':teamId/invitations')
  invite(
    @CurrentUser() user: AuthUserPayload,
    @Param('teamId') teamId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.teams.invite(teamId, user.id, dto);
  }

  @Delete(':teamId/members/:userId')
  removeMember(
    @CurrentUser() user: AuthUserPayload,
    @Param('teamId') teamId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.teams.removeMember(teamId, user.id, targetUserId);
  }

  @Delete(':teamId/invitations/:invitationId')
  deleteInvitation(
    @CurrentUser() user: AuthUserPayload,
    @Param('teamId') teamId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.teams.deleteInvitation(teamId, user.id, invitationId);
  }

  @Post(':teamId/transfer')
  transfer(
    @CurrentUser() user: AuthUserPayload,
    @Param('teamId') teamId: string,
    @Body() dto: TransferTeamDto,
  ) {
    return this.teams.transfer(teamId, user.id, dto);
  }

  @Delete(':teamId')
  deleteTeam(
    @CurrentUser() user: AuthUserPayload,
    @Param('teamId') teamId: string,
  ) {
    return this.teams.deleteTeam(teamId, user.id);
  }
}
