import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Un type avec couleur à persister. */
export class SaveLeaveTypesItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  global_type_id?: string;

  @IsString()
  @MinLength(1)
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Chaque couleur doit être au format #RRGGBB',
  })
  color: string;
}

/** Corps POST /leave-types/save */
export class SaveLeaveTypesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveLeaveTypesItemDto)
  items: SaveLeaveTypesItemDto[];
}
