import { IsString } from 'class-validator';

/**
 * Corps POST /auth/refresh — le refresh token opaque (stocké en base),
 * pas un JWT pour limiter la surface d’attaque si fuite.
 */
export class RefreshDto {
  @IsString()
  refreshToken: string;
}
