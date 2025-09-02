import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ImageExportService } from './services/image-export.service';
import { VideoExportService } from './services/video-export.service';
import { DocumentExportService } from './services/document-export.service';
import { ExportProcessor } from './processors/export.processor';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'export',
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [ExportController],
  providers: [
    ExportService,
    ImageExportService,
    VideoExportService,
    DocumentExportService,
    ExportProcessor,
  ],
  exports: [ExportService],
})
export class ExportModule {}