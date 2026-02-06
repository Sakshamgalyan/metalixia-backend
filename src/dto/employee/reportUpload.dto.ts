import { IsNotEmpty, IsString } from "class-validator";

export class ReportUploadDto {
    @IsNotEmpty()
    @IsString()
    reportName: string;

    @IsNotEmpty()
    @IsString()
    employeeId: string;
}