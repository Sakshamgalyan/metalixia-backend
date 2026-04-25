import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateProductionOrderDto {
  @IsOptional()
  @IsString()
  inventoryItemId?: string;

  @IsOptional()
  @IsString()
  companyMaterialId?: string;

  @IsOptional()
  @IsString()
  rawMaterialId?: string;

  @IsString()
  companyName: string;

  @IsString()
  partName: string;

  @IsString()
  partNumber: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  lineNumber?: number;

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
