import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssetTransformation, AssetTransformationType } from '../../../database/mongodb/schemas';

@Injectable()
export class AssetTransformationService {
  private readonly logger = new Logger(AssetTransformationService.name);

  constructor(
    private prisma: PrismaService,
    @InjectModel(AssetTransformation.name)
    private transformationModel: Model<AssetTransformationType>,
  ) {}

  async recordTransformation(data: {
    assetId: string;
    userId: string;
    transformationType: string;
    parameters: any;
    originalStorageKey: string;
    transformedStorageKey: string;
    processingMetrics: any;
  }) {
    return this.transformationModel.create(data);
  }

  async getTransformationHistory(assetId: string) {
    return this.transformationModel.find({ assetId }).sort({ createdAt: -1 });
  }
}