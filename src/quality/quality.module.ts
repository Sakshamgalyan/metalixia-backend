import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import {
  QualityCheck,
  QualityCheckSchema,
} from './entities/quality-check.schema';
import {
  ProductionOrder,
  ProductionOrderSchema,
} from 'src/production/entities/production-order.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QualityCheck.name, schema: QualityCheckSchema },
      { name: ProductionOrder.name, schema: ProductionOrderSchema },
    ]),
    AuthModule,
    UserModule,
  ],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
