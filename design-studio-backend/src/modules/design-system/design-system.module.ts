import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Design System Services
import { ComponentService } from './services/component.service';
import { ReportService } from './services/report.service';
import { RenderingService } from './services/rendering.service';
import { VersionControlService } from './services/version-control.service';
import { DependencyService } from './services/dependency.service';
import { ThemeService } from './services/theme.service';

// Design System Controllers
import { ComponentController } from './controllers/component.controller';
import { ReportController } from './controllers/report.controller';
import { RenderingController } from './controllers/rendering.controller';
import { ThemeController } from './controllers/theme.controller';

// MongoDB Schemas
import {
  ComponentDefinitionDocument,
  ComponentDefinitionDocumentSchema,
  ReportPageDefinition,
  ReportPageDefinitionSchema,
  ReportRenderingCache,
  ReportRenderingCacheSchema,
} from '../../database/mongodb/schemas';

// Existing modules
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    MongooseModule.forFeature([
      { name: ComponentDefinitionDocument.name, schema: ComponentDefinitionDocumentSchema },
      { name: ReportPageDefinition.name, schema: ReportPageDefinitionSchema },
      { name: ReportRenderingCache.name, schema: ReportRenderingCacheSchema },
    ]),
  ],
  controllers: [
    ComponentController,
    ReportController,
    RenderingController,
    ThemeController,
  ],
  providers: [
    ComponentService,
    ReportService,
    RenderingService,
    VersionControlService,
    DependencyService,
    ThemeService,
  ],
  exports: [
    ComponentService,
    ReportService,
    RenderingService,
    VersionControlService,
    DependencyService,
    ThemeService,
  ],
})
export class DesignSystemModule {}