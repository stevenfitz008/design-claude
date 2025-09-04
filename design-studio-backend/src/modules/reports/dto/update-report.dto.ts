import { PartialType } from '@nestjs/swagger';
import { CreateReportDto } from './create-report.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @ApiProperty({
    description: 'Report version (for optimistic concurrency control)',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}