import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthService } from './jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from '../database/prisma.module';
import { RedisModule } from '../database/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [AuthService, JwtAuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthService, JwtAuthGuard]
})
export class AuthModule {}