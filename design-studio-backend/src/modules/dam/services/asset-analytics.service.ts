import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssetAnalytics, AssetAnalyticsType } from '../../../database/mongodb/schemas';

@Injectable()
export class AssetAnalyticsService {
  private readonly logger = new Logger(AssetAnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectModel(AssetAnalytics.name)
    private assetAnalyticsModel: Model<AssetAnalyticsType>,
  ) {}

  async getAssetAnalytics(assetId: string, period: 'hour' | 'day' | 'week' | 'month' = 'day') {
    return this.assetAnalyticsModel.find({ assetId, period }).sort({ timestamp: -1 }).limit(30);
  }

  async recordUsage(assetId: string, userId: string, action: string) {
    // Record usage in PostgreSQL
    await this.prisma.assetUsageLog.create({
      data: { assetId, userId, action: action.toUpperCase() as any, timestamp: new Date() }
    });

    // Aggregate for analytics
    const now = new Date();
    await this.assetAnalyticsModel.updateOne(
      { 
        assetId,
        userId,
        period: 'day',
        timestamp: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
      },
      { 
        $inc: { 'metrics.views': 1 },
        $setOnInsert: { timestamp: now, period: 'day', metrics: { views: 0, downloads: 0, edits: 0, shares: 0, uniqueUsers: 0, totalTimeViewed: 0, averageViewDuration: 0 } }
      },
      { upsert: true }
    );
  }
}