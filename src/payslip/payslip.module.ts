import { Module } from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { PayslipController } from './payslip.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payslip, PayslipSchema } from './entities/payslip.schema';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payslip.name, schema: PayslipSchema }]),
    UserModule,
  ],
  controllers: [PayslipController],
  providers: [PayslipService],
})
export class PayslipModule {}
