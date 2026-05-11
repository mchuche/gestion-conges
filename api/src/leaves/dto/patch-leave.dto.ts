import { Allow, IsOptional, IsString } from 'class-validator';

/**
 * Corps PATCH /leaves — mise à jour d’un seul jour (ou suppression si leaveTypeId absent / null).
 */
export class PatchLeaveDto {
  @IsString()
  dateKey: string;

  /** Si omis ou null : suppression du congé pour cette date. */
  @IsOptional()
  @Allow()
  leaveTypeId?: string | null;
}
