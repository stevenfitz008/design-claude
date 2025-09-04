import { IsOptional, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class PageQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search pages by title or description',
    example: 'executive summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter pages by report ID',
    example: 'rep1a2b3c4d5e6f7g8h9',
    required: false,
  })
  @IsOptional()
  @IsString()
  reportId?: string;

  @ApiProperty({
    description: 'Filter pages by layout type',
    example: 'FLEXIBLE',
    enum: ['FLEXIBLE', 'GRID', 'FIXED', 'RESPONSIVE'],
    required: false,
  })
  @IsOptional()
  @IsString()
  layoutType?: 'FLEXIBLE' | 'GRID' | 'FIXED' | 'RESPONSIVE';

  @ApiProperty({
    description: 'Filter pages with minimum width',
    example: 1200,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  minWidth?: number;

  @ApiProperty({
    description: 'Filter pages with maximum width',
    example: 2000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  maxWidth?: number;

  @ApiProperty({
    description: 'Filter pages with minimum height',
    example: 800,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  minHeight?: number;

  @ApiProperty({
    description: 'Filter pages with maximum height',
    example: 1200,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  maxHeight?: number;

  @ApiProperty({
    description: 'Sort field',
    example: 'order',
    enum: ['order', 'title', 'createdAt', 'updatedAt', 'version'],
    required: false,
    default: 'order',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'order' | 'title' | 'createdAt' | 'updatedAt' | 'version' = 'order';

  @ApiProperty({
    description: 'Sort direction',
    example: 'asc',
    enum: ['asc', 'desc'],
    required: false,
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiProperty({
    description: 'Include component instances in response',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  includeComponents?: boolean = false;
}