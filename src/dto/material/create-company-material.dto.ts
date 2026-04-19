import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateCompanyMaterialDto {
    @IsNotEmpty()
    @IsString()
    materialName: string;

    @IsNotEmpty()
    @IsString()
    companyName: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsOptional()
    @IsString()
    receivedBy?: string;

    @IsOptional()
    @IsString()
    receivedById?: string;

    @IsNotEmpty()
    @IsString()
    inventoryLocation: string;

    @IsOptional()
    @IsDateString()
    expectedOn?: string;

    @IsOptional()
    @IsDateString()
    deliveryBy?: string;

    @IsOptional()
    @IsDateString()
    receivedOn?: string;
}
