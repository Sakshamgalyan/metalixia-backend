import {
  IsNumber,
  IsNotEmpty,
  Min,
  IsString,
  IsOptional,
} from 'class-validator';

export class SendToProductionDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  batchQuantity: number;

  @IsNotEmpty()
  @IsNumber()
  lineNumber: number;

  @IsOptional()
  @IsString()
  priority?: string;
}
