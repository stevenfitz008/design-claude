import { IsString, IsOptional, IsInt, IsEnum, IsObject, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RenderFormat {
  HTML = 'HTML',
  PDF = 'PDF',
  PPTX = 'PPTX',
  SVG = 'SVG',
  PNG = 'PNG',
  JPEG = 'JPEG',
}

export class RenderOptionsDto {
  @ApiProperty({
    description: 'Render quality (1-100)',
    example: 90,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiProperty({
    description: 'Custom dimensions for rendering',
    example: { width: 1920, height: 1080 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  dimensions?: { width: number; height: number };

  @ApiProperty({
    description: 'Format-specific options',
    example: {
      pdf: { margins: { top: 20, bottom: 20, left: 20, right: 20 } },
      pptx: { masterSlide: 'corporate-template' },
      html: { includeInteractivity: true }
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  formatOptions?: Record<string, any>;

  @ApiProperty({
    description: 'Whether to include interactive elements',
    example: true,
    required: false,
  })
  @IsOptional()
  includeInteractivity?: boolean;

  @ApiProperty({
    description: 'Theme overrides for rendering',
    example: { primaryColor: '#FF5733', fontFamily: 'Arial' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  theme?: Record<string, any>;
}

export class RenderReportDto {
  @ApiProperty({
    description: 'Report ID to render',
    example: 'rep1a2b3c4d5e6f7g8h9',
  })
  @IsString()
  reportId: string;

  @ApiProperty({
    description: 'Render format',
    example: RenderFormat.PDF,
    enum: RenderFormat,
  })
  @IsEnum(RenderFormat)
  format: RenderFormat;

  @ApiProperty({
    description: 'Specific page IDs to include (empty means all pages)',
    example: ['page1a2b3c4d5e6f7g8h9', 'page2a2b3c4d5e6f7g8h9'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includePages?: string[];

  @ApiProperty({
    description: 'Rendering options',
    type: RenderOptionsDto,
    required: false,
  })
  @IsOptional()
  options?: RenderOptionsDto;

  @ApiProperty({
    description: 'Whether to use cached version if available',
    example: true,
    required: false,
  })
  @IsOptional()
  useCache?: boolean;
}

export class RenderPageDto {
  @ApiProperty({
    description: 'Page ID to render',
    example: 'page1a2b3c4d5e6f7g8h9',
  })
  @IsString()
  pageId: string;

  @ApiProperty({
    description: 'Render format',
    example: RenderFormat.HTML,
    enum: RenderFormat,
  })
  @IsEnum(RenderFormat)
  format: RenderFormat;

  @ApiProperty({
    description: 'Rendering options',
    type: RenderOptionsDto,
    required: false,
  })
  @IsOptional()
  options?: RenderOptionsDto;

  @ApiProperty({
    description: 'Whether to use cached version if available',
    example: true,
    required: false,
  })
  @IsOptional()
  useCache?: boolean;
}

export class RenderComponentDto {
  @ApiProperty({
    description: 'Component ID to render',
    example: 'comp1a2b3c4d5e6f7g8h9',
  })
  @IsString()
  componentId: string;

  @ApiProperty({
    description: 'Component version to render',
    example: 12,
  })
  @IsInt()
  @Min(1)
  componentVersion: number;

  @ApiProperty({
    description: 'Render format',
    example: RenderFormat.SVG,
    enum: RenderFormat,
  })
  @IsEnum(RenderFormat)
  format: RenderFormat;

  @ApiProperty({
    description: 'Component properties for rendering',
    example: { title: 'Sales Chart', color: '#3498DB', data: [1, 2, 3, 4, 5] },
  })
  @IsObject()
  props: Record<string, any>;

  @ApiProperty({
    description: 'Component dimensions',
    example: { width: 400, height: 300 },
  })
  @IsObject()
  dimensions: { width: number; height: number };

  @ApiProperty({
    description: 'Rendering options',
    type: RenderOptionsDto,
    required: false,
  })
  @IsOptional()
  options?: RenderOptionsDto;
}