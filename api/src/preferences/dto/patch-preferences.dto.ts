import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PatchPreferencesDto {
  @IsOptional()
  @IsString()
  selectedCountry?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekStartDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  eventOpacity?: number;

  @IsOptional()
  @IsString()
  @IsIn(['light', 'normal', 'strong'])
  holidayWeekendIntensity?: string;

  @IsOptional()
  @IsString()
  @IsIn(['auto', 'light', 'dark'])
  themeMode?: string;

  /** Types affichés dans le bandeau « Jours restants » (ids GlobalLeaveType éligibles). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mainBalanceTypeIds?: string[];

  /** Autoriser la pose sur week-ends et jours fériés. */
  @IsOptional()
  @IsBoolean()
  allowWeekendHolidayLeave?: boolean;
}
