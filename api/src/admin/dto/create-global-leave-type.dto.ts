import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { LEAVE_TYPE_CATEGORY_VALUES } from '../../leave-types/leave-type-category';

export class CreateGlobalLeaveTypeDto {
  @IsString()
  @MinLength(1)
  id: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  label: string;

  @IsOptional()
  @IsString()
  @IsIn(LEAVE_TYPE_CATEGORY_VALUES)
  category?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  eligibleForMainBalance?: boolean;
}
