import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { EmployeeModule } from './employee/employee.module';
import { EmailModule } from './email/email.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { AttendanceModule } from './attendance/attendance.module';
import { PayslipModule } from './payslip/payslip.module';
import { CompanyModule } from './company/company.module';
import { MaterialModule } from './material/material.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    MongooseModule.forRoot(process.env.DATABASE_URL as string),
    AdminModule,
    EmployeeModule,
    EmailModule,
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS,
        },
      },
      defaults: {
        from: '"Nest App" <[EMAIL_ADDRESS]>',
      },
    }),
    PayslipModule,
    AttendanceModule,
    MaterialModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
