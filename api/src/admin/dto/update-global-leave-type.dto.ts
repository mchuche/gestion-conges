import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { LEAVE_TYPE_CATEGORY_VALUES } from '../../leave-types/leave-type-category';

export class UpdateGlobalLeaveTypeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

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
