import { Controller, Post, Body, UseInterceptors, UploadedFiles, HttpException, HttpStatus, UseGuards, Get, Query, Res, Param } from '@nestjs/common';
import type { Response } from 'express';
import { EmployeeService } from './employee.service';
import { ReportUploadDto } from 'src/dto/employee/reportUpload.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/dto/Role/Role.dto';
import { ReportDeleteDto } from 'src/dto/employee/reportDelete.dto';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN, Role.MANAGER, Role.QUALITY)
  @Post('report-upload')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'uploads', 'Reports');
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const name = req.body.reportName || 'report';
        cb(null, `${name}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(pdf|csv)$/)) {
        return cb(new HttpException('Only .pdf and .csv files are allowed!', HttpStatus.BAD_REQUEST), false);
      }
      cb(null, true);
    },
  }))
  async uploadReport(@UploadedFiles() files: Array<Express.Multer.File>, @Body() reportUploadDto: ReportUploadDto) {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
    }
    return this.employeeService.uploadReport(files, reportUploadDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN, Role.MANAGER, Role.QUALITY)
  @Get('get-reports')
  async getReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.employeeService.getReports(Number(page), Number(limit));
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN, Role.MANAGER, Role.QUALITY)
  @Post('delete-report')
  async deleteReport(@Body() reportDeleteDto: ReportDeleteDto) {
    return this.employeeService.deleteReport(reportDeleteDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('scheduled-deleted-report')
  async scheduledDeletedReport() {
    return this.employeeService.scheduledDeletedReport();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN, Role.MANAGER, Role.QUALITY)
  @Get('download-report/:reportId')
  async downloadReport(@Param() params: { reportId: string }, @Res() res: Response) {
    const report = await this.employeeService.downloadReport(params.reportId);
    if (!report) {
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    }

    if (!existsSync(report.location)) {
      throw new HttpException('File not found on server', HttpStatus.NOT_FOUND);
    }

    return res.download(report.location, report.originalName);
  }


  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('abort-report/:reportId')
  async abortReport(@Param() params: { reportId: string }) {
    return this.employeeService.abortReport(params.reportId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.REPORT_ADMIN, Role.TEMP_ADMIN, Role.MANAGER, Role.QUALITY)
  @Get('get-reports-by-employee-id/:employeeId')
  async getReportsByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.employeeService.getReportsByEmployeeId(employeeId, Number(page), Number(limit));
  }
}
