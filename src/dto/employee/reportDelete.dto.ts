import { IsNotEmpty, IsString } from "class-validator";

export class ReportDeleteDto {
    @IsNotEmpty()
    @IsString()
    reportId: string;
}