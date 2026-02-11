import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Mobile number must be at least 10 characters' })
  mobileNo?: string;

  @IsOptional()
  @IsString()
  post?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  address?: string;
}
