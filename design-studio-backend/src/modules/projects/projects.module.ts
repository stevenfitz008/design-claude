import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
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
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {}