import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Corps POST /auth/register — création de compte (base vide, pas d’invitation ici).
 */
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  password: string;

  @IsString()
  @MinLength(1)
  name: string;
}
