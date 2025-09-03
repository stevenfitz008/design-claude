import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AssetAnalyticsService } from '../services/asset-analytics.service';

@ApiTags('DAM - Asset Analytics')
@Controller('api/dam/analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssetAnalyticsController {
  constructor(private readonly assetAnalyticsService: AssetAnalyticsService) {}

  @Get('assets/:id')
  @ApiOperation({ summary: 'Get asset analytics' })
  @ApiResponse({ status: 200, description: 'Asset analytics retrieved successfully' })
  async getAssetAnalytics(
    @Param('id') assetId: string,
    @Query('period') period?: 'hour' | 'day' | 'week' | 'month'
  ) {
    return this.assetAnalyticsService.getAssetAnalytics(assetId, period);
  }
}