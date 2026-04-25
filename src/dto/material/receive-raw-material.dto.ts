import { IsNotEmpty, IsString } from 'class-validator';

export class ReceiveRawMaterialDto {
  @IsNotEmpty()
  @IsString()
  receivedBy: string;

  @IsNotEmpty()
  @IsString()
  receivedById: string;
}
