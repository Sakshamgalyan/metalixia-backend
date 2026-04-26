import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventsGateway } from '../socket/events.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RawMaterial,
  RawMaterialDocument,
} from '../material/entities/raw-material.schema';
import {
  InventoryItem,
  InventoryItemDocument,
} from '../material/entities/inventory-item.schema';
import {
  ProductionOrder,
  ProductionOrderDocument,
} from '../production/entities/production-order.schema';
import {
  QualityCheck,
  QualityCheckDocument,
} from '../quality/entities/quality-check.schema';

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly eventsGateway: EventsGateway,
    @InjectModel(RawMaterial.name)
    private rawMaterialModel: Model<RawMaterialDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryModel: Model<InventoryItemDocument>,
    @InjectModel(ProductionOrder.name)
    private productionModel: Model<ProductionOrderDocument>,
    @InjectModel(QualityCheck.name)
    private qualityModel: Model<QualityCheckDocument>,
  ) {}

  onModuleInit() {
    this.startSimulation();
  }

  private startSimulation() {
    this.logger.log('Starting monitoring data push...');

    setInterval(async () => {
      try {
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

        const [
          totalRawMaterial,
          totalInventory,
          activeProduction,
          qualityStats,
          latestLogs,
          throughputData,
          inventoryDistribution,
        ] = await Promise.all([
          this.rawMaterialModel.countDocuments({ isReceived: true }),
          this.inventoryModel.countDocuments({ status: 'received' }),
          this.productionModel.countDocuments({ status: { $ne: 'completed' } }),
          this.qualityModel.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                passed: {
                  $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] },
                },
              },
            },
          ]),
          this.inventoryModel.find().sort({ updatedAt: -1 }).limit(8).exec(),
          // Aggregate throughput (orders per hour for last 12 hours)
          this.productionModel.aggregate([
            { $match: { createdAt: { $gte: twelveHoursAgo } } },
            {
              $group: {
                _id: { $hour: '$createdAt' },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),
          // Aggregate status distribution for "vitals"
          this.inventoryModel.aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ]),
        ]);

        const passRate =
          qualityStats.length > 0
            ? Math.round((qualityStats[0].passed / qualityStats[0].total) * 100)
            : 100;

        // Fill traffic with real throughput or 0s
        const traffic = Array.from({ length: 12 }, (_, i) => {
          const hour = new Date(
            now.getTime() - (11 - i) * 60 * 60 * 1000,
          ).getHours();
          const found = throughputData.find((d) => d._id === hour);
          return found ? found.count * 10 : 0; // scaled for visibility
        });

        // Use inventory distribution for "Vitals"
        const getStatusCount = (status: string) => {
          const found = inventoryDistribution.find((d) => d._id === status);
          return found ? found.count : 0;
        };

        const totalItems = totalInventory + activeProduction;
        const calcPercent = (count: number) =>
          totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;

        const data = {
          stats: {
            production: `${totalRawMaterial} Units`,
            activeLines: `${activeProduction} Orders`,
            efficiency: `${passRate}%`,
            powerLoad: `${totalInventory} In Stock`,
          },
          traffic: traffic,
          tankLevels: {
            zinc: calcPercent(getStatusCount('received')),
            nickel: calcPercent(activeProduction),
            acid: calcPercent(getStatusCount('dispatched')),
          },
          log:
            latestLogs.length > 0
              ? {
                  id: latestLogs[0]._id.toString(),
                  timestamp: new Date((latestLogs[0] as any).updatedAt)
                    .toISOString()
                    .replace('T', ' ')
                    .split('.')[0],
                  level: 'INFO',
                  source: 'Inventory',
                  message: `Material ${latestLogs[0].materialName} is now ${latestLogs[0].status}`,
                }
              : {
                  id: Date.now().toString(),
                  timestamp: new Date()
                    .toISOString()
                    .replace('T', ' ')
                    .split('.')[0],
                  level: 'INFO',
                  source: 'System',
                  message: 'Monitoring service active.',
                },
        };

        this.eventsGateway.broadcast('monitoring_metrics', data);
      } catch (error) {
        this.logger.error('Error in monitoring push:', error);
      }
    }, 5000);
  }
}
