import { IsOptional, IsString, IsInt, Min, Max, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { ComponentType, ExportFormat } from './create-component.dto';
import { ComponentType as PrismaComponentType } from '@prisma/client';

export class ComponentQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search components by name or description',
    example: 'chart',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by component type',
    example: 'CHART',
    enum: PrismaComponentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(PrismaComponentType)
  type?: ComponentType;

  @ApiProperty({
    description: 'Filter by component category',
    example: 'charts',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Filter by tags (comma-separated)',
    example: 'business,analytics',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value ? value.split(',').map((tag: string) => tag.trim()) : undefined)
  tags?: string[];

  @ApiProperty({
    description: 'Filter by published status',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Filter by system components',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({
    description: 'Filter by supported export format',
    example: ExportFormat.PDF,
    enum: ExportFormat,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  supportedFormat?: ExportFormat;

  @ApiProperty({
    description: 'Filter by minimum usage count',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minUsageCount?: number;

  @ApiProperty({
    description: 'Filter by maximum usage count',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxUsageCount?: number;

  @ApiProperty({
    description: 'Filter components created by specific user',
    example: 'user1a2b3c4d5e6f7g8h9',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    description: 'Sort field',
    example: 'name',
    enum: ['name', 'createdAt', 'updatedAt', 'usageCount', 'version'],
    required: false,
    default: 'name',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'version' = 'name';

  @ApiProperty({
    description: 'Sort direction',
    example: 'asc',
    enum: ['asc', 'desc'],
    required: false,
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiProperty({
    description: 'Include full component definition in response',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  includeDefinition?: boolean = false;
}

export class ComponentVersionQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by stable versions only',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  isStable?: boolean;

  @ApiProperty({
    description: 'Exclude deprecated versions',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  excludeDeprecated?: boolean = true;

  @ApiProperty({
    description: 'Filter by minimum version number',
    example: 2,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minVersion?: number;

  @ApiProperty({
    description: 'Filter by maximum version number',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxVersion?: number;

  @ApiProperty({
    description: 'Filter versions created by specific user',
    example: 'user1a2b3c4d5e6f7g8h9',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    description: 'Sort field',
    example: 'version',
    enum: ['version', 'createdAt', 'isStable'],
    required: false,
    default: 'version',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'version' | 'createdAt' | 'isStable' = 'version';

  @ApiProperty({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Include full component definition in response',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  @IsBoolean()
  includeDefinition?: boolean = false;
}