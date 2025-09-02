import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { CanvasDocument, CanvasDocumentSchema } from '../../database/mongodb/schemas';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: CanvasDocument.name, schema: CanvasDocumentSchema }
    ])
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}