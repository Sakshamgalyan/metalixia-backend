import { IsEmail, IsString, MinLength } from 'class-validator';

export class AddEmployeeDto {
  @IsString()
  name: string;

  @IsString()
  mobileNo: string;

  @IsString()
  post: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  role: string;
}
