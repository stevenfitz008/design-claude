import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { VideosService } from './videos.service';
import { VideoQueryDto } from './dto/video-query.dto';
import { VideoResponseDto, VideoSearchResponseDto } from './dto/video-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('videos')
@Controller('videos')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for frontend integration testing
// @ApiBearerAuth()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get('search')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute (Pexels has lower limits than Unsplash)
  @ApiOperation({ summary: 'Search videos from Pexels' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Videos search results',
    type: VideoSearchResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid search parameters' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Rate limit exceeded' })
  async searchVideos(@Query() queryDto: VideoQueryDto): Promise<VideoSearchResponseDto> {
    return this.videosService.searchVideos(queryDto);
  }

  @Get('trending')
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  @ApiOperation({ summary: 'Get trending/popular videos from Pexels' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', description: 'Results per page', required: false, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trending videos',
    type: VideoSearchResponseDto,
  })
  async getTrendingVideos(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('per_page', new DefaultValuePipe(20), ParseIntPipe) per_page: number,
  ): Promise<VideoSearchResponseDto> {
    return this.videosService.getTrendingVideos(page, per_page);
  }

  @Get(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Get specific video details' })
  @ApiParam({ name: 'id', description: 'Video ID from Pexels', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Video details',
    type: VideoResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Video not found' })
  async getVideo(@Param('id') id: string): Promise<VideoResponseDto> {
    return this.videosService.getVideoById(id);
  }

  @Get('health/status')
  @ApiOperation({ summary: 'Check videos service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'pexels' }
      }
    }
  })
  async getHealthStatus(): Promise<{ healthy: boolean; timestamp: string; service: string }> {
    const healthy = await this.videosService.isHealthy();
    return {
      healthy,
      timestamp: new Date().toISOString(),
      service: 'pexels'
    };
  }
}