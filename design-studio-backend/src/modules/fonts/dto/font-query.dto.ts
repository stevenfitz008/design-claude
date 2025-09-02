import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum FontCategory {
  SERIF = 'serif',
  SANS_SERIF = 'sans-serif',
  DISPLAY = 'display',
  HANDWRITING = 'handwriting',
  MONOSPACE = 'monospace',
}

export enum FontSort {
  ALPHA = 'alpha',
  DATE = 'date',
  POPULARITY = 'popularity',
  STYLE = 'style',
  TRENDING = 'trending',
}

export class FontQueryDto {
  @ApiPropertyOptional({
    description: 'Search query for font families',
    example: 'roboto',
  })
  @IsOptional()
  @IsString()
  family?: string;

  @ApiPropertyOptional({
    description: 'Font category filter',
    enum: FontCategory,
    example: FontCategory.SANS_SERIF,
  })
  @IsOptional()
  @IsEnum(FontCategory)
  category?: FontCategory;

  @ApiPropertyOptional({
    description: 'Sort order for fonts',
    enum: FontSort,
    example: FontSort.POPULARITY,
  })
  @IsOptional()
  @IsEnum(FontSort)
  sort?: FontSort = FontSort.POPULARITY;

  @ApiPropertyOptional({
    description: 'Font subsets (comma-separated)',
    example: 'latin,latin-ext',
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map(s => s.trim()) : value)
  @IsArray()
  @IsString({ each: true })
  subset?: string[];
}