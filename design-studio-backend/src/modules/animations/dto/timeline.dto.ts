import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out',
  CUBIC_BEZIER = 'cubic-bezier',
}

export class KeyframeDto {
  @ApiProperty({ description: 'Keyframe ID' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Time position in seconds', minimum: 0, maximum: 30 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(30)
  time: number;

  @ApiProperty({ description: 'Keyframe value (can be any animatable property)' })
  @IsNotEmpty()
  value: any;

  @ApiProperty({ description: 'Easing curve type', enum: EasingType })
  @IsOptional()
  @IsEnum(EasingType)
  easing?: EasingType;

  @ApiProperty({ description: 'Custom cubic bezier values for easing', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  easingParams?: number[];
}

export class TimelineTrackDto {
  @ApiProperty({ description: 'Track ID' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Track name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Target element ID' })
  @IsNotEmpty()
  @IsString()
  targetId: string;

  @ApiProperty({ description: 'Animation property (e.g., x, y, rotation, opacity)' })
  @IsNotEmpty()
  @IsString()
  property: string;

  @ApiProperty({ description: 'Track keyframes', type: [KeyframeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyframeDto)
  keyframes: KeyframeDto[];

  @ApiProperty({ description: 'Track enabled state', default: true })
  @IsOptional()
  enabled?: boolean;
}

export class TimelineDto {
  @ApiProperty({ description: 'Timeline ID' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Timeline name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Timeline duration in seconds', minimum: 0.1, maximum: 30 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.1)
  @Max(30)
  duration: number;

  @ApiProperty({ description: 'Timeline tracks', type: [TimelineTrackDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineTrackDto)
  tracks: TimelineTrackDto[];

  @ApiProperty({ description: 'Timeline frame rate', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  frameRate?: number;

  @ApiProperty({ description: 'Loop animation', default: false })
  @IsOptional()
  loop?: boolean;

  @ApiProperty({ description: 'Auto-play animation', default: false })
  @IsOptional()
  autoPlay?: boolean;
}

export class CreateTimelineDto {
  @ApiProperty({ description: 'Project ID this timeline belongs to' })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Timeline name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Timeline duration in seconds', minimum: 0.1, maximum: 30 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.1)
  @Max(30)
  duration: number;

  @ApiProperty({ description: 'Timeline frame rate', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  frameRate?: number;

  @ApiProperty({ description: 'Loop animation', default: false })
  @IsOptional()
  loop?: boolean;

  @ApiProperty({ description: 'Auto-play animation', default: false })
  @IsOptional()
  autoPlay?: boolean;
}

export class UpdateTimelineDto {
  @ApiProperty({ description: 'Timeline name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Timeline duration in seconds', minimum: 0.1, maximum: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(30)
  duration?: number;

  @ApiProperty({ description: 'Timeline frame rate' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  frameRate?: number;

  @ApiProperty({ description: 'Loop animation' })
  @IsOptional()
  loop?: boolean;

  @ApiProperty({ description: 'Auto-play animation' })
  @IsOptional()
  autoPlay?: boolean;

  @ApiProperty({ description: 'Timeline tracks', type: [TimelineTrackDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineTrackDto)
  tracks?: TimelineTrackDto[];
}

export class TimelineResponseDto {
  @ApiProperty({ description: 'Timeline data' })
  timeline: TimelineDto;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}