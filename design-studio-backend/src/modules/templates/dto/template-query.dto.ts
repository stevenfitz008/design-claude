import { IsOptional, IsString, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum TemplateCategory {
  BUSINESS = 'business',
  SOCIAL_MEDIA = 'social-media',
  PRESENTATION = 'presentation',
  MARKETING = 'marketing',
  PERSONAL = 'personal',
  EDUCATION = 'education',
  DESIGN = 'design',
  OTHER = 'other',
}

export enum TemplateSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  POPULARITY = 'popularity',
  DOWNLOADS = 'downloads',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class TemplateQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search templates by name or description',
    example: 'business card',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by template category',
    enum: TemplateCategory,
    example: TemplateCategory.BUSINESS,
  })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'modern,minimalist,professional',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : value)
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter premium templates',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by aspect ratio (e.g., 16:9, 4:3, 1:1)',
    example: '16:9',
  })
  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @ApiPropertyOptional({
    description: 'Sort templates by field',
    enum: TemplateSortBy,
    example: TemplateSortBy.POPULARITY,
  })
  @IsOptional()
  @IsEnum(TemplateSortBy)
  sortBy?: TemplateSortBy = TemplateSortBy.POPULARITY;

  @ApiPropertyOptional({
    description: 'Sort order (ascending or descending)',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}