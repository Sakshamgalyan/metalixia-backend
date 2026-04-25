import { IsNumber, IsNotEmpty, Min, IsString } from 'class-validator';

export class ConsumeMaterialDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNotEmpty()
  @IsString()
  notes: string;
}
