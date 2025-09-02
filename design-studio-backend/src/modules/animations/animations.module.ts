import { Module } from '@nestjs/common';
import { AnimationsController } from './animations.controller';
import { AnimationsService } from './animations.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AnimationsController],
  providers: [AnimationsService],
  exports: [AnimationsService],
})
export class AnimationsModule {}