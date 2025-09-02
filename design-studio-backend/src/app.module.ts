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
import { FontsModule } from './modules/fonts/fonts.module';
import { AnimationsModule } from './modules/animations/animations.module';
import { HealthModule } from './common/health/health.module';
import { CacheModule } from './common/cache/cache.module';

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
    FontsModule,
    // AnimationsModule,
  ],
})
export class AppModule {}