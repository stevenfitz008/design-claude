import { IsString, IsOptional, IsArray, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({
    description: 'Report title',
    example: 'Q4 2024 Sales Report',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Report description',
    example: 'Quarterly sales analysis with performance metrics and forecasts',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Report author name',
    example: 'John Smith',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  author: string;

  @ApiProperty({
    description: 'Report tags for organization',
    example: ['sales', 'quarterly', 'analysis'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Report category',
    example: 'business-report',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Whether the report should be published immediately',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Whether the report should be publicly accessible',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}