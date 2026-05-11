import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

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
  @IsIn(['leave', 'event'])
  category?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
