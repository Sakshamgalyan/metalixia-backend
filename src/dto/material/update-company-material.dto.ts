import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCompanyMaterialReceiverDto {
  @IsNotEmpty()
  @IsString()
  receivedBy: string;

  @IsNotEmpty()
  @IsString()
  receivedById: string;
}
