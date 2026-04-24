import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateProductionStatusDto {
  @IsString()
  @IsIn([
    'queued',
    'in_production',
    'quality_check',
    'passed',
    'rejected',
    'ready_for_dispatch',
    'dispatched',
  ])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdvanceProcessDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
