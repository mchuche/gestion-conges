import { IsObject } from 'class-validator';

/**
 * Corps POST /leaves/sync — état complet des jours pour l’utilisateur courant
 * (même logique que l’ancien saveLeaves PocketBase : supprime ce qui n’est plus dans la map).
 *
 * Clés = dateKey (ex. 2026-04-01 ou 2026-04-01-morning), valeurs = id de GlobalLeaveType.
 * La validation fine (types existants) est faite dans LeavesService.
 */
export class SyncLeavesDto {
  /** Map dateKey -> leaveTypeId (identifiant stable du type global, ex. "congé-payé"). */
  @IsObject()
  entries: Record<string, string>;
}
