import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { SocketModule } from '../socket/socket.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RawMaterial,
  RawMaterialSchema,
} from '../material/entities/raw-material.schema';
import {
  InventoryItem,
  InventoryItemSchema,
} from '../material/entities/inventory-item.schema';
import {
  ProductionOrder,
  ProductionOrderSchema,
} from '../production/entities/production-order.schema';
import {
  QualityCheck,
  QualityCheckSchema,
} from '../quality/entities/quality-check.schema';

@Module({
  imports: [
    SocketModule,
    MongooseModule.forFeature([
      { name: RawMaterial.name, schema: RawMaterialSchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: ProductionOrder.name, schema: ProductionOrderSchema },
      { name: QualityCheck.name, schema: QualityCheckSchema },
    ]),
  ],
  providers: [MonitoringService],
})
export class MonitoringModule {}
