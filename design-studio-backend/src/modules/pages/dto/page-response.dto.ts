import { ApiProperty } from '@nestjs/swagger';

export class ComponentInstanceResponseDto {
  @ApiProperty({ description: 'Instance ID', example: 'inst1a2b3c4d5e6f7g8h9' })
  id: string;

  @ApiProperty({ description: 'Component ID', example: 'comp1a2b3c4d5e6f7g8h9' })
  componentId: string;

  @ApiProperty({ description: 'Component version', example: 12 })
  componentVersion: number;

  @ApiProperty({ description: 'X position', example: 100 })
  x: number;

  @ApiProperty({ description: 'Y position', example: 50 })
  y: number;

  @ApiProperty({ description: 'Width', example: 400 })
  width: number;

  @ApiProperty({ description: 'Height', example: 300 })
  height: number;

  @ApiProperty({ description: 'Rotation angle', example: 0 })
  rotation: number;

  @ApiProperty({ description: 'Z-index', example: 1 })
  zIndex: number;

  @ApiProperty({ description: 'Component properties', example: { title: 'Chart Title' } })
  props: Record<string, any>;

  @ApiProperty({ description: 'Whether component is visible', example: true })
  isVisible: boolean;

  @ApiProperty({ description: 'Whether component is locked', example: false })
  isLocked: boolean;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class ReportPageDto {
  @ApiProperty({ description: 'Page ID', example: 'page1a2b3c4d5e6f7g8h9' })
  id: string;

  @ApiProperty({ description: 'Report ID', example: 'rep1a2b3c4d5e6f7g8h9' })
  reportId: string;

  @ApiProperty({ description: 'Page title', example: 'Executive Summary' })
  title: string;

  @ApiProperty({ 
    description: 'Page description', 
    example: 'High-level overview of key metrics and findings',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Page order within report', example: 0 })
  order: number;

  @ApiProperty({ description: 'Layout type', example: 'FLEXIBLE' })
  layoutType: string;

  @ApiProperty({ description: 'Number of columns', example: 2 })
  columns: number;

  @ApiProperty({ description: 'Page width', example: 1920 })
  width: number;

  @ApiProperty({ description: 'Page height', example: 1080 })
  height: number;

  @ApiProperty({ description: 'Page version', example: 1 })
  version: number;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class ReportPageWithComponentsDto extends ReportPageDto {
  @ApiProperty({ 
    description: 'Component instances on this page',
    type: [ComponentInstanceResponseDto],
  })
  components: ComponentInstanceResponseDto[];

  @ApiProperty({
    description: 'Page layout definition from MongoDB',
    example: {
      type: 'flexible',
      columns: 2,
      breakpoints: {}
    },
  })
  layout: {
    type: string;
    columns: number;
    rows?: number;
    gridTemplate?: string;
    breakpoints?: Record<string, any>;
  };

  @ApiProperty({
    description: 'Page settings',
    example: {
      background: { color: '#FFFFFF' },
      padding: { top: 20, right: 20, bottom: 20, left: 20 }
    },
  })
  pageSettings: {
    background?: {
      color?: string;
      image?: string;
      gradient?: any;
    };
    padding?: Record<string, number>;
    margin?: Record<string, number>;
  };

  @ApiProperty({
    description: 'Page interactions configuration',
    example: {
      navigation: {},
      animations: []
    },
  })
  interactions: {
    navigation?: any;
    animations?: any[];
    events?: Record<string, any>;
  };
}

export class PageStatsDto {
  @ApiProperty({ description: 'Total number of pages', example: 125 })
  totalPages: number;

  @ApiProperty({ description: 'Average components per page', example: 3.2 })
  averageComponentsPerPage: number;

  @ApiProperty({ 
    description: 'Most used layout types',
    example: [{ layoutType: 'FLEXIBLE', count: 45 }, { layoutType: 'GRID', count: 32 }],
  })
  topLayoutTypes: Array<{ layoutType: string; count: number }>;

  @ApiProperty({ 
    description: 'Page size distribution',
    example: { 
      '1920x1080': 85,
      '1366x768': 25,
      'custom': 15
    },
  })
  pageSizeDistribution: Record<string, number>;

  @ApiProperty({ 
    description: 'Pages per report statistics',
    example: { min: 1, max: 15, average: 8.3 },
  })
  pagesPerReport: {
    min: number;
    max: number;
    average: number;
  };
}