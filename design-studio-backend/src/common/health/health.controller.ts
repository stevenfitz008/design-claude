import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../database/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private prismaService: PrismaService,
    private mongooseHealthIndicator: MongooseHealthIndicator,
    private memoryHealthIndicator: MemoryHealthIndicator,
    private diskHealthIndicator: DiskHealthIndicator,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      // Database connections
      () => this.checkPrismaHealth(),
      () => this.mongooseHealthIndicator.pingCheck('mongodb'),
      () => this.checkRedisHealth(),
      
      // System resources
      () => this.memoryHealthIndicator.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memoryHealthIndicator.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.diskHealthIndicator.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.9 
      }),
    ]);
  }

  private async checkPrismaHealth(): Promise<any> {
    const isHealthy = await this.prismaService.isHealthy();
    if (!isHealthy) {
      throw new Error('PostgreSQL connection failed');
    }
    return {
      postgres: {
        status: 'up',
        message: 'PostgreSQL is healthy',
      },
    };
  }

  private async checkRedisHealth(): Promise<any> {
    try {
      await this.cacheManager.set('health_check', 'ok', 1000);
      const value = await this.cacheManager.get('health_check');
      if (value !== 'ok') {
        throw new Error('Redis health check failed');
      }
      return {
        redis: {
          status: 'up',
          message: 'Redis is healthy',
        },
      };
    } catch (error) {
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for K8s' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  readiness() {
    return {
      status: 'ok',
      message: 'Design Studio Backend is ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for K8s' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return {
      status: 'ok',
      message: 'Design Studio Backend is alive',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}