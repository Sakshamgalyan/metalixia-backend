import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePayslipDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  month: string;

  @IsNotEmpty()
  @IsString()
  year: string;
}
