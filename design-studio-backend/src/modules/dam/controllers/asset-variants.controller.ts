import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AssetVariantService } from '../services/asset-variant.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('asset-variants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dam/assets/:assetId/variants')
export class AssetVariantsController {
  constructor(private readonly variantService: AssetVariantService) {}

  @Get()
  async getVariants(@Param('assetId') assetId: string) {
    return this.variantService.getAssetVariants(assetId);
  }

  @Post()
  async generateVariant(
    @Param('assetId') assetId: string,
    @Body() variantData: any,
  ) {
    return this.variantService.generateVariant(assetId, variantData);
  }
}