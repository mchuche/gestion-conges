import { IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Corps POST /notifications — création côté client (ex. événement modifié pour un collègue). */
export class CreateNotificationDto {
  @IsUUID()
  targetUserId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  type: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
