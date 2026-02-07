import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDocument } from './entities/email.schema';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from './entities/email-template.schema';
import { SendEmailDto } from './dto/send-email.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    @InjectModel(EmailTemplate.name)
    private templateModel: Model<EmailTemplateDocument>,
  ) {}

  async sendEmail(
    files: Array<Express.Multer.File>,
    sendEmailDto: SendEmailDto,
    senderId: string,
  ) {
    // In a real app, this would use a mailer service (e.g., Nodemailer, SendGrid)
    // For now, we simulate sending and just store the record.

    const attachments = files ? files.map((file) => file.path) : [];

    const newEmail = new this.emailModel({
      ...sendEmailDto,
      senderId,
      attachments,
      status: 'sent',
    });

    await newEmail.save();

    this.logger.log(`Email sent to ${sendEmailDto.to} by ${senderId}`);

    return {
      message: 'Email sent successfully',
      data: newEmail,
    };
  }

  async getHistory(senderId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query = { senderId };

    const [emails, total] = await Promise.all([
      this.emailModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.emailModel.countDocuments(query).exec(),
    ]);

    return {
      data: emails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTemplates() {
    return this.templateModel.find().exec();
  }

  async createTemplate(createTemplateDto: CreateTemplateDto) {
    const newTemplate = new this.templateModel(createTemplateDto);
    return newTemplate.save();
  }
}
