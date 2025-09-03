import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Using our backend API at port 3001
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:3001/api/v1';

export interface UnsplashPhoto {
  id: string;
  slug: string;
  description: string;
  alt_description?: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  user: {
    id: string;
    username: string;
    name: string;
    profile_image?: {
      small: string;
      medium: string;
      large: string;
    };
    portfolio_url?: string;
  };
  tags?: Array<{
    type: string;
    title: string;
  }>;
  likes: number;
  download_url: string;
}

export interface UnsplashSearchParams {
  query?: string;
  page?: number;
  per_page?: number;
  order_by?: 'latest' | 'oldest' | 'popular' | 'relevant';
  collections?: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  color?: 'black_and_white' | 'black' | 'white' | 'yellow' | 'orange' | 'red' | 'purple' | 'magenta' | 'green' | 'teal' | 'blue';
  featured?: boolean;
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
  results: UnsplashPhoto[];
}

export interface UnsplashCollection {
  id: number;
  title: string;
  description: string | null;
  published_at: string;
  updated_at: string;
  curated?: boolean;
  total_photos: number;
  private: boolean;
  share_key: string;
  tags: Array<{
    type: string;
    title: string;
  }>;
  links: {
    self: string;
    html: string;
    photos: string;
    related: string;
  };
  user: UnsplashPhoto['user'];
  cover_photo: UnsplashPhoto;
  preview_photos: UnsplashPhoto[];
}

class UnsplashService {
  private client = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 10000,
  });

  private handleApiError(error: any): never {
    if (error.response?.status === 403) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid Unsplash API key. Please check your configuration.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else {
      throw new Error(`Failed to fetch from Unsplash: ${error.message}`);
    }
  }

  async searchPhotos(params: UnsplashSearchParams = {}): Promise<UnsplashSearchResponse> {
    try {
      const defaultParams: UnsplashSearchParams = {
        query: 'nature',
        page: 1,
        per_page: 20,
        order_by: 'relevant',
        orientation: undefined,
        color: undefined,
        featured: false,
      };

      const searchParams = { ...defaultParams, ...params };
      
      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, value]) => value !== undefined)
      );

      const response: AxiosResponse<UnsplashSearchResponse> = await this.client.get('/photos/search', {
        params: cleanParams,
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getRandomPhotos(params: { per_page?: number; page?: number } = {}): Promise<UnsplashPhoto[]> {
    try {
      const defaultParams = {
        per_page: 20,
        page: 1,
        ...params
      };

      const response: AxiosResponse<UnsplashSearchResponse> = await this.client.get('/photos/trending', {
        params: defaultParams,
      });

      return response.data.results || [];
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getPhoto(id: string): Promise<UnsplashPhoto> {
    try {
      const response: AxiosResponse<UnsplashPhoto> = await this.client.get(`/photos/${id}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getCollections(): Promise<UnsplashCollection[]> {
    try {
      const response: AxiosResponse<UnsplashCollection[]> = await this.client.get('/photos/collections', {
        params: {
          page: 1,
          per_page: 20,
        },
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getCollectionPhotos(id: number, page = 1, perPage = 20): Promise<UnsplashPhoto[]> {
    try {
      const response: AxiosResponse<UnsplashPhoto[]> = await this.client.get(`/photos/collections/${id}/photos`, {
        params: {
          page,
          per_page: perPage,
        },
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Track download for attribution purposes
   */
  async triggerDownload(photo: UnsplashPhoto): Promise<void> {
    try {
      await this.client.post(`/photos/${photo.id}/download`);
    } catch (error) {
      // Don't throw errors for download tracking
      console.warn('Failed to track download:', error.message);
    }
  }

  /**
   * Get optimal image URL based on desired dimensions
   */
  getOptimalImageUrl(photo: UnsplashPhoto, width?: number, height?: number, quality = 80): string {
    const { urls } = photo;
    
    if (!width && !height) {
      return urls.regular;
    }

    // Use Unsplash's dynamic resizing
    const baseUrl = urls.raw;
    const params = new URLSearchParams();
    
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality !== 80) params.append('q', quality.toString());
    params.append('fit', 'crop');
    params.append('auto', 'format');
    
    return `${baseUrl}&${params.toString()}`;
  }

  /**
   * Generate blurhash-based placeholder URL
   */
  getPlaceholderUrl(photo: UnsplashPhoto, width = 50, height = 50): string {
    return `${photo.urls.thumb}&w=${width}&h=${height}&blur=10&q=1`;
  }

  getRemainingRequests(): number {
    // Rate limiting handled by backend
    return 100;
  }
}

export const unsplashService = new UnsplashService();
export default unsplashService;

// Re-export interfaces explicitly
export type { UnsplashPhoto, UnsplashSearchParams, UnsplashSearchResponse, UnsplashCollection };