import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import SendGrid from '@sendgrid/mail';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDocument } from './entities/email.schema';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from './entities/email-template.schema';
import { Verification, VerificationDocument } from './entities/verification.schema';
import { SendEmailDto } from './dto/send-email.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private gmailTransporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
    @InjectModel(EmailTemplate.name)
    private templateModel: Model<EmailTemplateDocument>,
    @InjectModel(Verification.name)
    private verificationModel: Model<VerificationDocument>,
  ) {
    // Configure SendGrid
    if (process.env.SENDGRID_API_KEY) {
      SendGrid.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      this.logger.warn('SENDGRID_API_KEY is not defined');
    }

    // Configure Gmail SMTP
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      this.logger.log('Gmail SMTP configured successfully');
    } else {
      this.logger.warn('GMAIL_USER or GMAIL_APP_PASSWORD is not defined');
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

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to user's email
   */
  async sendOTP(email: string, userId: string): Promise<void> {
    if (!this.gmailTransporter) {
      throw new BadRequestException('Gmail SMTP is not configured');
    }

    // Generate OTP
    const otp = this.generateOTP();

    // Calculate expiry time (default 10 minutes)
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Invalidate any existing OTPs for this email
    await this.verificationModel.updateMany(
      { email, isUsed: false },
      { isUsed: true }
    );

    // Save new OTP to database
    const verification = new this.verificationModel({
      email,
      userId,
      otp,
      expiresAt,
      isUsed: false,
    });
    await verification.save();

    // Send OTP via Gmail
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Email Verification - OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your OTP for email verification is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP will expire in ${expiryMinutes} minutes.</p>
          <p style="color: #666;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.gmailTransporter.sendMail(mailOptions);
      this.logger.log(`OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}: ${error.message}`);
      throw new BadRequestException('Failed to send OTP email');
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string): Promise<string> {
    // Find the verification record
    const verification = await this.verificationModel.findOne({
      email,
      otp,
      isUsed: false,
    });

    if (!verification) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check if OTP is expired
    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    // Mark OTP as used
    verification.isUsed = true;
    await verification.save();

    this.logger.log(`OTP verified successfully for ${email}`);
    return verification.userId.toString();
  }
}

