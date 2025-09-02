import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PhotoQueryDto } from './dto/photo-query.dto';
import { PhotoResponseDto, PhotoSearchResponseDto } from './dto/photo-response.dto';

@Injectable()
export class PhotosService {
  private readonly unsplashApiUrl = 'https://api.unsplash.com';
  private readonly accessKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.accessKey = this.configService.get<string>('UNSPLASH_ACCESS_KEY');
    if (!this.accessKey) {
      throw new Error('UNSPLASH_ACCESS_KEY is required but not configured');
    }
  }

  async searchPhotos(queryDto: PhotoQueryDto): Promise<PhotoSearchResponseDto> {
    const { query, per_page = 20, page = 1, orientation, category } = queryDto;

    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    // Create cache key
    const cacheKey = `photos:search:${JSON.stringify(queryDto)}`;

    // Check cache first
    const cached = await this.cacheManager.get<PhotoSearchResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params: any = {
        query,
        per_page,
        page,
        client_id: this.accessKey,
      };

      if (orientation) params.orientation = orientation;
      if (category) params.category = category;

      const response = await firstValueFrom(
        this.httpService.get(`${this.unsplashApiUrl}/search/photos`, {
          params,
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
        }),
      );

      const result: PhotoSearchResponseDto = {
        total: response.data.total,
        total_pages: response.data.total_pages,
        page: page,
        per_page: per_page,
        results: response.data.results.map((photo: any) => this.formatPhoto(photo)),
      };

      // Cache for 1 hour
      await this.cacheManager.set(cacheKey, result, 3600000);

      return result;
    } catch (error) {
      console.error('Unsplash API error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to search photos');
    }
  }

  async getTrendingPhotos(page: number = 1, per_page: number = 20): Promise<PhotoSearchResponseDto> {
    const cacheKey = `photos:trending:${page}:${per_page}`;

    // Check cache first
    const cached = await this.cacheManager.get<PhotoSearchResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.unsplashApiUrl}/photos`, {
          params: {
            page,
            per_page,
            order_by: 'popular',
            client_id: this.accessKey,
          },
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
        }),
      );

      const result: PhotoSearchResponseDto = {
        total: 10000, // Estimated total for trending
        total_pages: Math.ceil(10000 / per_page),
        page,
        per_page,
        results: response.data.map((photo: any) => this.formatPhoto(photo)),
      };

      // Cache for 30 minutes
      await this.cacheManager.set(cacheKey, result, 1800000);

      return result;
    } catch (error) {
      console.error('Unsplash API error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to get trending photos');
    }
  }

  async getPhotoById(id: string): Promise<PhotoResponseDto> {
    if (!id) {
      throw new BadRequestException('Photo ID is required');
    }

    const cacheKey = `photos:detail:${id}`;

    // Check cache first
    const cached = await this.cacheManager.get<PhotoResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.unsplashApiUrl}/photos/${id}`, {
          params: {
            client_id: this.accessKey,
          },
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
        }),
      );

      const result = this.formatPhoto(response.data);

      // Cache for 2 hours
      await this.cacheManager.set(cacheKey, result, 7200000);

      return result;
    } catch (error) {
      console.error('Unsplash API error:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        throw new BadRequestException('Photo not found');
      }
      throw new InternalServerErrorException('Failed to get photo details');
    }
  }

  async trackDownload(id: string): Promise<{ download_url: string }> {
    if (!id) {
      throw new BadRequestException('Photo ID is required');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.unsplashApiUrl}/photos/${id}/download`, {
          params: {
            client_id: this.accessKey,
          },
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
        }),
      );

      return {
        download_url: response.data.url,
      };
    } catch (error) {
      console.error('Unsplash download tracking error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to track download');
    }
  }

  async getCollections(page: number = 1, per_page: number = 20): Promise<any> {
    const cacheKey = `photos:collections:${page}:${per_page}`;

    // Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.unsplashApiUrl}/collections`, {
          params: {
            page,
            per_page,
            client_id: this.accessKey,
          },
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
        }),
      );

      const result = response.data.map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        total_photos: collection.total_photos,
        cover_photo: collection.cover_photo ? this.formatPhoto(collection.cover_photo) : null,
        user: {
          id: collection.user.id,
          username: collection.user.username,
          name: collection.user.name,
          profile_image: collection.user.profile_image,
        },
      }));

      // Cache for 2 hours
      await this.cacheManager.set(cacheKey, result, 7200000);

      return result;
    } catch (error) {
      console.error('Unsplash collections error:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to get collections');
    }
  }

  private formatPhoto(photo: any): PhotoResponseDto {
    return {
      id: photo.id,
      slug: photo.slug,
      description: photo.description || photo.alt_description || '',
      alt_description: photo.alt_description,
      urls: {
        raw: photo.urls.raw,
        full: photo.urls.full,
        regular: photo.urls.regular,
        small: photo.urls.small,
        thumb: photo.urls.thumb,
      },
      width: photo.width,
      height: photo.height,
      color: photo.color,
      blur_hash: photo.blur_hash,
      likes: photo.likes,
      user: {
        id: photo.user.id,
        username: photo.user.username,
        name: photo.user.name,
        profile_image: photo.user.profile_image,
        portfolio_url: photo.user.portfolio_url,
      },
      tags: photo.tags ? photo.tags.map((tag: any) => ({
        type: tag.type,
        title: tag.title,
      })) : undefined,
      download_url: `${this.unsplashApiUrl}/photos/${photo.id}/download?client_id=${this.accessKey}`,
    };
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.unsplashApiUrl}/photos/random`, {
          params: { client_id: this.accessKey },
          timeout: 5000,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}