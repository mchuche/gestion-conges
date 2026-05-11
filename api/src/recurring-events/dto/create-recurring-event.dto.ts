import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecurringEventDto {
  @IsString()
  @MinLength(1)
  leaveTypeId: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsString()
  recurrenceType: string;

  @IsObject()
  recurrencePattern: Record<string, unknown>;

  /** ISO date YYYY-MM-DD */
  @IsString()
  startDate: string;

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
