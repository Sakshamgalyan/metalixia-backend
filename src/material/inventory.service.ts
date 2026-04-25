import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, QueryFilter } from 'mongoose';
import {
  InventoryItem,
  InventoryItemDocument,
} from './entities/inventory-item.schema';
import { SetMinStockDto } from 'src/dto/material/set-min-stock.dto';
import { ConsumeMaterialDto } from 'src/dto/material/consume-material.dto';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name)
    private inventoryModel: Model<InventoryItemDocument>,
  ) {}

  async getInventoryItems(
    page: number,
    limit: number,
    search?: string,
    type?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const filter: QueryFilter<InventoryItemDocument> = {};

    if (search) {
      filter.$or = [
        { materialName: { $regex: search, $options: 'i' } },
        { partName: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    if (type && type !== 'all') {
      filter.sourceType = type;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      this.inventoryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.inventoryModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async setMinStock(id: string, dto: SetMinStockDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const item = await this.inventoryModel
      .findByIdAndUpdate(
        id,
        { $set: { minStock: dto.minStock } },
        { new: true },
      )
      .exec();

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async consumeMaterial(id: string, dto: ConsumeMaterialDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const item = await this.inventoryModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    if (item.sourceType !== 'raw') {
      throw new BadRequestException('Only raw materials can be consumed');
    }

    if (item.quantity < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    item.quantity -= dto.quantity;
    if (item.quantity === 0) {
      item.status = 'consumed';
    }

    return item.save();
  }

  async getInventoryStats() {
    const totalItems = await this.inventoryModel.countDocuments().exec();
    const totalCompany = await this.inventoryModel
      .countDocuments({ sourceType: 'company' })
      .exec();
    const totalRaw = await this.inventoryModel
      .countDocuments({ sourceType: 'raw' })
      .exec();

    const lowStockCount = await this.inventoryModel
      .countDocuments({
        $expr: { $lte: ['$quantity', '$minStock'] },
        quantity: { $gt: 0 },
      })
      .exec();

    const outOfStockCount = await this.inventoryModel
      .countDocuments({ quantity: 0 })
      .exec();

    const statusMap = await this.inventoryModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const formattedStatusMap = statusMap.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return {
      totalItems,
      totalCompany,
      totalRaw,
      lowStockCount,
      outOfStockCount,
      statusMap: formattedStatusMap,
    };
  }

  async getInventoryForExport(filters: {
    search?: string;
    type?: string;
    status?: string;
    materialName?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const filter: any = {};

    if (filters.search) {
      filter.$or = [
        { materialName: { $regex: filters.search, $options: 'i' } },
        { partName: { $regex: filters.search, $options: 'i' } },
        { partNumber: { $regex: filters.search, $options: 'i' } },
        { companyName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.type && filters.type !== 'all') {
      filter.sourceType = filters.type;
    }

    if (filters.status && filters.status !== 'all') {
      filter.status = filters.status;
    }

    if (filters.materialName) filter.materialName = filters.materialName;
    if (filters.companyName) filter.companyName = filters.companyName;

    if (filters.startDate || filters.endDate) {
      filter.createdAt = {};
      if (filters.startDate)
        filter.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.createdAt.$lte = new Date(filters.endDate);
    }

    return this.inventoryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getInventoryUniqueList() {
    const materialNames = await this.inventoryModel.distinct('materialName');
    const companyNames = await this.inventoryModel.distinct('companyName');
    const statuses = await this.inventoryModel.distinct('status');
    return { materialNames, companyNames, statuses };
  }
}
