import { IsString, IsOptional, IsArray, IsBoolean, IsEnum, IsObject, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExportFormat, ComponentType as PrismaComponentType } from '@prisma/client';

// Re-export for use in other files
export { ExportFormat };
export type ComponentType = PrismaComponentType;



export class ComponentTemplateDto {
  @ApiProperty({
    description: 'HTML template for web rendering',
    example: '<div class="chart-container"><canvas id="chart"></canvas></div>',
    required: false,
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiProperty({
    description: 'SVG template for vector rendering',
    example: '<svg><rect width="100" height="100" fill="blue"/></svg>',
    required: false,
  })
  @IsOptional()
  @IsString()
  svg?: string;

  @ApiProperty({
    description: 'Canvas elements for Konva.js rendering',
    example: [
      {
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: 'blue'
      }
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  canvas?: any[];

  @ApiProperty({
    description: 'CSS styles for the component',
    example: { '.chart-container': { width: '100%', height: '300px' } },
  })
  @IsObject()
  styles: Record<string, any>;
}

export class ComponentPropsSchemaDto {
  @ApiProperty({
    description: 'Property definitions',
    example: {
      title: { type: 'string', default: 'Chart Title', required: true },
      color: { type: 'string', default: '#FF5733', options: ['#FF5733', '#3498DB'] }
    },
  })
  @IsObject()
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
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  required: string[];
}

export class ComponentRenderingDto {
  @ApiProperty({
    description: 'Supported export formats',
    example: [ExportFormat.PNG, ExportFormat.PDF],
    enum: ExportFormat,
    isArray: true,
  })
  @IsArray()
  @IsEnum(ExportFormat, { each: true })
  supportedFormats: ExportFormat[];

  @ApiProperty({
    description: 'Component dependencies (libraries, other components)',
    example: ['chart.js', 'lodash'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @ApiProperty({
    description: 'Performance characteristics',
    example: {
      complexity: 'medium',
      estimatedRenderTime: 500,
      memoryUsage: 1024
    },
  })
  @IsObject()
  performance: {
    complexity: 'low' | 'medium' | 'high';
    estimatedRenderTime: number;
    memoryUsage: number;
  };
}

export class CreateComponentDto {
  @ApiProperty({
    description: 'Component name',
    example: 'Sales Chart',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Component description',
    example: 'Interactive sales performance chart with drill-down capabilities',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Component type',
    example: 'CHART',
    enum: PrismaComponentType,
  })
  @IsEnum(PrismaComponentType)
  type: ComponentType;

  @ApiProperty({
    description: 'Component category for organization',
    example: 'charts',
  })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({
    description: 'Component template definition',
    type: ComponentTemplateDto,
  })
  @ValidateNested()
  @Type(() => ComponentTemplateDto)
  template: ComponentTemplateDto;

  @ApiProperty({
    description: 'Component properties schema',
    type: ComponentPropsSchemaDto,
  })
  @ValidateNested()
  @Type(() => ComponentPropsSchemaDto)
  propsSchema: ComponentPropsSchemaDto;

  @ApiProperty({
    description: 'Rendering configuration',
    type: ComponentRenderingDto,
  })
  @ValidateNested()
  @Type(() => ComponentRenderingDto)
  rendering: ComponentRenderingDto;

  @ApiProperty({
    description: 'Default properties values',
    example: { title: 'Default Chart Title', color: '#3498DB' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  defaultProps?: Record<string, any>;

  @ApiProperty({
    description: 'Component tags for organization',
    example: ['business', 'analytics', 'interactive'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Whether this is a system component (non-editable)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({
    description: 'Whether the component should be published immediately',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Data binding configuration',
    example: {
      sources: ['api', 'database'],
      transformations: { aggregate: 'sum' },
      validation: { required: ['value'] }
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
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
  @IsOptional()
  @IsObject()
  interactions?: {
    events: string[];
    actions: Record<string, any>;
  };
}