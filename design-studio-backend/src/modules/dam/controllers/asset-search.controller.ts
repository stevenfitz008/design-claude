import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AssetSearchService, SearchFilters } from '../services/asset-search.service';

@ApiTags('DAM - Asset Search')
@Controller('api/dam/search')
export class AssetSearchController {
  constructor(private readonly assetSearchService: AssetSearchService) {}

  @Get('assets')
  @ApiOperation({ summary: 'Search assets with advanced filters' })
  @ApiQuery({ name: 'query', required: false, description: 'Text search query' })
  @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated tags' })
  @ApiQuery({ name: 'categories', required: false, description: 'Comma-separated categories' })
  @ApiQuery({ name: 'formats', required: false, description: 'Comma-separated file formats' })
  @ApiQuery({ name: 'colors', required: false, description: 'Comma-separated hex colors' })
  @ApiQuery({ name: 'orientation', required: false, enum: ['landscape', 'portrait', 'square'], description: 'Image orientation' })
  @ApiQuery({ name: 'hasTransparency', required: false, type: Boolean, description: 'Filter by transparency' })
  @ApiQuery({ name: 'minWidth', required: false, type: Number, description: 'Minimum width in pixels' })
  @ApiQuery({ name: 'maxWidth', required: false, type: Number, description: 'Maximum width in pixels' })
  @ApiQuery({ name: 'minHeight', required: false, type: Number, description: 'Minimum height in pixels' })
  @ApiQuery({ name: 'maxHeight', required: false, type: Number, description: 'Maximum height in pixels' })
  @ApiQuery({ name: 'minFileSize', required: false, type: Number, description: 'Minimum file size in bytes' })
  @ApiQuery({ name: 'maxFileSize', required: false, type: Number, description: 'Maximum file size in bytes' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'collections', required: false, description: 'Comma-separated collection IDs' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['relevance', 'date', 'popularity', 'fileSize', 'dimensions'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchAssets(
    @Request() req,
    @Query('query') query?: string,
    @Query('tags') tags?: string,
    @Query('categories') categories?: string,
    @Query('formats') formats?: string,
    @Query('colors') colors?: string,
    @Query('orientation') orientation?: 'landscape' | 'portrait' | 'square',
    @Query('hasTransparency') hasTransparency?: boolean,
    @Query('minWidth', new ParseIntPipe({ optional: true })) minWidth?: number,
    @Query('maxWidth', new ParseIntPipe({ optional: true })) maxWidth?: number,
    @Query('minHeight', new ParseIntPipe({ optional: true })) minHeight?: number,
    @Query('maxHeight', new ParseIntPipe({ optional: true })) maxHeight?: number,
    @Query('minFileSize', new ParseIntPipe({ optional: true })) minFileSize?: number,
    @Query('maxFileSize', new ParseIntPipe({ optional: true })) maxFileSize?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('collections') collections?: string,
    @Query('sortBy') sortBy?: 'relevance' | 'date' | 'popularity' | 'fileSize' | 'dimensions',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    const filters: SearchFilters = {
      query,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      categories: categories ? categories.split(',').map(c => c.trim()) : undefined,
      formats: formats ? formats.split(',').map(f => f.trim()) : undefined,
      colors: colors ? colors.split(',').map(c => c.trim()) : undefined,
      orientation,
      hasTransparency,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      minFileSize,
      maxFileSize,
      dateRange: dateFrom && dateTo ? {
        from: new Date(dateFrom),
        to: new Date(dateTo),
      } : undefined,
      collections: collections ? collections.split(',').map(c => c.trim()) : undefined,
      sortBy,
      sortOrder,
      page,
      limit,
      userId: req?.user?.id, // Optional for public search
    };

    return this.assetSearchService.searchAssets(filters, req?.user?.id);
  }

  @Get('assets/public')
  @ApiOperation({ summary: 'Search public assets only' })
  @ApiResponse({ status: 200, description: 'Public search results retrieved successfully' })
  async searchPublicAssets(
    @Query('query') query?: string,
    @Query('tags') tags?: string,
    @Query('categories') categories?: string,
    @Query('formats') formats?: string,
    @Query('colors') colors?: string,
    @Query('orientation') orientation?: 'landscape' | 'portrait' | 'square',
    @Query('hasTransparency') hasTransparency?: boolean,
    @Query('minWidth', new ParseIntPipe({ optional: true })) minWidth?: number,
    @Query('maxWidth', new ParseIntPipe({ optional: true })) maxWidth?: number,
    @Query('minHeight', new ParseIntPipe({ optional: true })) minHeight?: number,
    @Query('maxHeight', new ParseIntPipe({ optional: true })) maxHeight?: number,
    @Query('minFileSize', new ParseIntPipe({ optional: true })) minFileSize?: number,
    @Query('maxFileSize', new ParseIntPipe({ optional: true })) maxFileSize?: number,
    @Query('sortBy') sortBy?: 'relevance' | 'date' | 'popularity' | 'fileSize' | 'dimensions',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    const filters: SearchFilters = {
      query,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      categories: categories ? categories.split(',').map(c => c.trim()) : undefined,
      formats: formats ? formats.split(',').map(f => f.trim()) : undefined,
      colors: colors ? colors.split(',').map(c => c.trim()) : undefined,
      orientation,
      hasTransparency,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      minFileSize,
      maxFileSize,
      sortBy,
      sortOrder,
      page,
      limit,
      isPublic: true,
    };

    return this.assetSearchService.searchAssets(filters);
  }

  @Get('assets/:id/similar')
  @ApiOperation({ summary: 'Find similar assets based on visual features' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of similar assets to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Similar assets retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findSimilarAssets(
    @Param('id') assetId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    return this.assetSearchService.findSimilarAssets(assetId, limit);
  }

  @Post('assets/:id/track-usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track asset usage for search ranking' })
  @ApiResponse({ status: 200, description: 'Usage tracked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async trackAssetUsage(
    @Param('id') assetId: string,
    @Body() trackingDto: { action: 'view' | 'download' | 'like' | 'share' }
  ) {
    await this.assetSearchService.updateUsageStats(assetId, trackingDto.action);
    return { success: true };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiQuery({ name: 'query', required: true, description: 'Partial search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of suggestions (default: 10)' })
  @ApiResponse({ status: 200, description: 'Search suggestions retrieved successfully' })
  async getSearchSuggestions(
    @Request() req,
    @Query('query') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    const filters: SearchFilters = { query, limit };
    const result = await this.assetSearchService.searchAssets(filters, req?.user?.id);
    return {
      suggestions: result.suggestions,
    };
  }

  @Get('facets')
  @ApiOperation({ summary: 'Get search facets for filtering UI' })
  @ApiResponse({ status: 200, description: 'Search facets retrieved successfully' })
  async getSearchFacets(@Request() req) {
    const filters: SearchFilters = { userId: req?.user?.id };
    const result = await this.assetSearchService.searchAssets(filters, req?.user?.id);
    return {
      facets: result.aggregations,
    };
  }
}

// DTOs for API documentation
export class TrackUsageDto {
  action: 'view' | 'download' | 'like' | 'share';
}