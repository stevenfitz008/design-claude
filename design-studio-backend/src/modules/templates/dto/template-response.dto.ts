import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TemplateAuthorDto {
  @ApiProperty({ description: 'Author ID' })
  id: string;

  @ApiProperty({ description: 'Author name' })
  name: string;

  @ApiPropertyOptional({ description: 'Author avatar URL' })
  avatar?: string;

  @ApiPropertyOptional({ description: 'Author portfolio URL' })
  portfolio?: string;
}

export class TemplateDimensionsDto {
  @ApiProperty({ description: 'Template width in pixels' })
  width: number;

  @ApiProperty({ description: 'Template height in pixels' })
  height: number;

  @ApiProperty({ description: 'Aspect ratio (e.g., 16:9)' })
  aspectRatio: string;
}

export class TemplateUsageStatsDto {
  @ApiProperty({ description: 'Total downloads/uses' })
  totalDownloads: number;

  @ApiProperty({ description: 'Downloads this month' })
  monthlyDownloads: number;

  @ApiProperty({ description: 'Average rating (1-5)' })
  averageRating: number;

  @ApiProperty({ description: 'Number of ratings' })
  ratingCount: number;

  @ApiProperty({ description: 'Template popularity score' })
  popularityScore: number;
}

export class TemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  description?: string;

  @ApiProperty({ description: 'Template category' })
  category: string;

  @ApiProperty({ description: 'Template tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Template dimensions', type: TemplateDimensionsDto })
  dimensions: TemplateDimensionsDto;

  @ApiProperty({ description: 'Template thumbnail URL' })
  thumbnailUrl: string;

  @ApiPropertyOptional({ description: 'Template preview URL' })
  previewUrl?: string;

  @ApiProperty({ description: 'Whether template is premium' })
  isPremium: boolean;

  @ApiProperty({ description: 'Whether template is featured' })
  isFeatured: boolean;

  @ApiProperty({ description: 'Whether template is publicly available' })
  isPublic: boolean;

  @ApiPropertyOptional({ description: 'Premium price in cents' })
  price?: number;

  @ApiPropertyOptional({ description: 'Template author', type: TemplateAuthorDto })
  author?: TemplateAuthorDto;

  @ApiProperty({ description: 'Template usage statistics', type: TemplateUsageStatsDto })
  usageStats: TemplateUsageStatsDto;

  @ApiPropertyOptional({ description: 'MongoDB canvas document ID' })
  canvasDocumentId?: string;

  @ApiProperty({ description: 'Template creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Template last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Template version' })
  version?: number;
}

export class TemplateWithCanvasDto extends TemplateResponseDto {
  @ApiPropertyOptional({
    description: 'Template canvas data',
    example: {
      elements: [],
      layers: [],
      timeline: {},
      viewport: { zoom: 1, panX: 0, panY: 0 },
      settings: {},
      backgroundColor: { r: 255, g: 255, b: 255, a: 1 }
    },
  })
  canvasData?: {
    elements: any[];
    layers: any[];
    timeline: any;
    viewport: any;
    settings: any;
    backgroundColor: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };
}

export class TemplateListResponseDto {
  @ApiProperty({ description: 'Total number of templates' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Results per page' })
  pageSize: number;

  @ApiProperty({ description: 'Template list', type: [TemplateResponseDto] })
  data: TemplateResponseDto[];
}

export class TemplateCategoriesResponseDto {
  @ApiProperty({ description: 'Available template categories with counts' })
  categories: Array<{
    name: string;
    displayName: string;
    count: number;
    description: string;
    thumbnail?: string;
  }>;
}

export class TemplateUsageResponseDto {
  @ApiProperty({ description: 'Usage tracking ID' })
  usageId: string;

  @ApiProperty({ description: 'Template ID' })
  templateId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Usage type (download, preview, use)' })
  usageType: string;

  @ApiProperty({ description: 'Usage timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Success message' })
  message: string;
}