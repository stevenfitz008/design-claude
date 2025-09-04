import { ApiProperty } from '@nestjs/swagger';
import { ComponentType, ExportFormat } from './create-component.dto';
import { ComponentType as PrismaComponentType } from '@prisma/client';

export class ComponentTemplateResponseDto {
  @ApiProperty({ 
    description: 'HTML template', 
    example: '<div class="chart-container"><canvas id="chart"></canvas></div>',
    required: false,
  })
  html?: string;

  @ApiProperty({ 
    description: 'SVG template', 
    example: '<svg><rect width="100" height="100" fill="blue"/></svg>',
    required: false,
  })
  svg?: string;

  @ApiProperty({ 
    description: 'Canvas elements', 
    example: [{ type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: 'blue' }],
    required: false,
  })
  canvas?: any[];

  @ApiProperty({ 
    description: 'CSS styles', 
    example: { '.chart-container': { width: '100%', height: '300px' } }
  })
  styles: Record<string, any>;
}

export class ComponentPropsSchemaResponseDto {
  @ApiProperty({
    description: 'Property definitions',
    example: {
      title: { type: 'string', default: 'Chart Title', required: true },
      color: { type: 'string', default: '#FF5733', options: ['#FF5733', '#3498DB'] }
    },
  })
  properties: Record<string, {
    type: string;
    default?: any;
    required?: boolean;
    description?: string;
    options?: any[];
  }>;

  @ApiProperty({
    description: 'Required property names',
    example: ['title'],
  })
  required: string[];
}

export class ComponentRenderingResponseDto {
  @ApiProperty({
    description: 'Supported export formats',
    example: ['PNG', 'PDF'],
    enum: ExportFormat,
    isArray: true,
  })
  supportedFormats: ExportFormat[];

  @ApiProperty({
    description: 'Component dependencies',
    example: ['chart.js', 'lodash'],
    required: false,
  })
  dependencies?: string[];

  @ApiProperty({
    description: 'Performance characteristics',
    example: {
      complexity: 'medium',
      estimatedRenderTime: 500,
      memoryUsage: 1024
    },
  })
  performance: {
    complexity: 'low' | 'medium' | 'high';
    estimatedRenderTime: number;
    memoryUsage: number;
  };
}

export class ComponentDto {
  @ApiProperty({ description: 'Component ID', example: 'comp1a2b3c4d5e6f7g8h9' })
  id: string;

  @ApiProperty({ description: 'Component name', example: 'Sales Chart' })
  name: string;

  @ApiProperty({ 
    description: 'Component description', 
    example: 'Interactive sales performance chart',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Component type', example: 'CHART', enum: PrismaComponentType })
  type: ComponentType;

  @ApiProperty({ description: 'Component category', example: 'charts' })
  category: string;

  @ApiProperty({ description: 'MongoDB definition ID', example: '507f1f77bcf86cd799439011' })
  definitionId: string;

  @ApiProperty({ description: 'Default properties', example: { title: 'Chart Title' } })
  defaultProps: Record<string, any>;

  @ApiProperty({ description: 'Supported formats', example: ['PNG', 'PDF'], enum: ExportFormat, isArray: true })
  supportedFormats: ExportFormat[];

  @ApiProperty({ description: 'Component version', example: 1 })
  version: number;

  @ApiProperty({ description: 'Is published', example: true })
  isPublished: boolean;

  @ApiProperty({ description: 'Component tags', example: ['business', 'analytics'] })
  tags: string[];

  @ApiProperty({ description: 'Is system component', example: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Usage count', example: 25 })
  usageCount: number;

  @ApiProperty({ description: 'Created by user ID', example: 'user1a2b3c4d5e6f7g8h9' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class ComponentWithDefinitionDto extends ComponentDto {
  @ApiProperty({ description: 'Component template', type: ComponentTemplateResponseDto })
  template: ComponentTemplateResponseDto;

  @ApiProperty({ description: 'Properties schema', type: ComponentPropsSchemaResponseDto })
  propsSchema: ComponentPropsSchemaResponseDto;

  @ApiProperty({ description: 'Rendering config', type: ComponentRenderingResponseDto })
  rendering: ComponentRenderingResponseDto;

  @ApiProperty({
    description: 'Data binding configuration',
    example: {
      sources: ['api', 'database'],
      transformations: { aggregate: 'sum' },
      validation: { required: ['value'] }
    },
    required: false,
  })
  dataBinding?: {
    sources: string[];
    transformations: Record<string, any>;
    validation: Record<string, any>;
  };

  @ApiProperty({
    description: 'Interaction capabilities',
    example: {
      events: ['click', 'hover'],
      actions: { click: 'drillDown', hover: 'highlight' }
    },
    required: false,
  })
  interactions?: {
    events: string[];
    actions: Record<string, any>;
  };
}

export class ComponentVersionDto {
  @ApiProperty({ description: 'Version ID', example: 'ver1a2b3c4d5e6f7g8h9' })
  id: string;

  @ApiProperty({ description: 'Component ID', example: 'comp1a2b3c4d5e6f7g8h9' })
  componentId: string;

  @ApiProperty({ description: 'Version number', example: 3 })
  version: number;

  @ApiProperty({ description: 'MongoDB definition ID', example: '507f1f77bcf86cd799439012' })
  definitionId: string;

  @ApiProperty({ description: 'Change log', example: 'Added new chart types and improved performance', required: false })
  changeLog?: string;

  @ApiProperty({ description: 'Version-specific properties', example: { newFeature: true } })
  props: Record<string, any>;

  @ApiProperty({ description: 'Is stable version', example: true })
  isStable: boolean;

  @ApiProperty({ description: 'Is deprecated', example: false })
  isDeprecated: boolean;

  @ApiProperty({ description: 'Minimum app version', example: '2.1.0', required: false })
  minVersion?: string;

  @ApiProperty({ description: 'Maximum app version', example: '3.0.0', required: false })
  maxVersion?: string;

  @ApiProperty({ description: 'Created by user ID', example: 'user1a2b3c4d5e6f7g8h9' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

export class ComponentVersionWithDefinitionDto extends ComponentVersionDto {
  @ApiProperty({ description: 'Component definition', type: ComponentWithDefinitionDto })
  definition: ComponentWithDefinitionDto;
}

export class ComponentUsageStatsDto {
  @ApiProperty({ description: 'Component ID', example: 'comp1a2b3c4d5e6f7g8h9' })
  componentId: string;

  @ApiProperty({ description: 'Total usage count', example: 156 })
  totalUsage: number;

  @ApiProperty({ description: 'Usage in pages', example: 89 })
  pagesUsed: number;

  @ApiProperty({ description: 'Usage in reports', example: 34 })
  reportsUsed: number;

  @ApiProperty({ description: 'Unique users', example: 12 })
  uniqueUsers: number;

  @ApiProperty({ 
    description: 'Usage by version',
    example: [
      { version: 1, count: 45 },
      { version: 2, count: 89 },
      { version: 3, count: 22 }
    ]
  })
  usageByVersion: Array<{ version: number; count: number }>;

  @ApiProperty({
    description: 'Recent usage trend (last 30 days)',
    example: [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-02', count: 8 },
    ]
  })
  recentUsage: Array<{ date: string; count: number }>;

  @ApiProperty({ description: 'Last used timestamp', example: '2024-01-15T10:30:00.000Z' })
  lastUsedAt: string;
}

export class ComponentStatsDto {
  @ApiProperty({ description: 'Total components', example: 125 })
  totalComponents: number;

  @ApiProperty({ description: 'Published components', example: 89 })
  publishedComponents: number;

  @ApiProperty({ description: 'System components', example: 15 })
  systemComponents: number;

  @ApiProperty({ description: 'User components', example: 110 })
  userComponents: number;

  @ApiProperty({ 
    description: 'Components by type',
    example: [
      { type: 'CHART', count: 45 },
      { type: 'TEXT', count: 32 },
      { type: 'TABLE', count: 18 }
    ],
  })
  componentsByType: Array<{ type: ComponentType; count: number }>;

  @ApiProperty({ 
    description: 'Most popular components',
    example: [
      { id: 'comp1', name: 'Sales Chart', usageCount: 156 },
      { id: 'comp2', name: 'Revenue Table', usageCount: 89 }
    ],
  })
  mostPopular: Array<{ id: string; name: string; usageCount: number }>;

  @ApiProperty({ 
    description: 'Components by category',
    example: [
      { category: 'charts', count: 45 },
      { category: 'tables', count: 18 }
    ],
  })
  componentsByCategory: Array<{ category: string; count: number }>;

  @ApiProperty({ description: 'Average usage per component', example: 12.4 })
  averageUsagePerComponent: number;

  @ApiProperty({ description: 'Total component versions', example: 387 })
  totalVersions: number;

  @ApiProperty({ description: 'Average versions per component', example: 3.1 })
  averageVersionsPerComponent: number;
}