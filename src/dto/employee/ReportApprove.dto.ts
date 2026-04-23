import { IsString } from 'class-validator';

export class ReportApproveDto {
  @IsString()
  reportId: string;

  @IsString()
  status: string;
}
