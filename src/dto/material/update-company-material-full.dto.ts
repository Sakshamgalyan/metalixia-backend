import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateCompanyMaterialFullDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDateString()
  expectedOn?: string;

  @IsOptional()
  @IsDateString()
  deliveryBy?: string;

  @IsOptional()
  @IsDateString()
  receivedOn?: string;

  @IsOptional()
  @IsString()
  inventoryLocation?: string;

  @IsOptional()
  @IsString()
  receivedBy?: string;

  @IsOptional()
  @IsString()
  receivedById?: string;
}
