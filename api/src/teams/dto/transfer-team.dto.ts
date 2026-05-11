import { IsUUID } from 'class-validator';

export class TransferTeamDto {
  @IsUUID()
  newOwnerId: string;
}
