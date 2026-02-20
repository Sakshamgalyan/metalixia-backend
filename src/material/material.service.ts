import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RawMaterial, RawMaterialDocument } from './entities/raw-material.schema';
import { CompanyMaterial, CompanyMaterialDocument } from './entities/company-material.schema';
import { CreateRawMaterialDto } from 'src/dto/material/create-raw-material.dto';
import { CreateCompanyMaterialDto } from 'src/dto/material/create-company-material.dto';
import { UpdateCompanyMaterialReceiverDto } from 'src/dto/material/update-company-material.dto';

@Injectable()
export class MaterialService {
    constructor(
        @InjectModel(RawMaterial.name) private rawMaterialModel: Model<RawMaterialDocument>,
        @InjectModel(CompanyMaterial.name) private companyMaterialModel: Model<CompanyMaterialDocument>,
    ) { }

    async createRawMaterial(createRawMaterialDto: CreateRawMaterialDto): Promise<RawMaterial> {
        const createdMaterial = new this.rawMaterialModel(createRawMaterialDto);
        return createdMaterial.save();
    }

    async getRawMaterials(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.rawMaterialModel.find().sort({ receivedAt: -1 }).skip(skip).limit(limit).exec(),
            this.rawMaterialModel.countDocuments().exec()
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async createCompanyMaterial(createCompanyMaterialDto: CreateCompanyMaterialDto): Promise<CompanyMaterial> {
        const createdMaterial = new this.companyMaterialModel(createCompanyMaterialDto);
        return createdMaterial.save();
    }

    async getCompanyMaterials(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.companyMaterialModel.find().sort({ receivedAt: -1 }).skip(skip).limit(limit).exec(),
            this.companyMaterialModel.countDocuments().exec()
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async updateCompanyMaterialReceiver(id: string, updateDto: UpdateCompanyMaterialReceiverDto): Promise<CompanyMaterial> {
        const updatedMaterial = await this.companyMaterialModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    receivedBy: updateDto.receivedBy,
                    receivedById: updateDto.receivedById
                }
            },
            { new: true }
        ).exec();

        if (!updatedMaterial) {
            throw new NotFoundException(`Company Material with ID ${id} not found`);
        }

        return updatedMaterial;
    }
}
