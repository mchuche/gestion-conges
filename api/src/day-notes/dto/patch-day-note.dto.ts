import { IsString, Matches, MaxLength } from 'class-validator';

/** Corps PATCH /day-notes — note du jour (texte vide = suppression). */
export class PatchDayNoteDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey!: string;

  @IsString()
  @MaxLength(500)
  text!: string;
}
