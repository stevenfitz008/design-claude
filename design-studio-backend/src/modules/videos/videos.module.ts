import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000, // Increased timeout for video files
      maxRedirects: 3,
    }),
    CacheModule.register({
      ttl: 3600, // 1 hour default TTL
      max: 500, // Maximum number of items in cache (videos are larger than photos)
    }),
    AuthModule,
  ],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}