import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FontVariantDto {
  @ApiProperty({ description: 'Font variant/weight', example: '400' })
  variant: string;

  @ApiProperty({ description: 'Font weight', example: 400 })
  weight: number;

  @ApiProperty({ description: 'Font style', example: 'normal' })
  style: string;

  @ApiProperty({ description: 'Font file URLs by format' })
  files: {
    woff2?: string;
    woff?: string;
    ttf?: string;
    eot?: string;
    svg?: string;
  };
}

export class FontResponseDto {
  @ApiProperty({ description: 'Font family name', example: 'Roboto' })
  family: string;

  @ApiProperty({ description: 'Font category', example: 'sans-serif' })
  category: string;

  @ApiProperty({ description: 'Available font variants', type: [String] })
  variants: string[];

  @ApiProperty({ description: 'Available subsets', type: [String] })
  subsets: string[];

  @ApiPropertyOptional({ description: 'Font version' })
  version?: string;

  @ApiPropertyOptional({ description: 'Last modified date' })
  lastModified?: string;

  @ApiProperty({ description: 'Google Fonts API URL for CSS' })
  css_url: string;

  @ApiProperty({ description: 'Preview URL for font sample' })
  preview_url: string;

  @ApiPropertyOptional({ description: 'Font popularity rank' })
  popularity?: number;

  @ApiPropertyOptional({ description: 'Font trending score' })
  trending?: number;

  @ApiProperty({ description: 'Detailed variants with file URLs', type: [FontVariantDto] })
  detailed_variants?: FontVariantDto[];
}

export class FontListResponseDto {
  @ApiProperty({ description: 'Total number of fonts' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  per_page: number;

  @ApiProperty({ description: 'Font families', type: [FontResponseDto] })
  items: FontResponseDto[];
}

export class FontCategoriesResponseDto {
  @ApiProperty({ description: 'Available font categories with counts' })
  categories: Array<{
    name: string;
    count: number;
    description: string;
  }>;
}