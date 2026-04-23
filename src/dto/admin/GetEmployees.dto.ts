import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class GetEmployeesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  post?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  role?: string[];
}
