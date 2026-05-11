import { IsString } from 'class-validator';
import { PatchLeaveDto } from './patch-leave.dto';

/**
 * Corps PATCH /leaves/for-user — cible un autre utilisateur (règles métier dans LeavesService).
 */
export class PatchLeaveForUserDto extends PatchLeaveDto {
  @IsString()
  targetUserId: string;
}
