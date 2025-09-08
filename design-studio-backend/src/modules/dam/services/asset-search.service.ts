import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  AssetSearchIndex, 
  AssetSearchIndexType 
} from '../../../database/mongodb/schemas';

export interface SearchFilters {
  query?: string;
  tags?: string[];
  categories?: string[];
  formats?: string[];
  colors?: string[];
  orientation?: 'landscape' | 'portrait' | 'square';
  hasTransparency?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minFileSize?: number;
  maxFileSize?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  userId?: string;
  isPublic?: boolean;
  collections?: string[];
  sortBy?: 'relevance' | 'date' | 'popularity' | 'fileSize' | 'dimensions';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  assets: Array<{
    assetId: string;
    score: number;
    asset: any;
    metadata: any;
    searchIndex: any;
    highlights?: string[];
  }>;
  total: number;
  page: number;
  limit: number;
  aggregations: {
    formats: { format: string; count: number }[];
    colors: { color: string; count: number }[];
    orientations: { orientation: string; count: number }[];
    categories: { category: string; count: number }[];
    fileSizeRanges: { range: string; count: number }[];
  };
  suggestions: string[];
}

@Injectable()
export class AssetSearchService {
  private readonly logger = new Logger(AssetSearchService.name);

  constructor(
    private prisma: PrismaService,
    @InjectModel(AssetSearchIndex.name)
    private assetSearchIndexModel: Model<AssetSearchIndexType>,
  ) {}

  /**
   * Search assets with comprehensive filtering and ranking
   */
  async searchAssets(filters: SearchFilters, userId?: string): Promise<SearchResult> {
    try {
      this.logger.log(`Searching assets with filters:`, JSON.stringify(filters));

      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      // Build MongoDB aggregation pipeline
      const pipeline = this.buildSearchPipeline(filters, userId, skip, limit);

      // Execute search
      const [results, aggregations] = await Promise.all([
        this.assetSearchIndexModel.aggregate(pipeline),
        this.getSearchAggregations(filters, userId),
      ]);

      // Get total count
      const countPipeline = this.buildSearchPipeline(filters, userId, 0, 0, true);
      const countResult = await this.assetSearchIndexModel.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Enhance results with asset data
      const enhancedResults = await this.enhanceSearchResults(results);

      // Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(filters.query || '', userId);

      return {
        assets: enhancedResults,
        total,
        page,
        limit,
        aggregations,
        suggestions,
      };
    } catch (error) {
      this.logger.error('Failed to search assets:', error);
      throw error;
    }
  }

  /**
   * Build MongoDB aggregation pipeline for search
   */
  private buildSearchPipeline(
    filters: SearchFilters,
    userId?: string,
    skip = 0,
    limit = 20,
    countOnly = false
  ) {
    const pipeline: any[] = [];

    // Match stage
    const matchStage: any = {};

    // User and privacy filters
    if (userId) {
      matchStage.$or = [
        { userId },
        { 'searchableContent.isPublic': true }
      ];
    } else if (filters.isPublic !== false) {
      matchStage['searchableContent.isPublic'] = true;
    }

    // Text search
    if (filters.query) {
      matchStage.$text = { $search: filters.query };
    }

    // Tag filters
    if (filters.tags && filters.tags.length > 0) {
      matchStage['searchableContent.tags'] = { $in: filters.tags };
    }

    // Category filters
    if (filters.categories && filters.categories.length > 0) {
      matchStage['searchableContent.categories'] = { $in: filters.categories };
    }

    // Format filters
    if (filters.formats && filters.formats.length > 0) {
      matchStage['technicalSpecs.format'] = { $in: filters.formats };
    }

    // Color filters
    if (filters.colors && filters.colors.length > 0) {
      matchStage['visualFeatures.dominantColors'] = { $in: filters.colors };
    }

    // Orientation filter
    if (filters.orientation) {
      matchStage['visualFeatures.orientation'] = filters.orientation;
    }

    // Transparency filter
    if (filters.hasTransparency !== undefined) {
      matchStage['visualFeatures.hasTransparency'] = filters.hasTransparency;
    }

    // Dimension filters
    if (filters.minWidth || filters.maxWidth) {
      matchStage['technicalSpecs.dimensions.width'] = {};
      if (filters.minWidth) matchStage['technicalSpecs.dimensions.width'].$gte = filters.minWidth;
      if (filters.maxWidth) matchStage['technicalSpecs.dimensions.width'].$lte = filters.maxWidth;
    }

    if (filters.minHeight || filters.maxHeight) {
      matchStage['technicalSpecs.dimensions.height'] = {};
      if (filters.minHeight) matchStage['technicalSpecs.dimensions.height'].$gte = filters.minHeight;
      if (filters.maxHeight) matchStage['technicalSpecs.dimensions.height'].$lte = filters.maxHeight;
    }

    // File size filters
    if (filters.minFileSize || filters.maxFileSize) {
      matchStage['technicalSpecs.fileSize'] = {};
      if (filters.minFileSize) matchStage['technicalSpecs.fileSize'].$gte = filters.minFileSize;
      if (filters.maxFileSize) matchStage['technicalSpecs.fileSize'].$lte = filters.maxFileSize;
    }

    // Date range filter
    if (filters.dateRange) {
      matchStage.indexedAt = {
        $gte: filters.dateRange.from,
        $lte: filters.dateRange.to,
      };
    }

    pipeline.push({ $match: matchStage });

    // Count only pipeline
    if (countOnly) {
      pipeline.push({ $count: 'total' });
      return pipeline;
    }

    // Add score for text search
    if (filters.query) {
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    } else {
      // Default scoring based on popularity
      pipeline.push({
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$usageStats.popularityScore', 0.4] },
              { $multiply: ['$usageStats.downloadCount', 0.3] },
              { $multiply: ['$usageStats.viewCount', 0.2] },
              { $multiply: ['$usageStats.likeCount', 0.1] },
            ]
          }
        }
      });
    }

    // Sorting
    const sortStage: any = {};
    
    switch (filters.sortBy) {
      case 'date':
        sortStage.indexedAt = filters.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'popularity':
        sortStage['usageStats.popularityScore'] = filters.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'fileSize':
        sortStage['technicalSpecs.fileSize'] = filters.sortOrder === 'asc' ? 1 : -1;
        break;
      case 'dimensions':
        sortStage['technicalSpecs.dimensions.width'] = filters.sortOrder === 'asc' ? 1 : -1;
        break;
      default: // relevance
        sortStage.score = -1;
        sortStage['usageStats.popularityScore'] = -1;
    }

    pipeline.push({ $sort: sortStage });

    // Pagination
    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    // Project only necessary fields
    pipeline.push({
      $project: {
        assetId: 1,
        userId: 1,
        searchableContent: 1,
        visualFeatures: 1,
        technicalSpecs: 1,
        contentAnalysis: 1,
        usageStats: 1,
        score: 1,
        _id: 0,
      }
    });

    return pipeline;
  }

  /**
   * Get search aggregations for faceted search
   */
  private async getSearchAggregations(filters: SearchFilters, userId?: string) {
    const baseMatch: any = {};

    if (userId) {
      baseMatch.$or = [
        { userId },
        { 'searchableContent.isPublic': true }
      ];
    } else if (filters.isPublic !== false) {
      baseMatch['searchableContent.isPublic'] = true;
    }

    const [formats, colors, orientations, categories, fileSizes] = await Promise.all([
      // Format aggregation
      this.assetSearchIndexModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$technicalSpecs.format', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { format: '$_id', count: 1, _id: 0 } }
      ]),

      // Color aggregation
      this.assetSearchIndexModel.aggregate([
        { $match: baseMatch },
        { $unwind: '$visualFeatures.dominantColors' },
        { $group: { _id: '$visualFeatures.dominantColors', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { color: '$_id', count: 1, _id: 0 } }
      ]),

      // Orientation aggregation
      this.assetSearchIndexModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$visualFeatures.orientation', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { orientation: '$_id', count: 1, _id: 0 } }
      ]),

      // Category aggregation
      this.assetSearchIndexModel.aggregate([
        { $match: baseMatch },
        { $unwind: '$searchableContent.categories' },
        { $group: { _id: '$searchableContent.categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]),

      // File size range aggregation
      this.assetSearchIndexModel.aggregate([
        { $match: baseMatch },
        {
          $bucket: {
            groupBy: '$technicalSpecs.fileSize',
            boundaries: [0, 100000, 500000, 1000000, 5000000, 10000000, Infinity],
            default: 'Other',
            output: { count: { $sum: 1 } }
          }
        },
        {
          $project: {
            range: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 0] }, then: '0-100KB' },
                  { case: { $eq: ['$_id', 100000] }, then: '100KB-500KB' },
                  { case: { $eq: ['$_id', 500000] }, then: '500KB-1MB' },
                  { case: { $eq: ['$_id', 1000000] }, then: '1MB-5MB' },
                  { case: { $eq: ['$_id', 5000000] }, then: '5MB-10MB' },
                  { case: { $eq: ['$_id', 10000000] }, then: '10MB+' },
                ],
                default: 'Other'
              }
            },
            count: 1,
            _id: 0
          }
        }
      ])
    ]);

    return {
      formats,
      colors,
      orientations,
      categories,
      fileSizeRanges: fileSizes,
    };
  }

  /**
   * Enhance search results with asset data from PostgreSQL
   */
  private async enhanceSearchResults(results: any[]) {
    if (results.length === 0) return [];

    const assetIds = results.map(r => r.assetId);
    
    // Get asset data from PostgreSQL
    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds }
      },
      include: {
        metadata: true,
        user: {
          select: { id: true, name: true, avatar: true }
        },
        collections: {
          include: {
            collection: {
              select: { id: true, name: true, color: true }
            }
          }
        }
      }
    });

    // Create asset lookup map
    const assetMap = new Map(assets.map(asset => [asset.id, asset]));

    // Enhance results
    return results.map(result => {
      const asset = assetMap.get(result.assetId);
      return {
        assetId: result.assetId,
        score: result.score || 0,
        asset: asset,
        metadata: asset?.metadata || null,
        searchIndex: {
          searchableContent: result.searchableContent,
          visualFeatures: result.visualFeatures,
          technicalSpecs: result.technicalSpecs,
          contentAnalysis: result.contentAnalysis,
          usageStats: result.usageStats,
        },
        highlights: this.generateHighlights(result, asset),
      };
    }).filter(result => result.asset); // Remove results where asset was not found
  }

  /**
   * Generate search highlights
   */
  private generateHighlights(searchResult: any, asset: any): string[] {
    const highlights: string[] = [];

    if (!asset) return highlights;

    // Add highlights based on matched fields
    if (searchResult.searchableContent?.description) {
      highlights.push(searchResult.searchableContent.description);
    }

    if (searchResult.searchableContent?.tags?.length > 0) {
      highlights.push(`Tags: ${searchResult.searchableContent.tags.join(', ')}`);
    }

    if (searchResult.visualFeatures?.dominantColors?.length > 0) {
      highlights.push(`Colors: ${searchResult.visualFeatures.dominantColors.slice(0, 3).join(', ')}`);
    }

    return highlights;
  }

  /**
   * Generate search suggestions
   */
  private async generateSearchSuggestions(query: string, userId?: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      const baseMatch: any = {};

      if (userId) {
        baseMatch.$or = [
          { userId },
          { 'searchableContent.isPublic': true }
        ];
      }

      // Get tag suggestions
      const tagSuggestions = await this.assetSearchIndexModel.aggregate([
        { $match: baseMatch },
        { $unwind: '$searchableContent.tags' },
        {
          $match: {
            'searchableContent.tags': {
              $regex: query,
              $options: 'i'
            }
          }
        },
        { $group: { _id: '$searchableContent.tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { suggestion: '$_id', _id: 0 } }
      ]);

      // Get keyword suggestions
      const keywordSuggestions = await this.assetSearchIndexModel.aggregate([
        { $match: baseMatch },
        { $unwind: '$searchableContent.keywords' },
        {
          $match: {
            'searchableContent.keywords': {
              $regex: query,
              $options: 'i'
            }
          }
        },
        { $group: { _id: '$searchableContent.keywords', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { suggestion: '$_id', _id: 0 } }
      ]);

      const allSuggestions = [
        ...tagSuggestions.map(s => s.suggestion),
        ...keywordSuggestions.map(s => s.suggestion),
      ];

      // Remove duplicates and return top suggestions
      return [...new Set(allSuggestions)].slice(0, 10);
    } catch (error) {
      this.logger.warn('Failed to generate search suggestions:', error);
      return [];
    }
  }

  /**
   * Search similar assets based on visual features
   */
  async findSimilarAssets(assetId: string, limit = 10) {
    try {
      const sourceAsset = await this.assetSearchIndexModel.findOne({ assetId });
      if (!sourceAsset) throw new Error('Asset not found');

      const pipeline = [
        {
          $match: {
            assetId: { $ne: assetId },
            $or: [
              { userId: sourceAsset.userId },
              { 'searchableContent.isPublic': true }
            ]
          }
        },
        {
          $addFields: {
            similarity: {
              $add: [
                // Color similarity
                {
                  $size: {
                    $setIntersection: [
                      '$visualFeatures.dominantColors',
                      sourceAsset.visualFeatures.dominantColors
                    ]
                  }
                },
                // Orientation match
                {
                  $cond: [
                    { $eq: ['$visualFeatures.orientation', sourceAsset.visualFeatures.orientation] },
                    2,
                    0
                  ]
                },
                // Format match
                {
                  $cond: [
                    { $eq: ['$technicalSpecs.format', sourceAsset.technicalSpecs.format] },
                    1,
                    0
                  ]
                },
                // Aspect ratio similarity (inverted difference)
                {
                  $subtract: [
                    10,
                    {
                      $abs: {
                        $subtract: [
                          '$visualFeatures.aspectRatio',
                          sourceAsset.visualFeatures.aspectRatio
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          }
        },
        { $sort: { similarity: -1 as const } },
        { $limit: limit },
        {
          $project: {
            assetId: 1,
            similarity: 1,
            visualFeatures: 1,
            technicalSpecs: 1,
            _id: 0
          }
        }
      ];

      const similarAssets = await this.assetSearchIndexModel.aggregate(pipeline);
      return this.enhanceSearchResults(similarAssets);
    } catch (error) {
      this.logger.error(`Failed to find similar assets for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Update asset usage stats for search ranking
   */
  async updateUsageStats(assetId: string, action: 'view' | 'download' | 'like' | 'share') {
    try {
      const updateField = `usageStats.${action}Count`;
      const update: any = { $inc: { [updateField]: 1 } };

      if (action === 'view' || action === 'download') {
        update.$set = { 'usageStats.lastUsedAt': new Date() };
      }

      await this.assetSearchIndexModel.updateOne(
        { assetId },
        update
      );

      // Recalculate popularity score
      await this.recalculatePopularityScore(assetId);
    } catch (error) {
      this.logger.error(`Failed to update usage stats for ${assetId}:`, error);
    }
  }

  /**
   * Recalculate popularity score
   */
  private async recalculatePopularityScore(assetId: string) {
    try {
      const asset = await this.assetSearchIndexModel.findOne({ assetId });
      if (!asset) return;

      const stats = asset.usageStats;
      const popularityScore = 
        (stats.viewCount * 0.1) +
        (stats.downloadCount * 0.3) +
        (stats.likeCount * 0.4) +
        (stats.shareCount * 0.2);

      await this.assetSearchIndexModel.updateOne(
        { assetId },
        { $set: { 'usageStats.popularityScore': Math.round(popularityScore) } }
      );
    } catch (error) {
      this.logger.warn(`Failed to recalculate popularity score for ${assetId}:`, error);
    }
  }
}