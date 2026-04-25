import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class SetMinStockDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  minStock: number;
}
