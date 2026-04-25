import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateRawMaterialDto {
  @IsOptional()
  @IsString()
  materialName?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  inventoryLocation?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString()
  expectedOn?: string;
}
