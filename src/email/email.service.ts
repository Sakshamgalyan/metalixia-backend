import { Injectable, Logger } from '@nestjs/common';
import SendGrid from '@sendgrid/mail';
import * as fs from 'fs';
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
  ) {
    if (process.env.SENDGRID_API_KEY) {
      SendGrid.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      this.logger.warn('SENDGRID_API_KEY is not defined');
    }
  }

  async sendEmail(
    files: Array<Express.Multer.File>,
    sendEmailDto: SendEmailDto,
    senderId: string,
  ) {
    const attachments = files ? files.map((file) => file.path) : [];

    try {
      if (!process.env.SENDGRID_FROM) {
        throw new Error('SENDGRID_FROM is not defined');
      }

      // Updating to read file content for SendGrid
      const sgAttachments = (files || [])
        .map((file) => {
          try {
            return {
              content: fs.readFileSync(file.path).toString('base64'),
              filename: file.originalname,
              type: file.mimetype,
              disposition: 'attachment',
            };
          } catch (err) {
            this.logger.error(
              `Failed to read file ${file.path}: ${err.message}`,
            );
            return null;
          }
        })
        .filter((attachment) => attachment !== null) as any; // Cast as any because SendGrid types might conflict slightly or TS inference with null check needs improvement

      await SendGrid.send({
        to: sendEmailDto.to,
        from: process.env.SENDGRID_FROM,
        subject: sendEmailDto.subject,
        html: sendEmailDto.message,
        attachments: sgAttachments,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${sendEmailDto.to}: ${error.message}`,
        error?.response?.body,
      );
      throw error;
    }

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
