import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

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
}
