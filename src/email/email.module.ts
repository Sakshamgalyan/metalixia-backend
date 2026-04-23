import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Email, EmailSchema } from './entities/email.schema';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './entities/email-template.schema';
import {
  Verification,
  VerificationSchema,
} from './entities/verification.schema';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: Verification.name, schema: VerificationSchema },
    ]),
    UserModule,
  ],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
