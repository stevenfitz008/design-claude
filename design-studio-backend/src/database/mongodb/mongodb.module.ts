import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CanvasDocument,
  CanvasDocumentSchema,
  CanvasVersion,
  CanvasVersionSchema,
  TemplateCanvas,
  TemplateCanvasSchema,
  CollaborationSession,
  CollaborationSessionSchema,
  CollaborationOperation,
  CollaborationOperationSchema,
  ExportCache,
  ExportCacheSchema,
} from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CanvasDocument.name, schema: CanvasDocumentSchema },
      { name: CanvasVersion.name, schema: CanvasVersionSchema },
      { name: TemplateCanvas.name, schema: TemplateCanvasSchema },
      { name: CollaborationSession.name, schema: CollaborationSessionSchema },
      { name: CollaborationOperation.name, schema: CollaborationOperationSchema },
      { name: ExportCache.name, schema: ExportCacheSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoDbModule {}