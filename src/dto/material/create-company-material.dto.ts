import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

    @IsNotEmpty()
    @IsString()
    receivedBy: string;

    @IsNotEmpty()
    @IsString()
    receivedById: string;

    @IsNotEmpty()
    @IsString()
    inventoryLocation: string;
}
