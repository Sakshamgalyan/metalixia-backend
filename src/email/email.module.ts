import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Email, EmailSchema } from './entities/email.schema';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './entities/email-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
  ],
  providers: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
