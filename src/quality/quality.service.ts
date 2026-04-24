import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  QualityCheck,
  QualityCheckDocument,
} from './entities/quality-check.schema';
import {
  ProductionOrder,
  ProductionOrderDocument,
} from 'src/production/entities/production-order.schema';
import { CreateQualityCheckDto } from 'src/dto/quality/create-quality-check.dto';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';

@Injectable()
export class QualityService {
  constructor(
    @InjectModel(QualityCheck.name)
    private qualityCheckModel: Model<QualityCheckDocument>,
    @InjectModel(ProductionOrder.name)
    private productionOrderModel: Model<ProductionOrderDocument>,
  ) {}

  async getQualityChecks(page: number, limit: number, search?: string, result?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { batchId: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { partName: { $regex: search, $options: 'i' } },
      ];
    }

    if (result && result !== 'all') {
      filter.result = result;
    }

    const [data, total] = await Promise.all([
      this.qualityCheckModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.qualityCheckModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getQualityStats() {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Pending inspections
    const pendingCount = await this.productionOrderModel
      .countDocuments({ status: 'quality_check' })
      .exec();

    // Today's results
    const todayResults = await this.qualityCheckModel
      .aggregate([
        { $match: { inspectedAt: { $gte: todayStart } } },
        { $group: { _id: '$result', count: { $sum: 1 } } },
      ])
      .exec();

    const passedToday = todayResults.find((r: any) => r._id === 'passed')?.count || 0;
    const failedToday = todayResults.find((r: any) => r._id === 'failed')?.count || 0;

    // Overall pass rate
    const totalChecks = await this.qualityCheckModel
      .countDocuments({ result: { $ne: 'pending' } })
      .exec();
    const totalPassed = await this.qualityCheckModel
      .countDocuments({ result: 'passed' })
      .exec();
    const passRate = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;

    // Daily trend
    const dailyAgg = await this.qualityCheckModel
      .aggregate([
        { $match: { inspectedAt: { $gte: sevenDaysAgo, $lte: now } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$inspectedAt' } },
              result: '$result',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ])
      .exec();

    const dailyCounts: { date: string; passed: number; failed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const passedDay = dailyAgg.find(
        (a: any) => a._id.date === dateStr && a._id.result === 'passed',
      );
      const failedDay = dailyAgg.find(
        (a: any) => a._id.date === dateStr && a._id.result === 'failed',
      );
      dailyCounts.push({
        date: dateStr,
        passed: passedDay ? passedDay.count : 0,
        failed: failedDay ? failedDay.count : 0,
      });
    }

    // Defect type breakdown
    const defectBreakdown = await this.qualityCheckModel
      .aggregate([
        { $match: { result: 'failed', defectType: { $ne: null } } },
        { $group: { _id: '$defectType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ])
      .exec();

    return {
      pendingCount,
      passedToday,
      failedToday,
      passRate,
      dailyCounts,
      defectBreakdown: defectBreakdown.map((d: any) => ({
        type: d._id,
        count: d.count,
      })),
    };
  }

  async getPendingInspections() {
    const orders = await this.productionOrderModel
      .find({ status: 'quality_check' })
      .sort({ completedAt: 1 })
      .exec();
    return orders;
  }

  async inspectOrder(productionOrderId: string, dto: CreateQualityCheckDto) {
    const order = await this.productionOrderModel
      .findById(productionOrderId)
      .exec();

    if (!order) {
      throw new NotFoundException(
        `Production order ${productionOrderId} not found`,
      );
    }

    // Create quality check record
    const qualityCheck = new this.qualityCheckModel({
      productionOrderId,
      batchId: order.batchId,
      companyName: order.companyName,
      partName: order.partName,
      partNumber: order.partNumber,
      quantity: order.quantity,
      inspectedBy: dto.inspectedBy,
      inspectedById: dto.inspectedById,
      result: dto.result,
      defectType: dto.defectType || null,
      defectDescription: dto.defectDescription || null,
      parameters: dto.parameters || [],
      rejectionReason: dto.rejectionReason || null,
      inspectedAt: new Date(),
    });

    await qualityCheck.save();

    // Update production order status
    if (dto.result === 'passed') {
      order.status = 'ready_for_dispatch';
      await order.save();
    } else if (dto.result === 'failed') {
      // Send back to production
      order.rejectionCount += 1;
      order.processes = order.processes.map((p: any) => ({
        ...p,
        status: 'pending',
        startedAt: null,
        completedAt: null,
      }));
      order.currentProcess = 0;
      order.completedAt = null;
      order.status = 'in_production';
      order.startedAt = new Date();
      order.processes[0].status = 'in_progress';
      order.processes[0].startedAt = new Date();
      await order.save();
    }

    return qualityCheck;
  }

  async seedMockData() {
    await this.qualityCheckModel.deleteMany({}).exec();

    const orders = await this.productionOrderModel
      .find({
        status: { $in: ['passed', 'ready_for_dispatch', 'dispatched'] },
      })
      .exec();

    const defectTypes = [
      'Surface Roughness',
      'Coating Thickness',
      'Adhesion Failure',
      'Discoloration',
      'Blister Formation',
      'Pitting',
    ];

    const checks: any[] = [];
    const now = new Date();

    for (const order of orders) {
      checks.push({
        productionOrderId: (order as any)._id.toString(),
        batchId: order.batchId,
        companyName: order.companyName,
        partName: order.partName,
        partNumber: order.partNumber,
        quantity: order.quantity,
        inspectedBy: 'Quality Inspector',
        inspectedById: 'qi-001',
        result: 'passed',
        parameters: [
          { name: 'Coating Thickness', expected: '8-12 µm', actual: '10 µm', passed: true },
          { name: 'Adhesion Test', expected: 'Grade 0-1', actual: 'Grade 0', passed: true },
          { name: 'Salt Spray Test', expected: '72+ hrs', actual: '96 hrs', passed: true },
        ],
        inspectedAt: new Date(now.getTime() - Math.random() * 604800000),
        createdAt: new Date(now.getTime() - Math.random() * 604800000),
        updatedAt: now,
      });
    }

    // Add some failed checks
    for (let i = 0; i < 8; i++) {
      const defect = defectTypes[i % defectTypes.length];
      checks.push({
        productionOrderId: 'mock-failed-' + i,
        batchId: `BATCH-2026-${2000 + i}`,
        companyName: ['Tata Motors', 'Mahindra Auto', 'Bajaj Auto'][i % 3],
        partName: ['Brake Disc', 'Frame Bolt', 'Chain Link'][i % 3],
        partNumber: `FL-${1000 + i}`,
        quantity: Math.floor(50 + Math.random() * 200),
        inspectedBy: 'Quality Inspector',
        inspectedById: 'qi-002',
        result: 'failed',
        defectType: defect,
        defectDescription: `Failed due to ${defect.toLowerCase()} issues`,
        rejectionReason: `${defect} not within acceptable limits`,
        parameters: [
          { name: 'Coating Thickness', expected: '8-12 µm', actual: '5 µm', passed: false },
          { name: 'Adhesion Test', expected: 'Grade 0-1', actual: 'Grade 3', passed: false },
        ],
        inspectedAt: new Date(now.getTime() - Math.random() * 604800000),
        createdAt: new Date(now.getTime() - Math.random() * 604800000),
        updatedAt: now,
      });
    }

    await this.qualityCheckModel.insertMany(checks);
    return { message: `Seeded ${checks.length} quality checks` };
  }
}
