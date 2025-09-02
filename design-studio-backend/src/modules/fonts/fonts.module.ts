import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { FontsController } from './fonts.controller';
import { FontsService } from './fonts.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
    CacheModule.register({
      ttl: 86400, // 24 hours default TTL
      max: 5000, // Maximum number of items in cache
    }),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [FontsController],
  providers: [FontsService],
  exports: [FontsService],
})
export class FontsModule {}