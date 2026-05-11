import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

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
  @IsIn(['leave', 'event'])
  category?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
