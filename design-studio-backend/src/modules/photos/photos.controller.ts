import {
  Controller,
  Get,
  Post,
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
import { PhotosService } from './photos.service';
import { PhotoQueryDto } from './dto/photo-query.dto';
import { PhotoResponseDto, PhotoSearchResponseDto } from './dto/photo-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('photos')
@Controller('photos')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for frontend integration testing
// @ApiBearerAuth()
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get('search')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Search photos from Unsplash' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Photos search results',
    type: PhotoSearchResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid search parameters' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Rate limit exceeded' })
  async searchPhotos(@Query() queryDto: PhotoQueryDto): Promise<PhotoSearchResponseDto> {
    return this.photosService.searchPhotos(queryDto);
  }

  @Get('trending')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Get trending/popular photos from Unsplash' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', description: 'Results per page', required: false, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trending photos',
    type: PhotoSearchResponseDto,
  })
  async getTrendingPhotos(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('per_page', new DefaultValuePipe(20), ParseIntPipe) per_page: number,
  ): Promise<PhotoSearchResponseDto> {
    return this.photosService.getTrendingPhotos(page, per_page);
  }

  @Get('collections')
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  @ApiOperation({ summary: 'Get photo collections from Unsplash' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', description: 'Results per page', required: false, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Photo collections',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          total_photos: { type: 'number' },
          cover_photo: { $ref: '#/components/schemas/PhotoResponseDto' },
          user: { type: 'object' }
        }
      }
    }
  })
  async getCollections(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('per_page', new DefaultValuePipe(20), ParseIntPipe) per_page: number,
  ): Promise<any> {
    return this.photosService.getCollections(page, per_page);
  }

  @Get(':id')
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute
  @ApiOperation({ summary: 'Get specific photo details' })
  @ApiParam({ name: 'id', description: 'Photo ID from Unsplash', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Photo details',
    type: PhotoResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Photo not found' })
  async getPhoto(@Param('id') id: string): Promise<PhotoResponseDto> {
    return this.photosService.getPhotoById(id);
  }

  @Post(':id/download')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 downloads per minute
  @ApiOperation({ summary: 'Track photo download and get download URL' })
  @ApiParam({ name: 'id', description: 'Photo ID from Unsplash', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Download URL with tracking',
    schema: {
      type: 'object',
      properties: {
        download_url: { type: 'string', description: 'Tracked download URL' }
      }
    }
  })
  async trackDownload(@Param('id') id: string): Promise<{ download_url: string }> {
    return this.photosService.trackDownload(id);
  }

  @Get('health/status')
  @ApiOperation({ summary: 'Check photos service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getHealthStatus(): Promise<{ healthy: boolean; timestamp: string }> {
    const healthy = await this.photosService.isHealthy();
    return {
      healthy,
      timestamp: new Date().toISOString()
    };
  }
}