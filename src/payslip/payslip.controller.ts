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
  Patch,
} from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import express from 'express';
import { CreatePayslipDto } from 'src/dto/paySlip/create-payslip.dto';

@Controller('payslip')
export class PayslipController {
  constructor(private readonly payslipService: PayslipService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'Payslips');
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
    @Body() createPayslipDto: CreatePayslipDto,
  ) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    await this.payslipService.create(file, createPayslipDto);
    return {
      status: 'success',
      message: 'Payslip uploaded successfully',
    };
  }

  @Get('get-all-payslips')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.payslipService.findAllByEmployeeId(Number(page), Number(limit), employeeId);
  }

  @Get('get-payslips')
  allPayslips(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.payslipService.allPayslips(Number(page), Number(limit));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.payslipService.remove(id);
    return {
      status: 'success',
      message: 'Payslip deleted successfully',
    };
  }

  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: express.Response) {
    const payslip = await this.payslipService.download(id);
    if (!payslip || !existsSync(payslip.location)) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
    return res.download(
      payslip.location,
      `Payslip_${payslip.month}_${payslip.year}${extname(payslip.fileName)}`,
    );
  }
}
