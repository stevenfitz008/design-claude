export interface VideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
  size: number;
}

export interface VideoUser {
  id: number;
  name: string;
  url: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  image: string; // thumbnail URL
  url: string; // Pexels page URL
  user: VideoUser;
  video_files: VideoFile[];
  tags?: string[];
  aspect_ratio: number;
  color?: string;
  file_size_mb: number;
  preview_url: string; // Optimized for preview
  download_url: string; // Best quality for download
}

export interface PexelsSearchParams {
  query?: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait';
  size?: 'large' | 'medium' | 'small';
  category?: string;
  min_duration?: number;
  max_duration?: number;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  next_page?: string;
  prev_page?: string;
  videos: PexelsVideo[];
}

// Canvas integration types
export interface VideoCanvasData {
  type: 'video';
  src: string; // preview_url for canvas display
  thumbnail: string; // image URL
  duration: number;
  width: number;
  height: number;
  user: string; // user name for attribution
  download_url: string; // actual video file URL
  video_files: VideoFile[]; // all available qualities
}