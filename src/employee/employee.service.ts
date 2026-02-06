import { Injectable, Logger } from '@nestjs/common';
import { ReportUploadDto } from 'src/dto/employee/reportUpload.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './entities/report.schema';
import { ReportDeleteDto } from 'src/dto/employee/reportDelete.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(@InjectModel(Report.name) private reportModel: Model<ReportDocument>) { }

  async uploadReport(files: Array<Express.Multer.File>, reportUploadDto: ReportUploadDto) {
    const savedReports = await Promise.all(files.map(async (file) => {
      const newReport = new this.reportModel({
        name: file.filename,
        fileType: file.mimetype,
        location: file.path,
        employeeId: reportUploadDto.employeeId,
        originalName: file.originalname,
      });
      return newReport.save();
    }));

    return {
      message: `${savedReports.length} reports uploaded successfully`,
      status: 'success',
    };
  }

  async getReports(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query: any = { isDeleted: false };

    const [reports, total] = await Promise.all([
      this.reportModel.find(query).sort({ uploadedTime: -1 }).skip(skip).limit(limit).exec(),
      this.reportModel.countDocuments(query).exec(),
    ]);

    return {
      status: 'success',
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async downloadReport(reportId: string) {
    return this.reportModel.findOne({ _id: reportId, isDeleted: false }).exec();
  }

  async deleteReport(reportDeleteDto: ReportDeleteDto) {
    const report = await this.reportModel.findByIdAndUpdate(
      reportDeleteDto.reportId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!report) {
      return {
        message: 'Report not found',
        status: 'error',
      };
    }
    return {
      message: 'Report marked for deletion',
      status: 'success',
    };
  }

  async scheduledDeletedReport() {
    return this.reportModel.find({ isDeleted: true }).exec();
  }

  async abortReport(reportId: string) {
    const report = await this.reportModel.findByIdAndUpdate(
      reportId,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).exec();

    if (!report) {
      return {
        message: 'Report not found',
        status: 'error',
      };
    }
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

    const reportsToDelete = await this.reportModel.find({
      isDeleted: true,
      deletedAt: { $lte: sevenDaysAgo }
    }).exec();

    for (const report of reportsToDelete) {
      try {
        if (fs.existsSync(report.location)) {
          fs.unlinkSync(report.location);
          this.logger.log(`Deleted file: ${report.location}`);
        }
        await this.reportModel.findByIdAndDelete(report._id).exec();
        this.logger.log(`Deleted database record for report: ${report._id}`);
      } catch (error) {
        this.logger.error(`Failed to delete report ${report._id}: ${error.message}`);
      }
    }
    this.logger.log(`Cleanup complete. Processed ${reportsToDelete.length} reports.`);
  }

  async getReportsByEmployeeId(employeeId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query: any = { employeeId, isDeleted: false };

    const [reports, total] = await Promise.all([
      this.reportModel.find(query).sort({ uploadedTime: -1 }).skip(skip).limit(limit).exec(),
      this.reportModel.countDocuments(query).exec(),
    ]);

    return {
      status: 'success',
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
