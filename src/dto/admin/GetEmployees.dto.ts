import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetEmployeesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageNo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  name?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mobileNo?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  post?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  email?: string[];

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  from?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  to?: number;
}
