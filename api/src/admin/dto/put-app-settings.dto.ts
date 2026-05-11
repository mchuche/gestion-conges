import { IsArray, IsObject, IsOptional } from 'class-validator';



/**

 * Corps PUT /admin/app-settings — au moins un des deux champs doit être présent

 * (contrôlé dans le service si besoin).

 */

export class PutAppSettingsDto {

  @IsOptional()

  @IsArray()

  defaultLeaveTypes?: unknown[];



  @IsOptional()

  @IsObject()

  defaultQuotas?: Record<string, number>;

}


