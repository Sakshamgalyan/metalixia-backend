import { IsString, IsOptional } from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  post?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsString()
  employeeId: string;
}
