import { ApiProperty } from '@nestjs/swagger';
import { ReportPageDto } from '../../pages/dto/page-response.dto';

export class ReportDto {
  @ApiProperty({ description: 'Report ID', example: 'clr1a2b3c4d5e6f7g8h9' })
  id: string;

  @ApiProperty({ description: 'Report title', example: 'Q4 2024 Sales Report' })
  title: string;

  @ApiProperty({ 
    description: 'Report description', 
    example: 'Quarterly sales analysis with performance metrics and forecasts',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Report author name', example: 'John Smith' })
  author: string;

  @ApiProperty({ 
    description: 'Report tags for organization',
    example: ['sales', 'quarterly', 'analysis'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({ 
    description: 'Report category',
    example: 'business-report',
    required: false,
  })
  category?: string;

  @ApiProperty({ description: 'Report version', example: 1 })
  version: number;

  @ApiProperty({ description: 'Whether the report is published', example: false })
  isPublished: boolean;

  @ApiProperty({ description: 'Whether the report is publicly accessible', example: false })
  isPublic: boolean;

  @ApiProperty({ description: 'Report creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Report last update timestamp', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;

  @ApiProperty({ 
    description: 'Report publish timestamp',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  publishedAt?: string;

  @ApiProperty({ description: 'User ID who created the report', example: 'usr1a2b3c4d5e6f7g8h9' })
  userId: string;
}

export class ReportWithPagesDto extends ReportDto {
  @ApiProperty({ 
    description: 'Report pages',
    type: [ReportPageDto],
  })
  pages: ReportPageDto[];
}

export class ReportStatsDto {
  @ApiProperty({ description: 'Total number of reports', example: 15 })
  totalReports: number;

  @ApiProperty({ description: 'Number of published reports', example: 8 })
  publishedReports: number;

  @ApiProperty({ description: 'Number of draft reports', example: 7 })
  draftReports: number;

  @ApiProperty({ description: 'Total number of pages across all reports', example: 125 })
  totalPages: number;

  @ApiProperty({ description: 'Total number of components used', example: 342 })
  totalComponents: number;

  @ApiProperty({ 
    description: 'Most used categories',
    example: [{ category: 'business-report', count: 5 }, { category: 'marketing', count: 3 }],
  })
  topCategories: Array<{ category: string; count: number }>;

  @ApiProperty({ 
    description: 'Most used tags',
    example: [{ tag: 'quarterly', count: 8 }, { tag: 'sales', count: 6 }],
  })
  topTags: Array<{ tag: string; count: number }>;
}