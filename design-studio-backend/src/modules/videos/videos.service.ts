import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { VideoQueryDto } from './dto/video-query.dto';
import { VideoResponseDto, VideoSearchResponseDto, VideoFileDto, VideoUserDto } from './dto/video-response.dto';

@Injectable()
export class VideosService {
  private readonly pexelsApiUrl = 'https://api.pexels.com/videos';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKey = this.configService.get<string>('PEXELS_API_KEY');
    if (!this.apiKey) {
      throw new Error('PEXELS_API_KEY is required but not configured');
    }
  }

  async searchVideos(queryDto: VideoQueryDto): Promise<VideoSearchResponseDto> {
    const { query, per_page = 20, page = 1, orientation, size, category, min_duration, max_duration } = queryDto;

    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    // Create cache key
    const cacheKey = `videos:search:${JSON.stringify(queryDto)}`;

    // Check cache first
    const cached = await this.cacheManager.get<VideoSearchResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params: any = {
        query,
        per_page: Math.min(per_page, 80), // Pexels max is 80
        page,
      };

      if (orientation) params.orientation = orientation;
      if (size) params.size = size;
      if (min_duration) params.min_duration = min_duration;
      if (max_duration) params.max_duration = max_duration;

      const response = await firstValueFrom(
        this.httpService.get(`${this.pexelsApiUrl}/search`, {
          params,
          headers: {
            'Authorization': this.apiKey,
          },
        }),
      );

      const result: VideoSearchResponseDto = {
        total_results: response.data.total_results,
        page: response.data.page,
        per_page: response.data.per_page,
        next_page: response.data.next_page || undefined,
        prev_page: response.data.prev_page || undefined,
        videos: response.data.videos.map((video: any) => this.formatVideo(video)),
      };

      // Cache for 2 hours
      await this.cacheManager.set(cacheKey, result, 7200000);

      return result;
    } catch (error) {
      console.error('Pexels API error:', error.response?.data || error.message);
      if (error.response?.status === 429) {
        throw new InternalServerErrorException('Rate limit exceeded. Please try again later.');
      }
      throw new InternalServerErrorException('Failed to search videos');
    }
  }

  async getTrendingVideos(page: number = 1, per_page: number = 20): Promise<VideoSearchResponseDto> {
    const cacheKey = `videos:popular:${page}:${per_page}`;

    // Check cache first
    const cached = await this.cacheManager.get<VideoSearchResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.pexelsApiUrl}/popular`, {
          params: {
            page,
            per_page: Math.min(per_page, 80), // Pexels max is 80
          },
          headers: {
            'Authorization': this.apiKey,
          },
        }),
      );

      const result: VideoSearchResponseDto = {
        total_results: response.data.total_results || 10000, // Estimated total for popular
        page: response.data.page,
        per_page: response.data.per_page,
        next_page: response.data.next_page || undefined,
        prev_page: response.data.prev_page || undefined,
        videos: response.data.videos.map((video: any) => this.formatVideo(video)),
      };

      // Cache for 1 hour
      await this.cacheManager.set(cacheKey, result, 3600000);

      return result;
    } catch (error) {
      console.error('Pexels API error:', error.response?.data || error.message);
      if (error.response?.status === 429) {
        throw new InternalServerErrorException('Rate limit exceeded. Please try again later.');
      }
      throw new InternalServerErrorException('Failed to get popular videos');
    }
  }

  async getVideoById(id: string): Promise<VideoResponseDto> {
    if (!id) {
      throw new BadRequestException('Video ID is required');
    }

    const cacheKey = `videos:detail:${id}`;

    // Check cache first
    const cached = await this.cacheManager.get<VideoResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.pexelsApiUrl}/videos/${id}`, {
          headers: {
            'Authorization': this.apiKey,
          },
        }),
      );

      const result = this.formatVideo(response.data);

      // Cache for 4 hours
      await this.cacheManager.set(cacheKey, result, 14400000);

      return result;
    } catch (error) {
      console.error('Pexels API error:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        throw new BadRequestException('Video not found');
      }
      if (error.response?.status === 429) {
        throw new InternalServerErrorException('Rate limit exceeded. Please try again later.');
      }
      throw new InternalServerErrorException('Failed to get video details');
    }
  }

  private formatVideo(video: any): VideoResponseDto {
    // Calculate aspect ratio
    const aspectRatio = video.width / video.height;

    // Find the largest file for file size calculation
    const largestFile = video.video_files?.reduce((largest: any, current: any) => 
      (current.width * current.height) > (largest.width * largest.height) ? current : largest
    ) || video.video_files?.[0];

    // Estimate file size in MB (rough calculation based on dimensions and quality)
    const estimatedSizeMB = largestFile ? Math.round((largestFile.width * largestFile.height * 0.0001)) : 0;

    // Get best quality video for download
    const hdVideo = video.video_files?.find((file: any) => 
      file.quality === 'hd' || file.quality === 'sd' || file.width >= 1280
    ) || largestFile;

    // Get preview/medium quality video
    const previewVideo = video.video_files?.find((file: any) => 
      file.quality === 'sd' || (file.width >= 640 && file.width <= 1280)
    ) || video.video_files?.find((file: any) => file.quality === 'hd') || largestFile;

    return {
      id: video.id,
      width: video.width,
      height: video.height,
      duration: video.duration || 0,
      image: video.image,
      url: video.url,
      user: {
        id: video.user?.id || 0,
        name: video.user?.name || 'Unknown',
        url: video.user?.url || '',
      },
      video_files: video.video_files?.map((file: any) => ({
        id: file.id,
        quality: file.quality,
        file_type: file.file_type,
        width: file.width,
        height: file.height,
        link: file.link,
        size: file.size || 0,
      })) || [],
      tags: video.tags || [],
      aspect_ratio: aspectRatio,
      color: this.extractDominantColor(video.image),
      file_size_mb: estimatedSizeMB,
      preview_url: previewVideo?.link || video.image,
      download_url: hdVideo?.link || video.url,
    };
  }

  // Helper method to extract or estimate dominant color from thumbnail
  private extractDominantColor(imageUrl: string): string {
    // For now, return a default color. In a real implementation,
    // you might use an image processing service to extract dominant colors
    return '#2c3e50';
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.pexelsApiUrl}/popular`, {
          params: { per_page: 1 },
          headers: { 'Authorization': this.apiKey },
          timeout: 5000,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}