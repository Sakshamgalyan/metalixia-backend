import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, QueryFilter } from 'mongoose';
import {
  RawMaterial,
  RawMaterialDocument,
} from './entities/raw-material.schema';
import {
  CompanyMaterial,
  CompanyMaterialDocument,
} from './entities/company-material.schema';
import { CreateRawMaterialDto } from 'src/dto/material/create-raw-material.dto';
import { CreateCompanyMaterialDto } from 'src/dto/material/create-company-material.dto';
import { UpdateCompanyMaterialReceiverDto } from 'src/dto/material/update-company-material.dto';
import { UpdateCompanyMaterialFullDto } from 'src/dto/material/update-company-material-full.dto';
import { UpdateRawMaterialDto } from 'src/dto/material/update-raw-material.dto';
import { ReceiveRawMaterialDto } from 'src/dto/material/receive-raw-material.dto';
import { Company, CompanyDocument } from 'src/company/entities/company.schema';
import {
  InventoryItem,
  InventoryItemDocument,
} from './entities/inventory-item.schema';

@Injectable()
export class MaterialService {
  constructor(
    @InjectModel(RawMaterial.name)
    private rawMaterialModel: Model<RawMaterialDocument>,
    @InjectModel(CompanyMaterial.name)
    private companyMaterialModel: Model<CompanyMaterialDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryModel: Model<InventoryItemDocument>,
  ) {}

  async createRawMaterial(
    createRawMaterialDto: CreateRawMaterialDto,
  ): Promise<RawMaterial> {
    const createdMaterial = new this.rawMaterialModel(createRawMaterialDto);
    return createdMaterial.save();
  }

  async getRawMaterials(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const filter: QueryFilter<RawMaterialDocument> = {};
    if (search) {
      filter.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.rawMaterialModel
        .find(filter)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.rawMaterialModel.countDocuments(filter).exec(),
    ]);
    return buildPaginatedResponse(data, total, page, limit);
  }

  async deleteRawMaterial(id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const deletedMaterial = await this.rawMaterialModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedMaterial) {
      throw new NotFoundException(`Raw Material with ID ${id} not found`);
    }
  }

  async updateRawMaterial(
    id: string,
    updateDto: UpdateRawMaterialDto,
  ): Promise<RawMaterial> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const updateFields: Record<string, unknown> = {};

    if (updateDto.materialName !== undefined)
      updateFields.materialName = updateDto.materialName;
    if (updateDto.quantity !== undefined)
      updateFields.quantity = updateDto.quantity;
    if (updateDto.unit !== undefined) updateFields.unit = updateDto.unit;
    if (updateDto.price !== undefined) updateFields.price = updateDto.price;
    if (updateDto.source !== undefined) updateFields.source = updateDto.source;
    if (updateDto.inventoryLocation !== undefined)
      updateFields.inventoryLocation = updateDto.inventoryLocation;
    if (updateDto.invoiceNumber !== undefined)
      updateFields.invoiceNumber = updateDto.invoiceNumber;
    if (updateDto.expectedOn !== undefined)
      updateFields.expectedOn = updateDto.expectedOn;

    const updatedMaterial = await this.rawMaterialModel
      .findByIdAndUpdate(id, { $set: updateFields }, { new: true })
      .exec();

    if (!updatedMaterial) {
      throw new NotFoundException(`Raw Material with ID ${id} not found`);
    }

    return updatedMaterial;
  }

  async receiveRawMaterial(
    id: string,
    dto: ReceiveRawMaterialDto,
  ): Promise<RawMaterial> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const updatedMaterial = await this.rawMaterialModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isReceived: true,
            receivedAt: new Date(),
            status: 'received',
            receivedBy: dto.receivedBy,
            receivedById: dto.receivedById,
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedMaterial) {
      throw new NotFoundException(`Raw Material with ID ${id} not found`);
    }

    await new this.inventoryModel({
      sourceType: 'raw',
      sourceId: updatedMaterial._id,
      materialName: updatedMaterial.materialName,
      quantity: updatedMaterial.quantity,
      originalQuantity: updatedMaterial.quantity,
      unit: updatedMaterial.unit,
      inventoryLocation: updatedMaterial.inventoryLocation,
      receivedAt: updatedMaterial.receivedAt,
      receivedBy: updatedMaterial.receivedBy,
      receivedById: updatedMaterial.receivedById,
      status: 'received',
    }).save();

    return updatedMaterial;
  }

  async createCompanyMaterial(
    dto: CreateCompanyMaterialDto,
  ): Promise<CompanyMaterial> {
    const { companyId, partId } = dto;

    // 1. Validate IDs
    if (!isValidObjectId(companyId)) {
      throw new BadRequestException('Invalid company ID');
    }

    if (!isValidObjectId(partId)) {
      throw new BadRequestException('Invalid part ID');
    }

    // 2. Fetch company
    const company = await this.companyModel.findById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 3. Find part inside company
    const part = company.parts.find((p) => p._id.toString() === partId);

    if (!part) {
      throw new NotFoundException('Part not found in this company');
    }

    // 4. Create material with resolved data
    const createdMaterial = new this.companyMaterialModel({
      ...dto,
      partName: part.partName,
      partNumber: part.partNumber,
      companyName: company.companyName,
    });

    return createdMaterial.save();
  }

  async getCompanyMaterials(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const filter: QueryFilter<CompanyMaterialDocument> = {};
    if (search) {
      filter.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { inventoryLocation: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.companyMaterialModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.companyMaterialModel.countDocuments(filter).exec(),
    ]);
    return buildPaginatedResponse(data, total, page, limit);
  }

  async updateCompanyMaterial(
    id: string,
    updateDto: UpdateCompanyMaterialFullDto,
  ): Promise<CompanyMaterial> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const updateFields: Record<string, unknown> = {};

    if (updateDto.quantity !== undefined)
      updateFields.quantity = updateDto.quantity;
    if (updateDto.unit !== undefined) updateFields.unit = updateDto.unit;
    if (updateDto.expectedOn !== undefined)
      updateFields.expectedOn = updateDto.expectedOn;
    if (updateDto.deliveryBy !== undefined)
      updateFields.deliveryBy = updateDto.deliveryBy;
    if (updateDto.receivedOn !== undefined)
      updateFields.receivedOn = updateDto.receivedOn;
    if (updateDto.inventoryLocation !== undefined)
      updateFields.inventoryLocation = updateDto.inventoryLocation;
    if (updateDto.receivedBy !== undefined)
      updateFields.receivedBy = updateDto.receivedBy;
    if (updateDto.receivedById !== undefined)
      updateFields.receivedById = updateDto.receivedById;

    const updatedMaterial = await this.companyMaterialModel
      .findByIdAndUpdate(id, { $set: updateFields }, { new: true })
      .exec();

    if (!updatedMaterial) {
      throw new NotFoundException(`Company Material with ID ${id} not found`);
    }

    return updatedMaterial;
  }

  async updateCompanyMaterialReceiver(
    id: string,
    updateDto: UpdateCompanyMaterialReceiverDto,
  ): Promise<CompanyMaterial> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const updatedMaterial = await this.companyMaterialModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            receivedBy: updateDto.receivedBy,
            receivedById: updateDto.receivedById,
            status: 'received',
            isReceived: true,
            receivedOn: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedMaterial) {
      throw new NotFoundException(`Company Material with ID ${id} not found`);
    }

    // Create Inventory Item
    await new this.inventoryModel({
      sourceType: 'company',
      sourceId: updatedMaterial._id,
      materialName: `${updatedMaterial.partNumber} - ${updatedMaterial.partName}`,
      partName: updatedMaterial.partName,
      partNumber: updatedMaterial.partNumber,
      companyName: updatedMaterial.companyName,
      quantity: updatedMaterial.quantity,
      originalQuantity: updatedMaterial.quantity,
      unit: updatedMaterial.unit,
      inventoryLocation: updatedMaterial.inventoryLocation,
      receivedAt: updatedMaterial.receivedOn,
      receivedBy: updatedMaterial.receivedBy,
      receivedById: updatedMaterial.receivedById,
      status: 'received',
    }).save();

    return updatedMaterial;
  }

  async getRawMaterialStats() {
    const { start, now } = this.getLast7DaysRange();

    const dailyAgg = await this.rawMaterialModel
      .aggregate([
        {
          $match: {
            receivedAt: { $gte: start, $lte: now },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          },
        },
      ])
      .exec();

    const aggMap = new Map(dailyAgg.map((i) => [i._id, i]));

    const dailyCounts: {
      date: string;
      count: number;
      totalValue: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = aggMap.get(dateStr);

      dailyCounts.push({
        date: dateStr,
        count: found ? found.count : 0,
        totalValue: found ? found.totalValue : 0,
      });
    }

    const totalThisWeek = dailyCounts.reduce((sum, d) => sum + d.count, 0);
    const totalInvestmentThisWeek = dailyCounts.reduce(
      (sum, d) => sum + d.totalValue,
      0,
    );

    const activeSourcesAgg = await this.rawMaterialModel
      .aggregate([
        { $match: { receivedAt: { $gte: start, $lte: now } } },
        { $group: { _id: '$source' } },
        { $count: 'count' },
      ])
      .exec();

    const activeSources =
      activeSourcesAgg.length > 0 ? activeSourcesAgg[0].count : 0;

    return {
      dailyCounts,
      totalThisWeek,
      totalInvestmentThisWeek,
      activeSources,
    };
  }

  async getCompanyMaterialStats() {
    const { start, now } = this.getLast7DaysRange();

    const dailyAgg = await this.companyMaterialModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: now },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ])
      .exec();

    const aggMap = new Map(dailyAgg.map((i) => [i._id, i]));

    const dailyCounts: {
      date: string;
      count: number;
      totalQuantity: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = aggMap.get(dateStr);

      dailyCounts.push({
        date: dateStr,
        count: found ? found.count : 0,
        totalQuantity: found ? found.totalQuantity : 0,
      });
    }

    const totalThisWeek = dailyCounts.reduce((sum, d) => sum + d.count, 0);
    const totalQuantityThisWeek = dailyCounts.reduce(
      (sum, d) => sum + d.totalQuantity,
      0,
    );

    const readyCount = await this.companyMaterialModel
      .countDocuments({ status: 'ready_for_dispatch' })
      .exec();

    return {
      dailyCounts,
      totalThisWeek,
      totalQuantityThisWeek,
      readyCount,
    };
  }

  async deleteCompanyMaterial(id: string): Promise<void> {
    const deletedMaterial = await this.companyMaterialModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedMaterial) {
      throw new NotFoundException(`Company Material with ID ${id} not found`);
    }
  }

  // ── Inventory Methods moved to InventoryService ───────────────────────────────

  async updateMaterialStatus(
    type: string,
    id: string,
    status: string,
  ): Promise<void> {
    if (type === 'company') {
      const updated = await this.companyMaterialModel
        .findByIdAndUpdate(id, { $set: { status } }, { new: true })
        .exec();
      if (!updated) {
        throw new NotFoundException(`Company Material with ID ${id} not found`);
      }
    } else if (type === 'raw') {
      const updated = await this.rawMaterialModel
        .findByIdAndUpdate(id, { $set: { status } }, { new: true })
        .exec();
      if (!updated) {
        throw new NotFoundException(`Raw Material with ID ${id} not found`);
      }
    } else {
      throw new BadRequestException('Invalid material type');
    }
  }

  // ── Dispatch Methods ──────────────────────────────────────────

  async getDispatchItems(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ) {
    // Import production orders model is not available here,
    // so we use company materials with dispatch-related statuses
    const skip = (page - 1) * limit;
    const filter: QueryFilter<CompanyMaterialDocument> = {
      status: {
        $in: ['ready_for_dispatch', 'dispatched'],
      },
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { partName: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.companyMaterialModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.companyMaterialModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getRawMaterialsForExport(filters: {
    search?: string;
    materialName?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const filter: any = {};
    if (filters.search) {
      filter.$or = [
        { materialName: { $regex: filters.search, $options: 'i' } },
        { source: { $regex: filters.search, $options: 'i' } },
        { invoiceNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.materialName) filter.materialName = filters.materialName;
    if (filters.source) filter.source = filters.source;

    if (filters.startDate || filters.endDate) {
      filter.createdAt = {};
      if (filters.startDate)
        filter.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.createdAt.$lte = new Date(filters.endDate);
    }

    return this.rawMaterialModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getCompanyMaterialsForExport(filters: {
    search?: string;
    companyName?: string;
    partName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const filter: any = {};
    if (filters.search) {
      filter.$or = [
        { companyName: { $regex: filters.search, $options: 'i' } },
        { partName: { $regex: filters.search, $options: 'i' } },
        { partNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.companyName) filter.companyName = filters.companyName;
    if (filters.partName) filter.partName = filters.partName;

    if (filters.startDate || filters.endDate) {
      filter.createdAt = {};
      if (filters.startDate)
        filter.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.createdAt.$lte = new Date(filters.endDate);
    }

    return this.companyMaterialModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getRawUniqueList() {
    const materialNames = await this.rawMaterialModel.distinct('materialName');
    const sources = await this.rawMaterialModel.distinct('source');
    return { materialNames, sources };
  }

  async getCompanyUniqueList() {
    const companyNames =
      await this.companyMaterialModel.distinct('companyName');
    const partNames = await this.companyMaterialModel.distinct('partName');
    return { companyNames, partNames };
  }

  async getDispatchStats() {
    const { start, now } = this.getLast7DaysRange();

    const [readyCount, dispatchedCount] = await Promise.all([
      this.companyMaterialModel
        .countDocuments({ status: 'ready_for_dispatch' })
        .exec(),
      this.companyMaterialModel.countDocuments({ status: 'dispatched' }).exec(),
    ]);

    const dailyAgg = await this.companyMaterialModel
      .aggregate([
        {
          $match: {
            status: 'dispatched',
            updatedAt: { $gte: start, $lte: now },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ])
      .exec();

    // Optimize with Map
    const aggMap = new Map(dailyAgg.map((i) => [i._id, i]));

    const dailyCounts: {
      date: string;
      count: number;
      totalQuantity: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = aggMap.get(dateStr);

      dailyCounts.push({
        date: dateStr,
        count: found ? found.count : 0,
        totalQuantity: found ? found.totalQuantity : 0,
      });
    }

    return {
      readyForDispatch: readyCount,
      dispatched: dispatchedCount,
      dailyCounts,
    };
  }

  private getLast7DaysRange() {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { now, start };
  }
}
