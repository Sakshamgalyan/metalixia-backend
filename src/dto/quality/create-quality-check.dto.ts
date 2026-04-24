import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QualityParameterDto {
  @IsString()
  name: string;

  @IsString()
  expected: string;

  @IsString()
  actual: string;

  @IsBoolean()
  passed: boolean;
}

export class CreateQualityCheckDto {
  @IsString()
  inspectedBy: string;

  @IsString()
  inspectedById: string;

  @IsString()
  @IsIn(['passed', 'failed'])
  result: string;

  @IsOptional()
  @IsString()
  defectType?: string;

  @IsOptional()
  @IsString()
  defectDescription?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityParameterDto)
  parameters?: QualityParameterDto[];

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
