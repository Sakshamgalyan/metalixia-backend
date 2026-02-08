import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './entities/report.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    AuthModule,
    UserModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [MongooseModule],
})
export class EmployeeModule {}
