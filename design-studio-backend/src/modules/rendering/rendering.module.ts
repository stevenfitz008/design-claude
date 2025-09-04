import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../database/prisma.module';
// import { RenderingController } from './rendering.controller';
// import { RenderingService } from './rendering.service';
// import { RenderingProcessor } from './processors/rendering.processor';
import { HtmlRenderingService } from './services/html-rendering.service';
// import { PdfRenderingService } from './services/pdf-rendering.service';
// import { PptxRenderingService } from './services/pptx-rendering.service';
// import { SvgRenderingService } from './services/svg-rendering.service';
import { 
  ReportRenderingCache,
  ReportRenderingCacheSchema,
  ReportPageDefinition,
  ReportPageDefinitionSchema,
  ComponentDefinitionDocument,
  ComponentDefinitionDocumentSchema,
} from '../../database/mongodb/schemas';

@Module({
  imports: [
    PrismaModule,
    MongooseModule.forFeature([
      { name: ReportRenderingCache.name, schema: ReportRenderingCacheSchema },
      { name: ReportPageDefinition.name, schema: ReportPageDefinitionSchema },
      { name: ComponentDefinitionDocument.name, schema: ComponentDefinitionDocumentSchema },
    ]),
    BullModule.registerQueue({
      name: 'rendering',
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
  ],
  controllers: [
    // RenderingController
  ],
  providers: [
    // RenderingService,
    // RenderingProcessor,
    HtmlRenderingService,
    // PdfRenderingService,
    // PptxRenderingService,
    // SvgRenderingService,
  ],
  exports: [
    // RenderingService
  ],
})
export class RenderingModule {}