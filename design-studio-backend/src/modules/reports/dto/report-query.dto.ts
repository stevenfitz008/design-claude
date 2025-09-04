import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ReportQueryDto extends PaginationDto {
  @ApiProperty({ 
    description: 'Search query to filter reports by title or description',
    example: 'sales report',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Filter by specific category',
    example: 'business-report',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ 
    description: 'Filter by tags (comma-separated)',
    example: 'sales,quarterly',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : value)
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ 
    description: 'Filter by publication status',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ 
    description: 'Filter by public accessibility',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ 
    description: 'Filter by author name',
    example: 'John Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ 
    description: 'Sort field',
    example: 'createdAt',
    enum: ['title', 'createdAt', 'updatedAt', 'publishedAt', 'version'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'version';

  @ApiProperty({ 
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ 
    description: 'Include pages in the response',
    example: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includePages?: boolean;

  @ApiProperty({ 
    description: 'Filter by minimum version',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minVersion?: number;

  @ApiProperty({ 
    description: 'Filter by maximum version',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  maxVersion?: number;

  @ApiProperty({ 
    description: 'Filter by creation date range (start)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiProperty({ 
    description: 'Filter by creation date range (end)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;
}