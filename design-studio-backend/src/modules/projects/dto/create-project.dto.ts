import { IsString, IsOptional, IsInt, Min, Max, IsArray, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'My Amazing Design',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1, { message: 'Project name is required' })
  @MaxLength(100, { message: 'Project name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'A beautiful design for my portfolio',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Canvas width in pixels',
    example: 1920,
    minimum: 100,
    maximum: 10000,
    default: 1920,
  })
  @IsOptional()
  @IsInt()
  @Min(100, { message: 'Canvas width must be at least 100 pixels' })
  @Max(10000, { message: 'Canvas width must not exceed 10000 pixels' })
  canvasWidth?: number = 1920;

  @ApiPropertyOptional({
    description: 'Canvas height in pixels',
    example: 1080,
    minimum: 100,
    maximum: 10000,
    default: 1080,
  })
  @IsOptional()
  @IsInt()
  @Min(100, { message: 'Canvas height must be at least 100 pixels' })
  @Max(10000, { message: 'Canvas height must not exceed 10000 pixels' })
  canvasHeight?: number = 1080;

  @ApiPropertyOptional({
    description: 'Project tags for organization',
    example: ['design', 'portfolio', 'creative'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Make project publicly visible',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @ApiPropertyOptional({
    description: 'Template ID to start from (optional)',
    example: 'clr1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  templateId?: string;
}