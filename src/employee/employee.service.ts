import { Injectable, Logger } from '@nestjs/common';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { ReportUploadDto } from 'src/dto/employee/reportUpload.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './entities/report.schema';
import { ReportDeleteDto } from 'src/dto/employee/reportDelete.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import { ReportApproveDto } from 'src/dto/employee/ReportApprove.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private readonly userService: UserService,
  ) {}

  async uploadReport(
    files: Array<Express.Multer.File>,
    reportUploadDto: ReportUploadDto,
  ) {
    this.logger.log(
      `Starting upload of ${files.length} files for employee ${reportUploadDto.employeeId}`,
    );
    const savedReports = await Promise.all(
      files.map(async (file) => {
        this.logger.debug(
          `Uploading file: ${file.originalname}, size: ${file.size} bytes, type: ${file.mimetype}`,
        );
        const newReport = new this.reportModel({
          name: file.filename,
          fileType: file.mimetype,
          location: file.path,
          employeeId: reportUploadDto.employeeId,
          originalName: file.originalname,
        });
        return newReport.save();
      }),
    );

    this.logger.log(
      `Successfully uploaded ${savedReports.length} reports for employee ${reportUploadDto.employeeId}`,
    );
    return {
      message: `${savedReports.length} reports uploaded successfully`,
      status: 'success',
    };
  }

  async getReports(page: number = 1, limit: number = 10, id: string) {
    this.logger.debug(
      `Fetching reports for employee ${id}, page: ${page}, limit: ${limit}`,
    );
    const skip = (page - 1) * limit;
    const query: any = { isDeleted: false, employeeId: id };

    const [reports, total] = await Promise.all([
      this.reportModel
        .find(query)
        .sort({ uploadedTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(query).exec(),
    ]);

    this.logger.log(
      `Found ${reports.length} reports for employee ${id} (total: ${total})`,
    );
    const reportData = reports.map((report) => ({
      id: report._id.toString(),
      name: report.name.split('-')[0],
      date: (report as any).uploadedTime
        ? new Date((report as any).uploadedTime).getTime()
        : Date.now(),
      fileType: report.fileType,
      status: report.status,
    }));

    return buildPaginatedResponse(reportData, total, page, limit);
  }

  async getAllReports(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.reportModel
        .find()
        .sort({ uploadedTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments().exec(),
    ]);

    const employees = await this.userService.getAllEmployees(
      reports.map((report) => report.employeeId),
    );

    const reportData = reports.map((report) => {
      const employee = employees.find(
        (e) => e.employeeId === report.employeeId,
      );
      return {
        id: report._id.toString(),
        name: report.name.split('-')[0],
        date: (report as any).uploadedTime
          ? new Date((report as any).uploadedTime).getTime()
          : Date.now(),
        fileType: report.fileType,
        status: report.status,
        uploadedBy: employee ? employee.name : 'Unknown',
        employeeId: report.employeeId,
      };
    });

    return buildPaginatedResponse(reportData, total, page, limit);
  }

  async approveReport(reportApproveDto: ReportApproveDto) {
    this.logger.log(
      `Approving report ${reportApproveDto.reportId} with status: ${reportApproveDto.status}`,
    );
    const report = await this.reportModel
      .findByIdAndUpdate(reportApproveDto.reportId, {
        status: reportApproveDto.status,
      })
      .exec();
    if (!report) {
      this.logger.warn(
        `Report not found for approval: ${reportApproveDto.reportId}`,
      );
      return {
        message: 'Report not found',
        status: 'error',
      };
    }
    this.logger.log(
      `Report ${reportApproveDto.reportId} approved successfully`,
    );
    return {
      message: `Report approved successfully`,
      status: 'success',
    };
  }

  async downloadReport(reportId: string) {
    this.logger.debug(`Fetching report for download: ${reportId}`);
    return this.reportModel.findOne({ _id: reportId, isDeleted: false }).exec();
  }

  async deleteReport(reportDeleteDto: ReportDeleteDto) {
    this.logger.log(`Marking report ${reportDeleteDto.id} for deletion`);
    const report = await this.reportModel
      .findByIdAndUpdate(
        reportDeleteDto.id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!report) {
      this.logger.warn(`Report not found for deletion: ${reportDeleteDto.id}`);
      return {
        message: 'Report not found',
        status: 'error',
      };
    }
    this.logger.log(`Report ${reportDeleteDto.id} marked for deletion`);
    return {
      message: 'Report marked for deletion',
      status: 'success',
    };
  }

  async scheduledDeletedReport() {
    return this.reportModel.find({ isDeleted: true }).exec();
  }

  async abortReport(reportId: string) {
    this.logger.log(`Aborting deletion for report: ${reportId}`);
    const report = await this.reportModel
      .findByIdAndUpdate(
        reportId,
        { isDeleted: false, deletedAt: null },
        { new: true },
      )
      .exec();

    if (!report) {
      this.logger.warn(`Report not found for abort: ${reportId}`);
      return {
        message: 'Report not found',
        status: 'error',
      };
    }
    this.logger.log(`Report deletion aborted for: ${reportId}`);
    return {
      message: 'Report deletion stopped.',
      status: 'success',
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleReportCleanup() {
    this.logger.log('Starting scheduled report cleanup...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reportsToDelete = await this.reportModel
      .find({
        isDeleted: true,
        deletedAt: { $lte: sevenDaysAgo },
      })
      .exec();

    for (const report of reportsToDelete) {
      try {
        try {
          await fs.promises.unlink(report.location);
          this.logger.log(`Deleted file: ${report.location}`);
        } catch (fileError) {
          // ignore if file doesn't exist
        }
        await this.reportModel.findByIdAndDelete(report._id).exec();
        this.logger.log(
          `Deleted database record for report: ${report._id.toString()}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to delete report ${report._id.toString()}: ${error.message}`,
        );
      }
    }
    this.logger.log(
      `Cleanup complete. Processed ${reportsToDelete.length} reports.`,
    );
  }

  async getReportsByEmployeeId(
    employeeId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    this.logger.log(
      `Fetching reports for employeeId: ${employeeId}, page: ${page}, limit: ${limit}`,
    );
    const skip = (page - 1) * limit;
    const query: any = { employeeId, isDeleted: false };

    const [reports, total] = await Promise.all([
      this.reportModel
        .find(query)
        .sort({ uploadedTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(query).exec(),
    ]);

    this.logger.log(
      `Found ${reports.length} reports for employeeId: ${employeeId} (total: ${total})`,
    );
    return buildPaginatedResponse(reports, total, page, limit);
  }

  async getMailedReports(page: number = 1, limit: number = 10) {
    this.logger.log(`Fetching mailed reports: page ${page}, limit: ${limit}`);
    const skip = (page - 1) * limit;
    const query: any = { status: 'mailed', isDeleted: false };
    const [reports, total] = await Promise.all([
      this.reportModel
        .find(query)
        .sort({ uploadedTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(query).exec(),
    ]);

    this.logger.log(`Found ${reports.length} mailed reports (total: ${total})`);
    const reportData = reports.map((report) => ({
      id: report._id.toString(),
      name: report.name.split('-')[0],
      date: (report as any).uploadedTime
        ? new Date((report as any).uploadedTime).getTime()
        : Date.now(),
      fileType: report.fileType,
      status: report.status,
    }));

    return buildPaginatedResponse(reportData, total, page, limit);
  }
  async getEmployees(page: number = 1, limit: number = 1000) {
    return this.userService.findByEmployee({ page, limit });
  }
}
