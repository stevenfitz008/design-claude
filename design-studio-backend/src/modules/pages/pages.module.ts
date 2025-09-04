import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { 
  ReportPageDefinition, 
  ReportPageDefinitionSchema,
  ComponentDefinitionDocument,
  ComponentDefinitionDocumentSchema,
} from '../../database/mongodb/schemas';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: ReportPageDefinition.name, schema: ReportPageDefinitionSchema },
      { name: ComponentDefinitionDocument.name, schema: ComponentDefinitionDocumentSchema },
    ]),
  ],
  controllers: [PagesController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}