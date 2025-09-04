import { IsString, IsOptional, IsArray, IsBoolean, IsEnum, IsObject, IsInt, Min, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ComponentType, ExportFormat, ComponentTemplateDto, ComponentPropsSchemaDto, ComponentRenderingDto } from './create-component.dto';
import { ComponentType as PrismaComponentType } from '@prisma/client';

export class UpdateComponentDto {
  @ApiProperty({
    description: 'Component name',
    example: 'Updated Sales Chart',
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Component description',
    example: 'Updated interactive sales performance chart with new features',
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
    required: false,
  })
  @IsOptional()
  @IsEnum(PrismaComponentType)
  type?: ComponentType;

  @ApiProperty({
    description: 'Component category for organization',
    example: 'advanced-charts',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Component template definition',
    type: ComponentTemplateDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentTemplateDto)
  template?: ComponentTemplateDto;

  @ApiProperty({
    description: 'Component properties schema',
    type: ComponentPropsSchemaDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentPropsSchemaDto)
  propsSchema?: ComponentPropsSchemaDto;

  @ApiProperty({
    description: 'Rendering configuration',
    type: ComponentRenderingDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentRenderingDto)
  rendering?: ComponentRenderingDto;

  @ApiProperty({
    description: 'Default properties values',
    example: { title: 'Updated Chart Title', color: '#2C3E50' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  defaultProps?: Record<string, any>;

  @ApiProperty({
    description: 'Component tags for organization',
    example: ['business', 'analytics', 'interactive', 'updated'],
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
    description: 'Whether the component should be published',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Component version for optimistic concurrency control',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiProperty({
    description: 'Data binding configuration',
    example: {
      sources: ['api', 'database', 'websocket'],
      transformations: { aggregate: 'average' },
      validation: { required: ['value', 'timestamp'] }
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
      events: ['click', 'hover', 'doubleclick'],
      actions: { click: 'drillDown', hover: 'highlight', doubleclick: 'expand' }
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