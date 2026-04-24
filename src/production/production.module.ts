import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import {
  ProductionOrder,
  ProductionOrderSchema,
} from './entities/production-order.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductionOrder.name, schema: ProductionOrderSchema },
    ]),
    AuthModule,
    UserModule,
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
