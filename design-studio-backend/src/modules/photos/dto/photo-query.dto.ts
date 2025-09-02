import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PhotoQueryDto {
  @ApiPropertyOptional({
    description: 'Search query for photos',
    example: 'nature landscape',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Number of photos per page',
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
    description: 'Photo orientation',
    enum: ['landscape', 'portrait', 'squarish'],
    example: 'landscape',
  })
  @IsOptional()
  @IsString()
  orientation?: 'landscape' | 'portrait' | 'squarish';

  @ApiPropertyOptional({
    description: 'Photo category',
    example: 'nature',
  })
  @IsOptional()
  @IsString()
  category?: string;
}