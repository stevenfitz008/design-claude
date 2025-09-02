import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserPlan } from '@prisma/client';

export class ProjectOwnerDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'User subscription plan', enum: UserPlan })
  plan: UserPlan;
}

export class ProjectResponseDto {
  @ApiProperty({ description: 'Project ID' })
  id: string;

  @ApiProperty({ description: 'Project name' })
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Project thumbnail URL' })
  thumbnail?: string;

  @ApiProperty({ description: 'Canvas width in pixels' })
  canvasWidth: number;

  @ApiProperty({ description: 'Canvas height in pixels' })
  canvasHeight: number;

  @ApiPropertyOptional({ description: 'MongoDB document ID for canvas data' })
  canvasDocumentId?: string;

  @ApiProperty({ description: 'Public visibility status' })
  isPublic: boolean;

  @ApiProperty({ description: 'Template status' })
  isTemplate: boolean;

  @ApiProperty({ description: 'Project tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Project version number' })
  version: number;

  @ApiProperty({ description: 'Project creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last opened date' })
  lastOpenedAt?: Date;

  @ApiProperty({ description: 'Project owner information' })
  user: ProjectOwnerDto;
}

export class ProjectWithCanvasDto extends ProjectResponseDto {
  @ApiPropertyOptional({
    description: 'Canvas data (elements, layers, timeline, etc.)',
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

export class ProjectStatsDto {
  @ApiProperty({ description: 'Total projects count' })
  totalProjects: number;

  @ApiProperty({ description: 'Public projects count' })
  publicProjects: number;

  @ApiProperty({ description: 'Private projects count' })
  privateProjects: number;

  @ApiProperty({ description: 'Template projects count' })
  templateProjects: number;

  @ApiProperty({ description: 'Storage used in bytes' })
  storageUsed: number;

  @ApiProperty({ description: 'Storage limit in bytes' })
  storageLimit: number;
}