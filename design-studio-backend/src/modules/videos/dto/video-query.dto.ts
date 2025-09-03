import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VideoQueryDto {
  @ApiPropertyOptional({
    description: 'Search query for videos',
    example: 'nature ocean waves',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Number of videos per page',
    example: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  per_page?: number = 20;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Video orientation',
    enum: ['landscape', 'portrait'],
    example: 'landscape',
  })
  @IsOptional()
  @IsString()
  orientation?: 'landscape' | 'portrait';

  @ApiPropertyOptional({
    description: 'Video size/quality',
    enum: ['large', 'medium', 'small'],
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  size?: 'large' | 'medium' | 'small';

  @ApiPropertyOptional({
    description: 'Video category',
    example: 'nature',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Minimum duration in seconds',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  min_duration?: number;

  @ApiPropertyOptional({
    description: 'Maximum duration in seconds',
    example: 60,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_duration?: number;
}