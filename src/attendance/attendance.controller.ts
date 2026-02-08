import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import express from 'express';
import { CreateAttendanceDto } from 'src/dto/attendance/create-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'Attendance');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(
            new HttpException(
              'Only PDF files are allowed!',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createAttendanceDto: CreateAttendanceDto,
  ) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    await this.attendanceService.create(file, createAttendanceDto);
    return {
      status: 'success',
      message: 'Attendance uploaded successfully',
    };
  }

  @Get('get-all-attendance')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.attendanceService.findAll(
      Number(page),
      Number(limit),
      employeeId,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.attendanceService.remove(id);
    return {
      status: 'success',
      message: 'Attendance deleted successfully',
    };
  }

  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: express.Response) {
    const attendance = await this.attendanceService.download(id);
    if (!attendance || !existsSync(attendance.location)) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
    return res.download(
      attendance.location,
      `Attendance_${attendance.month}_${attendance.year}${extname(attendance.fileName)}`,
    );
  }
}
