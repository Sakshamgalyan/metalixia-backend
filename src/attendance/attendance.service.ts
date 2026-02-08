import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './entities/attendance.schema';
import { UserService } from 'src/user/user.service';
import * as fs from 'fs';
import { CreateAttendanceDto } from 'src/dto/attendance/create-attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    private readonly userService: UserService,
  ) {}

  async create(
    file: Express.Multer.File,
    createAttendanceDto: CreateAttendanceDto,
  ) {
    const newAttendance = new this.attendanceModel({
      ...createAttendanceDto,
      fileName: file.filename,
      location: file.path,
    });
    return newAttendance.save();
  }

  async findAll(page: number = 1, limit: number = 10, employeeId?: string) {
    const skip = (page - 1) * limit;
    const query: any = { isDeleted: false };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const [attendances, total] = await Promise.all([
      this.attendanceModel
        .find(query)
        .sort({ createdOn: -1 })
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
        uploadedAt: (attendance as any).createdOn,
        uploadedBy: uploader?.name || 'Unknown',
        fileName: `Attendance_${attendance.month}_${attendance.year}.pdf`,
      };
    });

    return {
      status: 'success',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: string) {
    const attendance = await this.attendanceModel.findById(id);
    if (!attendance) return null;

    try {
      if (fs.existsSync(attendance.location)) {
        fs.unlinkSync(attendance.location);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${attendance.location}`, error);
    }

    return this.attendanceModel.findByIdAndDelete(id).exec();
  }

  async download(id: string) {
    const attendance = await this.attendanceModel.findById(id);
    return attendance;
  }
}
