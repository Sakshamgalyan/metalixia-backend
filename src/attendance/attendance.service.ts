import { Injectable, Logger } from '@nestjs/common';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './entities/attendance.schema';
import { UserService } from 'src/user/user.service';
import { CreateAttendanceDto } from 'src/dto/attendance/create-attendance.dto';
import { FileService } from 'src/common/file.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  async create(
    file: Express.Multer.File,
    createAttendanceDto: CreateAttendanceDto,
  ) {
    this.logger.log(
      `Creating attendance record for employee ${createAttendanceDto.employeeId}, month: ${createAttendanceDto.month}, year: ${createAttendanceDto.year}`,
    );
    const newAttendance = new this.attendanceModel({
      ...createAttendanceDto,
      fileName: file.filename,
      location: file.path,
    });
    const result = await newAttendance.save();
    this.logger.log(
      `Attendance record created successfully for employee ${createAttendanceDto.employeeId}`,
    );
    return result;
  }

  async findAll(page: number = 1, limit: number = 10, employeeId?: string) {
    this.logger.debug(
      `Fetching attendance records: page ${page}, limit: ${limit}, employeeId: ${employeeId || 'all'}`,
    );
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { isDeleted: false };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const [attendances, total] = await Promise.all([
      this.attendanceModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.attendanceModel.countDocuments(query).exec(),
    ]);

    const employeeIds = attendances.map((p) => p.employeeId);
    const uploaderIds = attendances.map((p) => p.uploadedBy);
    const allIds = [...new Set([...employeeIds, ...uploaderIds])];

    const employees = await this.userService.getAllEmployees(allIds);

    const data = attendances.map((attendance) => {
      const employee = employees.find(
        (e) => e.employeeId === attendance.employeeId,
      );
      const uploader = employees.find(
        (e) => e.employeeId === attendance.uploadedBy,
      );
      return {
        id: attendance._id.toString(),
        employeeId: attendance.employeeId,
        firstName: employee?.name || 'Unknown',
        month: attendance.month,
        year: attendance.year,
        uploadedAt: attendance.createdAt,
        uploadedBy: uploader?.name || 'Unknown',
        fileName: `Attendance_${attendance.month}_${attendance.year}.pdf`,
      };
    });

    this.logger.log(
      `Found ${attendances.length} attendance records (total: ${total})`,
    );
    return buildPaginatedResponse(data, total, page, limit);
  }

  async remove(id: string) {
    this.logger.log(`Removing attendance record: ${id}`);
    const attendance = await this.attendanceModel.findById(id);
    if (!attendance) {
      this.logger.warn(`Attendance record not found for deletion: ${id}`);
      return null;
    }

    try {
      await this.fileService.deleteFile(attendance.location);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${attendance.location}`, error);
    }

    const result = await this.attendanceModel.findByIdAndDelete(id).exec();
    this.logger.log(`Attendance record ${id} removed successfully`);
    return result;
  }

  async download(id: string) {
    const attendance = await this.attendanceModel.findById(id);
    return attendance;
  }
}
