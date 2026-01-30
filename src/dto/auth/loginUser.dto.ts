import { IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString()
  identifier: string;

  @MinLength(6)
  password: string;
}
