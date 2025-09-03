import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VideoFileDto {
  @ApiProperty({ description: 'Video file ID' })
  id: number;

  @ApiProperty({ description: 'Video quality/size label' })
  quality: string;

  @ApiProperty({ description: 'Video file type (mp4, etc.)' })
  file_type: string;

  @ApiProperty({ description: 'Video width in pixels' })
  width: number;

  @ApiProperty({ description: 'Video height in pixels' })
  height: number;

  @ApiProperty({ description: 'Direct video file URL' })
  link: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;
}

export class VideoUserDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User display name' })
  name: string;

  @ApiProperty({ description: 'User profile URL' })
  url: string;
}

export class VideoResponseDto {
  @ApiProperty({ description: 'Video ID' })
  id: number;

  @ApiProperty({ description: 'Video width in pixels' })
  width: number;

  @ApiProperty({ description: 'Video height in pixels' })
  height: number;

  @ApiProperty({ description: 'Video duration in seconds' })
  duration: number;

  @ApiProperty({ description: 'Video preview/thumbnail image URL' })
  image: string;

  @ApiProperty({ description: 'Full video preview URL' })
  url: string;

  @ApiProperty({ description: 'User/creator information' })
  user: VideoUserDto;

  @ApiProperty({ description: 'Available video files', type: [VideoFileDto] })
  video_files: VideoFileDto[];

  @ApiPropertyOptional({ description: 'Video tags' })
  tags?: string[];

  @ApiProperty({ description: 'Video aspect ratio' })
  aspect_ratio: number;

  @ApiProperty({ description: 'Primary dominant color' })
  color?: string;

  @ApiProperty({ description: 'Video file size in MB (largest file)' })
  file_size_mb: number;

  @ApiProperty({ description: 'Optimal preview URL for canvas' })
  preview_url: string;

  @ApiProperty({ description: 'Best quality video URL for download' })
  download_url: string;
}

export class VideoSearchResponseDto {
  @ApiProperty({ description: 'Total number of videos' })
  total_results: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  per_page: number;

  @ApiProperty({ description: 'Next page URL' })
  next_page?: string;

  @ApiProperty({ description: 'Previous page URL' })
  prev_page?: string;

  @ApiProperty({ description: 'Search results', type: [VideoResponseDto] })
  videos: VideoResponseDto[];
}