import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { RawMaterial, RawMaterialSchema } from './entities/raw-material.schema';
import {
  CompanyMaterial,
  CompanyMaterialSchema,
} from './entities/company-material.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { Company, CompanySchema } from 'src/company/entities/company.schema';

import {
  InventoryItem,
  InventoryItemSchema,
} from './entities/inventory-item.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RawMaterial.name, schema: RawMaterialSchema },
      { name: CompanyMaterial.name, schema: CompanyMaterialSchema },
      { name: Company.name, schema: CompanySchema },
      { name: InventoryItem.name, schema: InventoryItemSchema },
    ]),
    AuthModule,
    UserModule,
  ],
  controllers: [MaterialController, InventoryController],
  providers: [MaterialService, InventoryService],
  exports: [MaterialService, InventoryService],
})
export class MaterialModule {}
