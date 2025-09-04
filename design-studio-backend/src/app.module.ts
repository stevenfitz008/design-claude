import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { PhotosModule } from './modules/photos/photos.module';
import { VideosModule } from './modules/videos/videos.module';
import { FontsModule } from './modules/fonts/fonts.module';
import { AnimationsModule } from './modules/animations/animations.module';
import { HealthModule } from './common/health/health.module';
import { CacheModule } from './common/cache/cache.module';
import { DAMModule } from './modules/dam/dam.module';
import { DesignSystemModule } from './modules/design-system/design-system.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PagesModule } from './modules/pages/pages.module';
import { ComponentsModule } from './modules/components/components.module';
import { RenderingModule } from './modules/rendering/rendering.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 3,
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: 20,
          },
          {
            name: 'long',
            ttl: 60000,
            limit: 100,
          },
        ],
      }),
    }),

    // Core modules
    DatabaseModule,
    // CacheModule,
    // HealthModule,

    // Feature modules
    AuthModule,
    // UsersModule,
    ProjectsModule,
    // UploadsModule,
    TemplatesModule,
    PhotosModule,
    VideosModule,
    FontsModule,
    // AnimationsModule, // Temporarily disabled due to type issues
    
    // Advanced modules
    // DAMModule, // Temporarily disabled due to dependency issue
    // DesignSystemModule, // Temporarily disabled due to compilation error
    
    // Report system modules
    ReportsModule,
    PagesModule,
    ComponentsModule,
    // RenderingModule, // Temporarily disabled due to Bull dependency
  ],
})
export class AppModule {}