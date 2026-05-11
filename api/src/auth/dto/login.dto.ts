import { IsEmail, IsString } from 'class-validator';

/** Corps POST /auth/login */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
