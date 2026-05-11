import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRecurringEventDto {
  @IsOptional()
  @IsString()
  leaveTypeId?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  recurrenceType?: string;

  @IsOptional()
  @IsObject()
  recurrencePattern?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxOccurrences?: number | null;

  @IsOptional()
  excludedDates?: unknown[];

  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
