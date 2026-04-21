import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { RawMaterial, RawMaterialSchema } from './entities/raw-material.schema';
import { CompanyMaterial, CompanyMaterialSchema } from './entities/company-material.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { Company, CompanySchema } from 'src/company/entities/company.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: RawMaterial.name, schema: RawMaterialSchema },
            { name: CompanyMaterial.name, schema: CompanyMaterialSchema },
            { name: Company.name, schema: CompanySchema },
        ]),
        AuthModule,
        UserModule
    ],
    controllers: [MaterialController],
    providers: [MaterialService],
    exports: [MaterialService]
})
export class MaterialModule { }
