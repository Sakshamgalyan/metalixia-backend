import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRawMaterialDto {
    @IsNotEmpty()
    @IsString()
    materialName: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    @IsString()
    source: string;

    @IsNotEmpty()
    @IsString()
    receivedBy: string;

    @IsNotEmpty()
    @IsString()
    receivedById: string;
}
