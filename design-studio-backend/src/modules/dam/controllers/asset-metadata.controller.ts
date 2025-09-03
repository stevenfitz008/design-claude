import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AssetMetadataService } from '../services/asset-metadata.service';

@ApiTags('DAM - Asset Metadata')
@Controller('api/dam/assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssetMetadataController {
  constructor(private readonly assetMetadataService: AssetMetadataService) {}

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get asset metadata' })
  @ApiResponse({ status: 200, description: 'Asset metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getAssetMetadata(@Param('id') assetId: string) {
    return this.assetMetadataService.getAssetMetadata(assetId);
  }
}