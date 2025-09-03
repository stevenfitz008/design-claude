import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { 
  PexelsVideo, 
  PexelsSearchParams, 
  PexelsSearchResponse,
  VideoCanvasData 
} from '../types/videos';

// Using our backend API at port 3001
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:3001/api/v1';

class PexelsService {
  private client = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 15000, // Increased timeout for videos
  });

  private handleApiError(error: any): never {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid Pexels API key. Please check your configuration.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else {
      throw new Error(`Failed to fetch from Pexels: ${error.message}`);
    }
  }

  async searchVideos(params: PexelsSearchParams = {}): Promise<PexelsSearchResponse> {
    try {
      const defaultParams: PexelsSearchParams = {
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

      const response: AxiosResponse<PexelsSearchResponse> = await this.client.get('/videos/search', {
        params: cleanParams,
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getTrendingVideos(params: { per_page?: number; page?: number } = {}): Promise<PexelsVideo[]> {
    try {
      const defaultParams = {
        per_page: 20,
        page: 1,
        ...params
      };

      const response: AxiosResponse<PexelsSearchResponse> = await this.client.get('/videos/trending', {
        params: defaultParams,
      });

      return response.data.videos || [];
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getVideo(id: string | number): Promise<PexelsVideo> {
    try {
      const response: AxiosResponse<PexelsVideo> = await this.client.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Convert Pexels video to canvas-ready data
   */
  toCanvasData(video: PexelsVideo): VideoCanvasData {
    return {
      type: 'video',
      src: video.preview_url || video.image,
      thumbnail: video.image,
      duration: video.duration,
      width: video.width,
      height: video.height,
      user: video.user.name,
      download_url: video.download_url,
      video_files: video.video_files,
    };
  }

  /**
   * Get optimal video file based on desired quality/size
   */
  getOptimalVideoFile(video: PexelsVideo, preferredQuality: 'hd' | 'sd' | 'mobile' = 'sd'): string {
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

  /**
   * Get video thumbnail with optional size optimization
   */
  getThumbnailUrl(video: PexelsVideo, width?: number, height?: number): string {
    // For now, return the standard thumbnail
    // In a real implementation, you might optimize thumbnail sizes
    return video.image;
  }

  /**
   * Format video duration for display
   */
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

  /**
   * Get file size formatted for display
   */
  formatFileSize(video: PexelsVideo): string {
    const sizeMB = video.file_size_mb;
    if (sizeMB < 1) {
      return `${Math.round(sizeMB * 1024)}KB`;
    } else if (sizeMB < 1024) {
      return `${Math.round(sizeMB)}MB`;
    } else {
      return `${Math.round(sizeMB / 1024 * 10) / 10}GB`;
    }
  }

  /**
   * Check service health
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/videos/health/status');
      return response.data.healthy === true;
    } catch {
      return false;
    }
  }

  /**
   * Get video aspect ratio as display string
   */
  getAspectRatioString(video: PexelsVideo): string {
    const ratio = video.aspect_ratio;
    
    if (ratio > 1.7) return 'Wide (16:9)';
    if (ratio > 1.3) return 'Standard (4:3)';
    if (ratio < 0.8) return 'Portrait (9:16)';
    return 'Square (1:1)';
  }

  /**
   * Filter videos by duration range
   */
  filterByDuration(videos: PexelsVideo[], minSeconds: number, maxSeconds: number): PexelsVideo[] {
    return videos.filter(video => 
      video.duration >= minSeconds && video.duration <= maxSeconds
    );
  }
}

export const pexelsService = new PexelsService();
export default pexelsService;

// Re-export types
export type { PexelsVideo, PexelsSearchParams, PexelsSearchResponse, VideoCanvasData };