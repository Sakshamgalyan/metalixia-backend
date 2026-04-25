import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductionOrder,
  ProductionOrderDocument,
  ELECTROPLATING_PROCESSES,
} from './entities/production-order.schema';
import { CreateProductionOrderDto } from 'src/dto/production/create-production-order.dto';
import {
  UpdateProductionStatusDto,
  AdvanceProcessDto,
} from 'src/dto/production/update-production-status.dto';
import { buildPaginatedResponse } from 'src/common/utils/pagination.util';

@Injectable()
export class ProductionService {
  constructor(
    @InjectModel(ProductionOrder.name)
    private productionOrderModel: Model<ProductionOrderDocument>,
  ) {}

  private generateBatchId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BATCH-${year}-${random}`;
  }

  async createProductionOrder(
    dto: CreateProductionOrderDto,
  ): Promise<ProductionOrder> {
    const processes = ELECTROPLATING_PROCESSES.map((name) => ({
      name,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      notes: '',
    }));

    const order = new this.productionOrderModel({
      ...dto,
      batchId: this.generateBatchId(),
      processes,
      currentProcess: 0,
      status: 'queued',
      lineNumber: dto.lineNumber || 1,
      priority: dto.priority || 'normal',
      rejectionCount: 0,
    });

    return order.save();
  }

  async getProductionOrders(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { batchId: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { partName: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      this.productionOrderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productionOrderModel.countDocuments(filter).exec(),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getProductionStats() {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Count per status
    const statusCounts = await this.productionOrderModel
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .exec();

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    // Completed today
    const completedToday = await this.productionOrderModel
      .countDocuments({
        status: { $in: ['passed', 'ready_for_dispatch', 'dispatched'] },
        completedAt: { $gte: todayStart },
      })
      .exec();

    // Rejection rate
    const totalOrders = await this.productionOrderModel.countDocuments().exec();
    const rejectedOrders = await this.productionOrderModel
      .countDocuments({ rejectionCount: { $gt: 0 } })
      .exec();
    const rejectionRate =
      totalOrders > 0 ? Math.round((rejectedOrders / totalOrders) * 100) : 0;

    // Active lines
    const activeLines = await this.productionOrderModel
      .distinct('lineNumber', { status: 'in_production' })
      .exec();

    // Daily throughput for last 7 days
    const dailyThroughput = await this.productionOrderModel
      .aggregate([
        {
          $match: {
            completedAt: { $gte: sevenDaysAgo, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    const dailyCounts: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = dailyThroughput.find((item: any) => item._id === dateStr);
      dailyCounts.push({
        date: dateStr,
        count: found ? found.count : 0,
      });
    }

    // Process breakdown (how many batches at each process)
    const processBreakdown = await this.productionOrderModel
      .aggregate([
        { $match: { status: 'in_production' } },
        { $group: { _id: '$currentProcess', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .exec();

    const processCounts = ELECTROPLATING_PROCESSES.map((name, index) => {
      const found = processBreakdown.find((p: any) => p._id === index);
      return { name, index, count: found ? found.count : 0 };
    });

    return {
      statusMap,
      inProduction: statusMap['in_production'] || 0,
      queued: statusMap['queued'] || 0,
      qualityCheck: statusMap['quality_check'] || 0,
      readyForDispatch: statusMap['ready_for_dispatch'] || 0,
      completedToday,
      rejectionRate,
      activeLines: activeLines.length,
      dailyCounts,
      processCounts,
    };
  }

  async getPipelineView() {
    const orders = await this.productionOrderModel
      .find({ status: { $in: ['queued', 'in_production'] } })
      .sort({ priority: -1, createdAt: 1 })
      .exec();

    return orders;
  }

  async advanceProcess(id: string, dto: AdvanceProcessDto) {
    const order = await this.productionOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Production order ${id} not found`);
    }

    if (order.status !== 'in_production') {
      throw new BadRequestException(
        'Can only advance processes for orders in production',
      );
    }

    const currentIdx = order.currentProcess;
    const processes = order.processes;

    if (currentIdx >= processes.length) {
      throw new BadRequestException('All processes already completed');
    }

    // Complete current process
    processes[currentIdx].status = 'completed';
    processes[currentIdx].completedAt = new Date();
    if (dto.notes) {
      processes[currentIdx].notes = dto.notes;
    }

    const nextIdx = currentIdx + 1;

    if (nextIdx < processes.length) {
      // Start next process
      processes[nextIdx].status = 'in_progress';
      processes[nextIdx].startedAt = new Date();
      order.currentProcess = nextIdx;
    } else {
      // All processes complete, send to quality check
      order.status = 'quality_check';
      order.completedAt = new Date();
    }

    order.processes = processes;
    return order.save();
  }

  async updateStatus(id: string, dto: UpdateProductionStatusDto) {
    const order = await this.productionOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Production order ${id} not found`);
    }

    // Handle special transitions
    if (dto.status === 'in_production' && order.status === 'queued') {
      order.startedAt = new Date();
      order.processes[0].status = 'in_progress';
      order.processes[0].startedAt = new Date();
    }

    if (dto.status === 'rejected') {
      order.rejectionCount += 1;
      // Reset processes for re-processing
      order.processes = order.processes.map((p) => ({
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
      return order.save();
    }

    order.status = dto.status;
    return order.save();
  }

  async seedMockData() {
    // Clear existing
    await this.productionOrderModel.deleteMany({}).exec();

    const companies = [
      {
        name: 'Tata Motors',
        parts: [
          { name: 'Brake Rotor', number: 'TM-BR-001' },
          { name: 'Suspension Bolt', number: 'TM-SB-044' },
        ],
      },
      {
        name: 'Mahindra Auto',
        parts: [
          { name: 'Door Handle', number: 'MA-DH-012' },
          { name: 'Hood Latch', number: 'MA-HL-007' },
        ],
      },
      {
        name: 'Bajaj Auto',
        parts: [
          { name: 'Chain Sprocket', number: 'BA-CS-033' },
          { name: 'Exhaust Clamp', number: 'BA-EC-021' },
        ],
      },
      {
        name: 'Hero MotoCorp',
        parts: [
          { name: 'Wheel Rim', number: 'HM-WR-056' },
          { name: 'Kick Lever', number: 'HM-KL-009' },
        ],
      },
    ];

    const statuses = [
      'queued',
      'in_production',
      'in_production',
      'in_production',
      'quality_check',
      'passed',
      'ready_for_dispatch',
      'dispatched',
    ];
    const priorities = ['low', 'normal', 'normal', 'high', 'urgent'];

    const orders: any[] = [];
    const now = new Date();

    for (let i = 0; i < 25; i++) {
      const company = companies[i % companies.length];
      const part = company.parts[i % company.parts.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];

      const processes = ELECTROPLATING_PROCESSES.map((name, idx) => {
        let procStatus = 'pending';
        let startedAt: Date | null = null;
        let completedAt: Date | null = null;

        if (status === 'in_production') {
          const currentProc = Math.floor(Math.random() * 12);
          if (idx < currentProc) {
            procStatus = 'completed';
            startedAt = new Date(now.getTime() - (12 - idx) * 3600000);
            completedAt = new Date(now.getTime() - (11 - idx) * 3600000);
          } else if (idx === currentProc) {
            procStatus = 'in_progress';
            startedAt = new Date(now.getTime() - 1800000);
          }
        } else if (
          [
            'quality_check',
            'passed',
            'ready_for_dispatch',
            'dispatched',
          ].includes(status)
        ) {
          procStatus = 'completed';
          startedAt = new Date(now.getTime() - (24 - idx) * 3600000);
          completedAt = new Date(now.getTime() - (23 - idx) * 3600000);
        }

        return { name, status: procStatus, startedAt, completedAt, notes: '' };
      });

      let currentProcess = 0;
      if (status === 'in_production') {
        currentProcess = processes.findIndex((p) => p.status === 'in_progress');
        if (currentProcess === -1) currentProcess = 0;
      } else if (status !== 'queued') {
        currentProcess = 11;
      }

      const createdAt = new Date(now.getTime() - (25 - i) * 86400000 * 0.5);

      orders.push({
        batchId: `BATCH-2026-${String(1000 + i).padStart(4, '0')}`,
        companyName: company.name,
        partName: part.name,
        partNumber: part.number,
        quantity: Math.floor(100 + Math.random() * 900),
        unit: 'pcs',
        processes,
        currentProcess,
        lineNumber: (i % 3) + 1,
        status,
        priority,
        rejectionCount: status === 'rejected' ? 1 : Math.random() > 0.8 ? 1 : 0,
        startedAt:
          status !== 'queued' ? new Date(createdAt.getTime() + 3600000) : null,
        completedAt: ['passed', 'ready_for_dispatch', 'dispatched'].includes(
          status,
        )
          ? new Date(createdAt.getTime() + 86400000)
          : null,
        createdAt,
        updatedAt: now,
      });
    }

    await this.productionOrderModel.insertMany(orders);
    return { message: `Seeded ${orders.length} production orders` };
  }
}
