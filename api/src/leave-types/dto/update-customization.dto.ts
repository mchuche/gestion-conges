import { IsString, Matches, MinLength } from 'class-validator';

/**
 * Corps PATCH /leave-types/customizations — couleur utilisateur pour un type global.
 */
export class UpdateCustomizationDto {
  /** Identifiant du type global (ex. "congé-payé", "rtt"). */
  @IsString()
  @MinLength(1)
  globalTypeId: string;

  /** Couleur CSS hex (ex. #4a90e2). */
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'La couleur doit être au format #RRGGBB',
  })
  color: string;
}
