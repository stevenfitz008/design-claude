import { ApiProperty } from '@nestjs/swagger';

export enum RenderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CACHED = 'CACHED',
}

export class RenderJobDto {
  @ApiProperty({ description: 'Render job ID', example: 'rjob1a2b3c4d5e6f7g8h9' })
  id: string;

  @ApiProperty({ description: 'Report ID', example: 'rep1a2b3c4d5e6f7g8h9' })
  reportId?: string;

  @ApiProperty({ description: 'Page ID', example: 'page1a2b3c4d5e6f7g8h9' })
  pageId?: string;

  @ApiProperty({ description: 'Component ID', example: 'comp1a2b3c4d5e6f7g8h9' })
  componentId?: string;

  @ApiProperty({ description: 'Render format', example: 'PDF' })
  format: string;

  @ApiProperty({ description: 'Job status', enum: RenderStatus, example: RenderStatus.PROCESSING })
  status: RenderStatus;

  @ApiProperty({ description: 'Render progress (0-100)', example: 75 })
  progress: number;

  @ApiProperty({ 
    description: 'Rendered content URL (available when completed)', 
    example: 'https://cdn.example.com/renders/report-123.pdf',
    required: false,
  })
  outputUrl?: string;

  @ApiProperty({ 
    description: 'File size in bytes', 
    example: 1048576,
    required: false,
  })
  fileSize?: number;

  @ApiProperty({ 
    description: 'Error message if failed', 
    example: 'Component rendering failed: Invalid data format',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({ 
    description: 'Rendering configuration used',
    example: {
      quality: 90,
      dimensions: { width: 1920, height: 1080 },
      options: { pdf: { margins: { top: 20 } } }
    },
  })
  config: {
    quality: number;
    dimensions?: { width: number; height: number };
    options: Record<string, any>;
  };

  @ApiProperty({ 
    description: 'Rendering metrics',
    example: {
      totalPages: 5,
      totalComponents: 15,
      renderTime: 8500,
      dependencies: ['chart.js', 'lodash']
    },
  })
  metadata: {
    totalPages?: number;
    totalComponents?: number;
    renderTime?: number;
    dependencies?: string[];
    cacheHit?: boolean;
  };

  @ApiProperty({ description: 'Job creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ 
    description: 'Job completion timestamp', 
    example: '2024-01-15T10:30:08.500Z',
    required: false,
  })
  completedAt?: string;

  @ApiProperty({ 
    description: 'Job expiration timestamp', 
    example: '2024-01-16T10:30:00.000Z',
    required: false,
  })
  expiresAt?: string;
}

export class RenderPreviewDto {
  @ApiProperty({ description: 'Preview image URL', example: 'https://cdn.example.com/previews/report-123-thumb.png' })
  thumbnailUrl: string;

  @ApiProperty({ description: 'Preview dimensions', example: { width: 300, height: 200 } })
  dimensions: { width: number; height: number };

  @ApiProperty({ 
    description: 'Preview metadata',
    example: {
      pages: 5,
      generatedAt: '2024-01-15T10:30:00.000Z',
      quality: 'medium'
    },
  })
  metadata: {
    pages?: number;
    generatedAt: string;
    quality: string;
    format?: string;
  };
}

export class RenderCapabilitiesDto {
  @ApiProperty({ 
    description: 'Supported formats for this content type',
    example: ['HTML', 'PDF', 'PPTX', 'SVG'],
    type: [String],
  })
  supportedFormats: string[];

  @ApiProperty({ 
    description: 'Format-specific capabilities',
    example: {
      PDF: {
        maxPages: 50,
        maxFileSize: 10485760,
        supportedFeatures: ['text', 'images', 'charts']
      },
      PPTX: {
        maxSlides: 100,
        maxFileSize: 52428800,
        supportedFeatures: ['animations', 'transitions']
      }
    },
  })
  formatCapabilities: Record<string, {
    maxPages?: number;
    maxSlides?: number;
    maxFileSize?: number;
    supportedFeatures: string[];
    limitations?: string[];
  }>;

  @ApiProperty({ 
    description: 'Estimated render times by format (in milliseconds)',
    example: { HTML: 500, PDF: 2000, PPTX: 5000 },
  })
  estimatedRenderTimes: Record<string, number>;

  @ApiProperty({ 
    description: 'Maximum concurrent renders allowed',
    example: 5,
  })
  maxConcurrentRenders: number;
}

export class BatchRenderJobDto {
  @ApiProperty({ description: 'Batch job ID', example: 'batch1a2b3c4d5e6f7g8h9' })
  batchId: string;

  @ApiProperty({ description: 'Individual render jobs in this batch', type: [RenderJobDto] })
  jobs: RenderJobDto[];

  @ApiProperty({ description: 'Overall batch status', enum: RenderStatus })
  status: RenderStatus;

  @ApiProperty({ description: 'Batch progress (0-100)', example: 60 })
  progress: number;

  @ApiProperty({ 
    description: 'Batch completion statistics',
    example: { completed: 3, failed: 1, pending: 2, total: 6 },
  })
  stats: {
    completed: number;
    failed: number;
    pending: number;
    total: number;
  };

  @ApiProperty({ description: 'Batch creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ 
    description: 'Estimated completion time', 
    example: '2024-01-15T10:35:00.000Z',
    required: false,
  })
  estimatedCompletionAt?: string;
}