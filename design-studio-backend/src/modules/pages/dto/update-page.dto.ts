import { IsString, IsOptional, IsInt, Min, Max, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePageDto {
  @ApiProperty({
    description: 'Page title',
    example: 'Executive Summary - Updated',
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Page description',
    example: 'Updated high-level overview of key metrics and findings',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Page order within the report (0-based)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Layout type for the page',
    example: 'GRID',
    enum: ['FLEXIBLE', 'GRID', 'FIXED', 'RESPONSIVE'],
    required: false,
  })
  @IsOptional()
  @IsString()
  layoutType?: 'FLEXIBLE' | 'GRID' | 'FIXED' | 'RESPONSIVE';

  @ApiProperty({
    description: 'Number of columns for grid layouts',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  columns?: number;

  @ApiProperty({
    description: 'Page width in pixels',
    example: 1920,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(10000)
  width?: number;

  @ApiProperty({
    description: 'Page height in pixels',
    example: 1080,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(10000)
  height?: number;

  @ApiProperty({
    description: 'Page version for optimistic concurrency control',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiProperty({
    description: 'Page settings (background, padding, etc.)',
    example: {
      background: { color: '#F5F5F5' },
      padding: { top: 30, right: 30, bottom: 30, left: 30 }
    },
    required: false,
  })
  @IsOptional()
  pageSettings?: {
    background?: {
      color?: string;
      image?: string;
      gradient?: any;
    };
    padding?: Record<string, number>;
    margin?: Record<string, number>;
  };
}