import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  PNG = 'PNG',
  JPG = 'JPG',
  JPEG = 'JPEG',
  WEBP = 'WEBP',
  SVG = 'SVG',
  PDF = 'PDF',
  MP4 = 'MP4',
  GIF = 'GIF',
  WEBM = 'WEBM',
  MOV = 'MOV',
}

export enum ExportQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

export enum SocialMediaPreset {
  INSTAGRAM_POST = 'instagram_post',           // 1080x1080
  INSTAGRAM_STORY = 'instagram_story',         // 1080x1920
  FACEBOOK_POST = 'facebook_post',             // 1200x630
  FACEBOOK_COVER = 'facebook_cover',           // 1640x859
  TWITTER_POST = 'twitter_post',               // 1200x675
  TWITTER_HEADER = 'twitter_header',           // 1500x500
  LINKEDIN_POST = 'linkedin_post',             // 1200x627
  LINKEDIN_BANNER = 'linkedin_banner',         // 1584x396
  YOUTUBE_THUMBNAIL = 'youtube_thumbnail',     // 1280x720
  YOUTUBE_BANNER = 'youtube_banner',           // 2560x1440
  TIKTOK_VIDEO = 'tiktok_video',              // 1080x1920
  PINTEREST_PIN = 'pinterest_pin',             // 1000x1500
}

export class SocialMediaPresetConfig {
  @ApiProperty({ description: 'Preset name', enum: SocialMediaPreset })
  @IsEnum(SocialMediaPreset)
  preset: SocialMediaPreset;

  @ApiProperty({ description: 'Width in pixels' })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({ description: 'Height in pixels' })
  @IsNumber()
  @Min(1)
  height: number;

  @ApiProperty({ description: 'Recommended aspect ratio' })
  @IsString()
  aspectRatio: string;

  @ApiProperty({ description: 'Platform-specific optimizations' })
  @IsOptional()
  optimizations?: {
    compressionLevel?: number;
    colorSpace?: string;
    dpi?: number;
  };
}

export class ExportOptionsDto {
  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsNotEmpty()
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Export quality', enum: ExportQuality, default: ExportQuality.HIGH })
  @IsOptional()
  @IsEnum(ExportQuality)
  quality?: ExportQuality = ExportQuality.HIGH;

  @ApiProperty({ description: 'Output width in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8192)
  width?: number;

  @ApiProperty({ description: 'Output height in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8192)
  height?: number;

  @ApiProperty({ description: 'Scale factor (1x, 2x, 3x)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  scale?: number = 1;

  @ApiProperty({ description: 'Background transparency (PNG only)', default: true })
  @IsOptional()
  @IsBoolean()
  transparent?: boolean = true;

  @ApiProperty({ description: 'Background color (if not transparent)' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiProperty({ description: 'DPI/PPI for print exports', default: 300 })
  @IsOptional()
  @IsNumber()
  @Min(72)
  @Max(600)
  dpi?: number = 300;

  @ApiProperty({ description: 'Social media preset', enum: SocialMediaPreset })
  @IsOptional()
  @IsEnum(SocialMediaPreset)
  socialPreset?: SocialMediaPreset;

  // Video-specific options
  @ApiProperty({ description: 'Animation duration in seconds (for video exports)' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(60)
  duration?: number;

  @ApiProperty({ description: 'Frames per second (for video exports)', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  fps?: number = 30;

  @ApiProperty({ description: 'Video bitrate in kbps' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  bitrate?: number;

  @ApiProperty({ description: 'Loop video/GIF', default: true })
  @IsOptional()
  @IsBoolean()
  loop?: boolean = true;

  // PDF-specific options
  @ApiProperty({ description: 'PDF page size', default: 'A4' })
  @IsOptional()
  @IsString()
  pageSize?: string = 'A4';

  @ApiProperty({ description: 'PDF margins in mm' })
  @IsOptional()
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Advanced options
  @ApiProperty({ description: 'Include bleed area (print exports)' })
  @IsOptional()
  @IsBoolean()
  includeBleed?: boolean;

  @ApiProperty({ description: 'Color profile for professional printing' })
  @IsOptional()
  @IsString()
  colorProfile?: string;

  @ApiProperty({ description: 'Custom metadata tags' })
  @IsOptional()
  metadata?: Record<string, string>;
}

export class CreateExportJobDto {
  @ApiProperty({ description: 'Project ID to export' })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Export options', type: ExportOptionsDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ExportOptionsDto)
  options: ExportOptionsDto;

  @ApiProperty({ description: 'Timeline ID for animated exports' })
  @IsOptional()
  @IsString()
  timelineId?: string;

  @ApiProperty({ description: 'Webhook URL for completion notification' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

export class BatchExportDto {
  @ApiProperty({ description: 'Project ID to export' })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Multiple export configurations', type: [ExportOptionsDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportOptionsDto)
  exports: ExportOptionsDto[];

  @ApiProperty({ description: 'Timeline ID for animated exports' })
  @IsOptional()
  @IsString()
  timelineId?: string;

  @ApiProperty({ description: 'Webhook URL for batch completion notification' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

export class ExportJobResponseDto {
  @ApiProperty({ description: 'Export job ID' })
  jobId: string;

  @ApiProperty({ description: 'Current status' })
  status: string;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Estimated completion time' })
  estimatedTime?: Date;

  @ApiProperty({ description: 'Download URL (when completed)' })
  downloadUrl?: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize?: number;

  @ApiProperty({ description: 'Error message (if failed)' })
  error?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Completion timestamp' })
  completedAt?: Date;
}

export class ExportStatsDto {
  @ApiProperty({ description: 'Total exports this month' })
  totalExports: number;

  @ApiProperty({ description: 'Successful exports' })
  successfulExports: number;

  @ApiProperty({ description: 'Failed exports' })
  failedExports: number;

  @ApiProperty({ description: 'Total file size exported (bytes)' })
  totalFileSize: number;

  @ApiProperty({ description: 'Average processing time (seconds)' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Most popular format' })
  popularFormat: ExportFormat;

  @ApiProperty({ description: 'Export breakdown by format' })
  formatBreakdown: Record<ExportFormat, number>;
}

// Additional DTOs needed by the service
export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class CreateExportDto {
  @ApiProperty({ description: 'Project ID to export' })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Export quality', enum: ExportQuality, required: false })
  @IsOptional()
  @IsEnum(ExportQuality)
  quality?: ExportQuality;

  @ApiProperty({ description: 'Output width in pixels', required: false })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({ description: 'Output height in pixels', required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ description: 'Export settings', required: false })
  @IsOptional()
  settings?: Record<string, any>;
}

export class ExportDto {
  @ApiProperty({ description: 'Export ID' })
  id: string;

  @ApiProperty({ description: 'Project ID' })
  projectId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  format: ExportFormat;

  @ApiProperty({ description: 'Export quality', enum: ExportQuality })
  quality: ExportQuality;

  @ApiProperty({ description: 'Output width', required: false })
  width?: number;

  @ApiProperty({ description: 'Output height', required: false })
  height?: number;

  @ApiProperty({ description: 'Export status', enum: ExportStatus })
  status: ExportStatus;

  @ApiProperty({ description: 'File URL when completed', required: false })
  url?: string;

  @ApiProperty({ description: 'File size in bytes', required: false })
  fileSize?: number;

  @ApiProperty({ description: 'Error message if failed', required: false })
  errorMessage?: string;

  @ApiProperty({ description: 'Export settings' })
  settings: Record<string, any>;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Completed timestamp', required: false })
  completedAt?: Date;
}