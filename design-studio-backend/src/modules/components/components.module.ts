import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { ComponentsController } from './components.controller';
import { ComponentsService } from './components.service';
import { 
  ComponentDefinitionDocument,
  ComponentDefinitionDocumentSchema,
} from '../../database/mongodb/schemas';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: ComponentDefinitionDocument.name, schema: ComponentDefinitionDocumentSchema },
    ]),
  ],
  controllers: [ComponentsController],
  providers: [ComponentsService],
  exports: [ComponentsService],
})
export class ComponentsModule {}