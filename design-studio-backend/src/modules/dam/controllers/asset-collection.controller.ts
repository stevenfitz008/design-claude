import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AssetCollectionService } from '../services/asset-collection.service';

@ApiTags('DAM - Asset Collections')
@Controller('api/dam/collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssetCollectionController {
  constructor(private readonly assetCollectionService: AssetCollectionService) {}

  @Post()
  @ApiOperation({ summary: 'Create asset collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  async createCollection(
    @Request() req,
    @Body() createDto: { name: string; description?: string; color?: string; parentId?: string }
  ) {
    return this.assetCollectionService.createCollection(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user collections' })
  @ApiResponse({ status: 200, description: 'Collections retrieved successfully' })
  async getUserCollections(@Request() req) {
    return this.assetCollectionService.getUserCollections(req.user.id);
  }

  @Post(':id/assets/:assetId')
  @ApiOperation({ summary: 'Add asset to collection' })
  @ApiResponse({ status: 200, description: 'Asset added to collection successfully' })
  async addAssetToCollection(
    @Param('id') collectionId: string,
    @Param('assetId') assetId: string
  ) {
    return this.assetCollectionService.addAssetToCollection(collectionId, assetId);
  }
}