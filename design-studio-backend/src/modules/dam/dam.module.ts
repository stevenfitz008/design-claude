import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

// DAM Services
import { AssetMetadataService } from './services/asset-metadata.service';
import { AssetProcessingService } from './services/asset-processing.service';
import { AssetSearchService } from './services/asset-search.service';
import { AssetAnalyticsService } from './services/asset-analytics.service';
import { AssetVersionService } from './services/asset-version.service';
import { AssetCollectionService } from './services/asset-collection.service';
import { AssetTransformationService } from './services/asset-transformation.service';

// DAM Controllers
import { AssetMetadataController } from './controllers/asset-metadata.controller';
import { AssetSearchController } from './controllers/asset-search.controller';
import { AssetAnalyticsController } from './controllers/asset-analytics.controller';
import { AssetCollectionController } from './controllers/asset-collection.controller';
import { AssetProcessingController } from './controllers/asset-processing.controller';

// MongoDB Schemas
import {
  AssetProcessingJob,
  AssetProcessingJobSchema,
  AssetSearchIndex,
  AssetSearchIndexSchema,
  AssetAnalytics,
  AssetAnalyticsSchema,
  AssetTransformation,
  AssetTransformationSchema,
} from '../../database/mongodb/schemas';

// Existing modules
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: AssetProcessingJob.name, schema: AssetProcessingJobSchema },
      { name: AssetSearchIndex.name, schema: AssetSearchIndexSchema },
      { name: AssetAnalytics.name, schema: AssetAnalyticsSchema },
      { name: AssetTransformation.name, schema: AssetTransformationSchema },
    ]),
  ],
  controllers: [
    AssetMetadataController,
    AssetSearchController,
    AssetAnalyticsController,
    AssetCollectionController,
    AssetProcessingController,
  ],
  providers: [
    AssetMetadataService,
    AssetProcessingService,
    AssetSearchService,
    AssetAnalyticsService,
    AssetVersionService,
    AssetCollectionService,
    AssetTransformationService,
  ],
  exports: [
    AssetMetadataService,
    AssetProcessingService,
    AssetSearchService,
    AssetAnalyticsService,
    AssetVersionService,
    AssetCollectionService,
    AssetTransformationService,
  ],
})
export class DAMModule {}