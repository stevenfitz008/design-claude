import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Using our backend API at port 3001  
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:3001/api/v1';

// Common interfaces for both photos and videos
export interface MediaUser {
  id: string | number;
  name: string;
  username?: string;
  url?: string;
  profile_image?: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface MediaTag {
  type?: string;
  title: string;
}

// Photo-specific interfaces
export interface PhotoUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

export interface Photo {
  id: string;
  slug?: string;
  description?: string;
  alt_description?: string;
  urls: PhotoUrls;
  width: number;
  height: number;
  color: string;
  blur_hash?: string;
  likes?: number;
  user: MediaUser;
  tags?: MediaTag[];
  download_url: string;
}

export interface PhotoSearchResponse {
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
  results: Photo[];
}

// Video-specific interfaces
export interface VideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
  size?: number;
}

export interface Video {
  id: number;
  width: number;
  height: number;
  duration: number;
  image: string; // thumbnail
  url: string;
  user: MediaUser;
  video_files: VideoFile[];
  tags: string[];
  aspect_ratio: number;
  color: string;
  file_size_mb: number;
  preview_url: string;
  download_url: string;
}

export interface VideoSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  next_page?: number;
  prev_page?: number;
  videos: Video[];
}

// Search parameters
export interface MediaSearchParams {
  query?: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  category?: string;
  size?: 'large' | 'medium' | 'small';
  min_duration?: number;
  max_duration?: number;
}

class MediaService {
  private client = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 15000,
  });

  private handleApiError(error: any): never {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('API authentication failed. Please check configuration.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.response?.status === 404) {
      throw new Error('API endpoint not found.');
    } else {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  // Photo methods using Unsplash API through backend
  async searchPhotos(params: MediaSearchParams = {}): Promise<PhotoSearchResponse> {
    try {
      const defaultParams: MediaSearchParams = {
        query: 'nature',
        page: 1,
        per_page: 20,
      };

      const searchParams = { ...defaultParams, ...params };
      
      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, value]) => value !== undefined)
      );

      const response: AxiosResponse<PhotoSearchResponse> = await this.client.get('/photos/search', {
        params: cleanParams,
      });

      return response.data;
    } catch (error) {
      console.error('Photos API error:', error);
      this.handleApiError(error);
    }
  }

  async getTrendingPhotos(params: { per_page?: number; page?: number } = {}): Promise<Photo[]> {
    try {
      const defaultParams = {
        per_page: 20,
        page: 1,
        ...params
      };

      const response: AxiosResponse<PhotoSearchResponse> = await this.client.get('/photos/trending', {
        params: defaultParams,
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Trending photos API error:', error);
      this.handleApiError(error);
    }
  }

  async getPhotoById(id: string): Promise<Photo> {
    try {
      const response: AxiosResponse<Photo> = await this.client.get(`/photos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Photo detail API error:', error);
      this.handleApiError(error);
    }
  }

  // Video methods using Pexels API through backend
  async searchVideos(params: MediaSearchParams = {}): Promise<VideoSearchResponse> {
    try {
      const defaultParams: MediaSearchParams = {
        query: 'nature',
        page: 1,
        per_page: 20,
        orientation: undefined,
        size: 'medium',
      };

      const searchParams = { ...defaultParams, ...params };
      
      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, value]) => value !== undefined)
      );

      const response: AxiosResponse<VideoSearchResponse> = await this.client.get('/videos/search', {
        params: cleanParams,
      });

      return response.data;
    } catch (error) {
      console.error('Videos API error:', error);
      this.handleApiError(error);
    }
  }

  async getTrendingVideos(params: { per_page?: number; page?: number } = {}): Promise<Video[]> {
    try {
      const defaultParams = {
        per_page: 20,
        page: 1,
        ...params
      };

      const response: AxiosResponse<VideoSearchResponse> = await this.client.get('/videos/trending', {
        params: defaultParams,
      });

      return response.data.videos || [];
    } catch (error) {
      console.error('Trending videos API error:', error);
      this.handleApiError(error);
    }
  }

  async getVideoById(id: string | number): Promise<Video> {
    try {
      const response: AxiosResponse<Video> = await this.client.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Video detail API error:', error);
      this.handleApiError(error);
    }
  }

  // Video utility methods
  getOptimalVideoFile(video: Video, preferredQuality: 'hd' | 'sd' | 'mobile' = 'sd'): string {
    const { video_files } = video;
    
    if (!video_files || video_files.length === 0) {
      return video.preview_url || video.image;
    }

    // Quality priority mapping
    const qualityPriority: { [key: string]: number } = {
      'hd': 3,
      'sd': 2,
      'mobile': 1,
    };

    // Find best matching quality
    const bestFile = video_files
      .filter(file => file.file_type === 'video/mp4') // Prefer MP4
      .sort((a, b) => {
        const aQuality = qualityPriority[a.quality] || 0;
        const bQuality = qualityPriority[b.quality] || 0;
        const targetQuality = qualityPriority[preferredQuality];
        
        // Prefer exact match, then closest without going over, then any
        const aDiff = Math.abs(aQuality - targetQuality);
        const bDiff = Math.abs(bQuality - targetQuality);
        return aDiff - bDiff;
      })[0];

    return bestFile?.link || video.download_url || video.preview_url;
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  formatFileSize(sizeMB: number): string {
    if (sizeMB < 1) {
      return `${Math.round(sizeMB * 1024)}KB`;
    } else if (sizeMB < 1024) {
      return `${Math.round(sizeMB)}MB`;
    } else {
      return `${Math.round(sizeMB / 1024 * 10) / 10}GB`;
    }
  }

  // Health checks
  async isPhotosHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/photos/health/status');
      return response.data.healthy === true;
    } catch {
      return false;
    }
  }

  async isVideosHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/videos/health/status');
      return response.data.healthy === true;
    } catch {
      return false;
    }
  }

  // Convert to canvas data formats
  photoToCanvasData(photo: Photo) {
    return {
      type: 'photo',
      id: photo.id,
      src: photo.urls.regular,
      thumbnail: photo.urls.small,
      width: photo.width,
      height: photo.height,
      user: photo.user.name,
      alt: photo.alt_description || photo.description || 'Photo',
      tags: photo.tags?.map(tag => tag.title) || [],
      color: photo.color,
      download_url: photo.download_url
    };
  }

  videoToCanvasData(video: Video) {
    return {
      type: 'video',
      id: video.id,
      src: video.preview_url,
      thumbnail: video.image,
      duration: video.duration,
      width: video.width,
      height: video.height,
      aspect_ratio: video.aspect_ratio,
      file_size_mb: video.file_size_mb,
      user: video.user.name,
      tags: video.tags,
      color: video.color,
      download_url: video.download_url
    };
  }
}

export const mediaService = new MediaService();
export default mediaService;

// Re-export types for convenience
export type { Photo, Video, PhotoSearchResponse, VideoSearchResponse, MediaSearchParams };