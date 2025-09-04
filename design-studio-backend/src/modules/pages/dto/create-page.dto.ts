import { IsString, IsOptional, IsInt, IsArray, Min, Max, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ComponentInstanceDto {
  @ApiProperty({
    description: 'Component ID to use',
    example: 'comp1a2b3c4d5e6f7g8h9',
  })
  @IsString()
  componentId: string;

  @ApiProperty({
    description: 'Component version to use',
    example: 12,
  })
  @IsInt()
  @Min(1)
  componentVersion: number;

  @ApiProperty({
    description: 'X position on the page',
    example: 100,
  })
  @IsInt()
  @Min(0)
  x: number;

  @ApiProperty({
    description: 'Y position on the page',
    example: 50,
  })
  @IsInt()
  @Min(0)
  y: number;

  @ApiProperty({
    description: 'Component width',
    example: 400,
  })
  @IsInt()
  @Min(1)
  width: number;

  @ApiProperty({
    description: 'Component height',
    example: 300,
  })
  @IsInt()
  @Min(1)
  height: number;

  @ApiProperty({
    description: 'Z-index for layering',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  zIndex?: number;

  @ApiProperty({
    description: 'Component-specific properties override',
    example: { title: 'Custom Chart Title', color: '#FF5733' },
    required: false,
  })
  @IsOptional()
  props?: Record<string, any>;
}

export class CreatePageDto {
  @ApiProperty({
    description: 'Report ID that this page belongs to',
    example: 'rep1a2b3c4d5e6f7g8h9',
  })
  @IsString()
  reportId: string;

  @ApiProperty({
    description: 'Page title',
    example: 'Executive Summary',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Page description',
    example: 'High-level overview of key metrics and findings',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Page order within the report (0-based)',
    example: 0,
  })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({
    description: 'Layout type for the page',
    example: 'FLEXIBLE',
    enum: ['FLEXIBLE', 'GRID', 'FIXED', 'RESPONSIVE'],
    required: false,
  })
  @IsOptional()
  @IsString()
  layoutType?: 'FLEXIBLE' | 'GRID' | 'FIXED' | 'RESPONSIVE';

  @ApiProperty({
    description: 'Number of columns for grid layouts',
    example: 2,
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
    description: 'Component instances to place on this page',
    type: [ComponentInstanceDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentInstanceDto)
  components?: ComponentInstanceDto[];

  @ApiProperty({
    description: 'Page settings (background, padding, etc.)',
    example: {
      background: { color: '#FFFFFF' },
      padding: { top: 20, right: 20, bottom: 20, left: 20 }
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