import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthService } from './jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from '../database/prisma.module';
import { RedisModule } from '../database/redis.module';

@Module({
  imports: [
    PrismaModule, 
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') 
        },
      }),
    }),
  ],
  providers: [AuthService, JwtAuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthService, JwtAuthGuard]
})
export class AuthModule {}