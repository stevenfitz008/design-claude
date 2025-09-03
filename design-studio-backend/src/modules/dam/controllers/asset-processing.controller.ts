import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AssetProcessingService } from '../services/asset-processing.service';

@ApiTags('DAM - Asset Processing')
@Controller('api/dam/processing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssetProcessingController {
  constructor(private readonly assetProcessingService: AssetProcessingService) {}

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get processing job status' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully' })
  async getJobStatus(@Param('id') jobId: string) {
    return this.assetProcessingService.getJobStatus(jobId);
  }
}