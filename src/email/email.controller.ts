import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Get,
  Query,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @UseGuards(AuthGuard)
  @Post('send')
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'emails');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const name = file.originalname.split('.')[0];
          cb(null, `${name}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async sendEmail(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: any,
  ) {
    const { employeeId, to, subject, message } = body;

    if (!employeeId) {
      throw new HttpException(
        'Employee ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sendEmailDto: SendEmailDto = { to, subject, message };
    return this.emailService.sendEmail(files, sendEmailDto, employeeId);
  }

  @UseGuards(AuthGuard)
  @Get('history')
  async getHistory(
    @Query('employeeId') employeeId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!employeeId) {
      throw new HttpException(
        'Employee ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.emailService.getHistory(
      employeeId,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(AuthGuard)
  @Get('templates')
  async getTemplates() {
    return this.emailService.getTemplates();
  }

  @UseGuards(AuthGuard)
  @Post('templates')
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.emailService.createTemplate(createTemplateDto);
  }
}
