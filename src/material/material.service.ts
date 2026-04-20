import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RawMaterial, RawMaterialDocument } from './entities/raw-material.schema';
import { CompanyMaterial, CompanyMaterialDocument } from './entities/company-material.schema';
import { CreateRawMaterialDto } from 'src/dto/material/create-raw-material.dto';
import { CreateCompanyMaterialDto } from 'src/dto/material/create-company-material.dto';
import { UpdateCompanyMaterialReceiverDto } from 'src/dto/material/update-company-material.dto';
import { UpdateCompanyMaterialFullDto } from 'src/dto/material/update-company-material-full.dto';

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
            this.rawMaterialModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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

    async getCompanyMaterials(page: number, limit: number, search?: string) {
        const skip = (page - 1) * limit;
        const filter: any = {};
        if (search) {
            filter.$or = [
                { materialName: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { inventoryLocation: { $regex: search, $options: 'i' } }
            ];
        }

        const [data, total] = await Promise.all([
            this.companyMaterialModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.companyMaterialModel.countDocuments(filter).exec()
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async updateCompanyMaterial(id: string, updateDto: UpdateCompanyMaterialFullDto): Promise<CompanyMaterial> {
        const updateFields: Record<string, any> = {};
        if (updateDto.quantity !== undefined) updateFields.quantity = updateDto.quantity;
        if (updateDto.unit !== undefined) updateFields.unit = updateDto.unit;
        if (updateDto.expectedOn !== undefined) updateFields.expectedOn = updateDto.expectedOn;
        if (updateDto.deliveryBy !== undefined) updateFields.deliveryBy = updateDto.deliveryBy;
        if (updateDto.receivedOn !== undefined) updateFields.receivedOn = updateDto.receivedOn;
        if (updateDto.inventoryLocation !== undefined) updateFields.inventoryLocation = updateDto.inventoryLocation;
        if (updateDto.receivedBy !== undefined) updateFields.receivedBy = updateDto.receivedBy;
        if (updateDto.receivedById !== undefined) updateFields.receivedById = updateDto.receivedById;

        const updatedMaterial = await this.companyMaterialModel.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true }
        ).exec();

        if (!updatedMaterial) {
            throw new NotFoundException(`Company Material with ID ${id} not found`);
        }

        return updatedMaterial;
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

    async getCompanyMaterialStats() {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Aggregate daily counts for the last 7 days
        const dailyAgg = await this.companyMaterialModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo, $lte: now }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                }
            },
            { $sort: { _id: 1 } }
        ]).exec();

        // Fill in missing days with zero counts
        const dailyCounts: { date: string; count: number; totalQuantity: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = dailyAgg.find((item: any) => item._id === dateStr);
            dailyCounts.push({
                date: dateStr,
                count: found ? found.count : 0,
                totalQuantity: found ? found.totalQuantity : 0,
            });
        }

        const totalThisWeek = dailyCounts.reduce((sum, d) => sum + d.count, 0);
        const totalQuantityThisWeek = dailyCounts.reduce((sum, d) => sum + d.totalQuantity, 0);

        // Count unique companies in last 7 days
        const activeCompaniesAgg = await this.companyMaterialModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo, $lte: now }
                }
            },
            {
                $group: {
                    _id: '$companyName'
                }
            },
            {
                $count: 'count'
            }
        ]).exec();

        const activeCompanies = activeCompaniesAgg.length > 0 ? activeCompaniesAgg[0].count : 0;

        return {
            dailyCounts,
            totalThisWeek,
            totalQuantityThisWeek,
            activeCompanies,
        };
    }
}
