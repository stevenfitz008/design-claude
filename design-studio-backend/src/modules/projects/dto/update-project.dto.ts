import { IsString, IsOptional, IsArray, IsBoolean, MaxLength, MinLength, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Updated project name',
    example: 'My Updated Design',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(100, { message: 'Project name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated project description',
    example: 'An updated description for my design',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated project tags',
    example: ['design', 'updated', 'portfolio'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Update public visibility',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Canvas data (elements, layers, settings)',
    example: {
      elements: [],
      layers: [],
      timeline: {},
      viewport: { zoom: 1, panX: 0, panY: 0 },
      settings: {}
    },
  })
  @IsOptional()
  @IsObject()
  canvasData?: {
    elements?: any[];
    layers?: any[];
    timeline?: any;
    viewport?: any;
    settings?: any;
    backgroundColor?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };

  @ApiPropertyOptional({
    description: 'Project thumbnail URL',
    example: 'https://cdn.example.com/thumbnails/project-123.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;
}