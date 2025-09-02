import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../../database/prisma.service';
import { CanvasDocument } from '../../database/mongodb/schemas';
import { TemplateQueryDto } from './dto/template-query.dto';
import { 
  TemplateResponseDto, 
  TemplateWithCanvasDto, 
  TemplateListResponseDto, 
  TemplateCategoriesResponseDto,
  TemplateUsageResponseDto 
} from './dto/template-response.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectModel(CanvasDocument.name) private canvasModel: Model<CanvasDocument>,
  ) {}

  async getTemplates(queryDto: TemplateQueryDto): Promise<TemplateListResponseDto> {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      tags,
      isPremium,
      aspectRatio,
      sortBy = 'popularity',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause for templates
    const where: any = { isTemplate: true, isPublic: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.tags = { hasSome: [category] };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (typeof isPremium === 'boolean') {
      // For now, all templates are free. In future, add premium field to Project model
      if (isPremium) {
        where.tags = { hasSome: ['premium'] };
      }
    }

    if (aspectRatio) {
      // Calculate aspect ratio from dimensions
      const [width, height] = aspectRatio.split(':').map(Number);
      if (width && height) {
        const targetRatio = width / height;
        const tolerance = 0.1;
        // This would require a computed field or separate filtering logic
        // For now, we'll implement this in post-processing
      }
    }

    // Map sortBy to database fields
    const sortField = this.mapSortField(sortBy);

    const [templates, total] = await Promise.all([
      this.prismaService.project.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      this.prismaService.project.count({ where }),
    ]);

    // Filter by aspect ratio if specified (post-processing)
    let filteredTemplates = templates;
    if (aspectRatio) {
      const [targetW, targetH] = aspectRatio.split(':').map(Number);
      if (targetW && targetH) {
        const targetRatio = targetW / targetH;
        const tolerance = 0.1;
        filteredTemplates = templates.filter(template => {
          const ratio = template.canvasWidth / template.canvasHeight;
          return Math.abs(ratio - targetRatio) <= tolerance;
        });
      }
    }

    const data = await Promise.all(
      filteredTemplates.map(template => this.formatTemplateResponse(template))
    );

    return {
      total: aspectRatio ? filteredTemplates.length : total,
      page,
      pageSize: limit,
      data,
    };
  }

  async getTemplateById(id: string, includeCanvas: boolean = false): Promise<TemplateResponseDto | TemplateWithCanvasDto> {
    const template = await this.prismaService.project.findFirst({
      where: { id, isTemplate: true, isPublic: true },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const baseResponse = await this.formatTemplateResponse(template);

    if (!includeCanvas || !template.canvasDocumentId) {
      return baseResponse;
    }

    // Fetch canvas data from MongoDB
    const canvasDocument = await this.canvasModel.findById(template.canvasDocumentId);

    return {
      ...baseResponse,
      canvasData: canvasDocument ? {
        elements: canvasDocument.elements || [],
        layers: canvasDocument.layers || [],
        timeline: canvasDocument.timeline || {},
        viewport: canvasDocument.viewport || { zoom: 1, panX: 0, panY: 0 },
        settings: canvasDocument.settings || {},
        backgroundColor: canvasDocument.backgroundColor || { r: 255, g: 255, b: 255, a: 1 }
      } : undefined
    } as TemplateWithCanvasDto;
  }

  async getCategories(): Promise<TemplateCategoriesResponseDto> {
    // Get all public templates with their tags
    const templates = await this.prismaService.project.findMany({
      where: { isTemplate: true, isPublic: true },
      select: { tags: true },
    });

    // Count templates by category
    const categoryCounts = new Map<string, number>();
    templates.forEach(template => {
      template.tags.forEach(tag => {
        const count = categoryCounts.get(tag) || 0;
        categoryCounts.set(tag, count + 1);
      });
    });

    // Map to display categories
    const predefinedCategories = {
      'business': { displayName: 'Business', description: 'Professional business templates' },
      'social-media': { displayName: 'Social Media', description: 'Templates for social platforms' },
      'presentation': { displayName: 'Presentations', description: 'Slide deck and presentation templates' },
      'marketing': { displayName: 'Marketing', description: 'Marketing and advertising materials' },
      'personal': { displayName: 'Personal', description: 'Personal projects and documents' },
      'education': { displayName: 'Education', description: 'Educational content templates' },
      'design': { displayName: 'Design', description: 'Creative design templates' },
    };

    const categories = Object.entries(predefinedCategories).map(([name, info]) => ({
      name,
      displayName: info.displayName,
      count: categoryCounts.get(name) || 0,
      description: info.description,
    }));

    // Add other categories not in predefined list
    for (const [tag, count] of categoryCounts.entries()) {
      if (!predefinedCategories[tag]) {
        categories.push({
          name: tag,
          displayName: tag.charAt(0).toUpperCase() + tag.slice(1),
          count,
          description: `${tag} templates`,
        });
      }
    }

    return { categories: categories.filter(cat => cat.count > 0) };
  }

  async getFeaturedTemplates(limit: number = 10): Promise<TemplateResponseDto[]> {
    const featured = await this.prismaService.project.findMany({
      where: { 
        isTemplate: true, 
        isPublic: true,
        tags: { hasSome: ['featured'] }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return Promise.all(featured.map(template => this.formatTemplateResponse(template)));
  }

  async getPopularTemplates(limit: number = 10): Promise<TemplateResponseDto[]> {
    // For now, order by creation date. In production, this would use actual usage stats
    const popular = await this.prismaService.project.findMany({
      where: { isTemplate: true, isPublic: true },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return Promise.all(popular.map(template => this.formatTemplateResponse(template)));
  }

  async trackTemplateUsage(templateId: string, userId: string, usageType: 'download' | 'preview' | 'use'): Promise<TemplateUsageResponseDto> {
    const template = await this.prismaService.project.findFirst({
      where: { id: templateId, isTemplate: true, isPublic: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if premium template and user has access
    if (template.tags.includes('premium')) {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.plan === 'FREE') {
        throw new ForbiddenException('Premium template access requires Pro plan');
      }
    }

    // Track usage (in production, you might want a separate tracking table)
    const usageId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Here you could log to analytics service, update counters, etc.
    console.log(`Template usage tracked: ${templateId} by ${userId} (${usageType})`);

    return {
      usageId,
      templateId,
      userId,
      usageType,
      timestamp: new Date(),
      message: `Template ${usageType} tracked successfully`,
    };
  }

  async searchSimilarTemplates(templateId: string, limit: number = 5): Promise<TemplateResponseDto[]> {
    const template = await this.prismaService.project.findFirst({
      where: { id: templateId, isTemplate: true, isPublic: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Find similar templates by matching tags and dimensions
    const similar = await this.prismaService.project.findMany({
      where: {
        id: { not: templateId },
        isTemplate: true,
        isPublic: true,
        OR: [
          { tags: { hasSome: template.tags } },
          {
            AND: [
              { canvasWidth: { gte: template.canvasWidth * 0.8, lte: template.canvasWidth * 1.2 } },
              { canvasHeight: { gte: template.canvasHeight * 0.8, lte: template.canvasHeight * 1.2 } },
            ]
          }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      take: limit,
    });

    return Promise.all(similar.map(t => this.formatTemplateResponse(t)));
  }

  async getTemplatesByUser(userId: string, includePrivate: boolean = false): Promise<TemplateResponseDto[]> {
    const where: any = { userId, isTemplate: true };
    if (!includePrivate) {
      where.isPublic = true;
    }

    const templates = await this.prismaService.project.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(templates.map(template => this.formatTemplateResponse(template)));
  }

  private async formatTemplateResponse(template: any): Promise<TemplateResponseDto> {
    // Calculate aspect ratio
    const aspectRatio = this.calculateAspectRatio(template.canvasWidth, template.canvasHeight);
    
    // Mock usage stats (in production, these would come from analytics)
    const usageStats = {
      totalDownloads: Math.floor(Math.random() * 1000) + 100,
      monthlyDownloads: Math.floor(Math.random() * 100) + 10,
      averageRating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0
      ratingCount: Math.floor(Math.random() * 50) + 5,
      popularityScore: Math.floor(Math.random() * 100),
    };

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.tags.find(tag => 
        ['business', 'social-media', 'presentation', 'marketing', 'personal', 'education', 'design'].includes(tag)
      ) || 'other',
      tags: template.tags,
      dimensions: {
        width: template.canvasWidth,
        height: template.canvasHeight,
        aspectRatio,
      },
      thumbnailUrl: template.thumbnail || this.generateThumbnailUrl(template.id),
      previewUrl: this.generatePreviewUrl(template.id),
      isPremium: template.tags.includes('premium'),
      isFeatured: template.tags.includes('featured'),
      isPublic: template.isPublic,
      price: template.tags.includes('premium') ? 299 : undefined, // $2.99 in cents
      author: {
        id: template.user.id,
        name: template.user.name,
        avatar: template.user.avatar,
      },
      usageStats,
      canvasDocumentId: template.canvasDocumentId,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      version: template.version,
    };
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      'popularity': 'createdAt', // In production, this would be a popularity score
      'downloads': 'createdAt', // In production, this would be download count
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'name': 'name',
    };

    return fieldMap[sortBy] || 'createdAt';
  }

  private calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  private generateThumbnailUrl(templateId: string): string {
    // In production, this would generate actual thumbnails
    return `https://picsum.photos/400/300?random=${templateId}`;
  }

  private generatePreviewUrl(templateId: string): string {
    // In production, this would generate preview URLs
    return `https://picsum.photos/800/600?random=${templateId}`;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Test database connectivity
      await this.prismaService.project.count({ where: { isTemplate: true } });
      
      // Test MongoDB connectivity
      await this.canvasModel.countDocuments();
      
      return true;
    } catch {
      return false;
    }
  }
}