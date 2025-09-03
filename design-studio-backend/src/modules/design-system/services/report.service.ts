import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  ReportPageDefinition, 
  ReportPageDefinitionType 
} from '../../../database/mongodb/schemas';

export interface CreateReportRequest {
  title: string;
  description?: string;
  author: string;
  tags?: string[];
  category?: string;
}

export interface CreatePageRequest {
  title: string;
  description?: string;
  order: number;
  layoutType?: 'flexible' | 'grid' | 'fixed' | 'responsive';
  columns?: number;
  width?: number;
  height?: number;
}

export interface PageComponentInstance {
  id: string;
  componentId: string;
  componentVersion: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  props: Record<string, any>;
  dataBindings?: Record<string, any>;
  responsive?: Record<string, any>;
}

export interface UpdatePageLayoutRequest {
  layoutType?: 'flexible' | 'grid' | 'fixed' | 'responsive';
  columns?: number;
  rows?: number;
  gridTemplate?: string;
  breakpoints?: Record<string, any>;
  components?: PageComponentInstance[];
  pageSettings?: {
    background?: {
      color?: string;
      image?: string;
      gradient?: any;
    };
    padding?: Record<string, number>;
    margin?: Record<string, number>;
  };
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private prisma: PrismaService,
    @InjectModel(ReportPageDefinition.name)
    private pageDefinitionModel: Model<ReportPageDefinitionType>,
  ) {}

  /**
   * Create a new report
   */
  async createReport(userId: string, data: CreateReportRequest) {
    try {
      this.logger.log(`Creating report: ${data.title}`);

      const report = await this.prisma.report.create({
        data: {
          title: data.title,
          description: data.description,
          author: data.author,
          tags: data.tags || [],
          category: data.category,
          userId,
          version: 1,
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      return report;
    } catch (error) {
      this.logger.error('Failed to create report:', error);
      throw error;
    }
  }

  /**
   * Get report with all pages
   */
  async getReport(reportId: string, userId?: string, includePageDefinitions = false) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        },
        pages: {
          orderBy: { order: 'asc' },
          include: includePageDefinitions ? {
            components: {
              include: {
                component: {
                  select: { 
                    id: true, 
                    name: true, 
                    type: true, 
                    version: true,
                    supportedFormats: true 
                  }
                }
              }
            }
          } : undefined
        }
      }
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Check access permissions
    if (!this.canAccessReport(report, userId)) {
      throw new NotFoundException('Report not found');
    }

    // Get page definitions from MongoDB if requested
    if (includePageDefinitions && report.pages.length > 0) {
      const pageIds = report.pages.map(p => p.id);
      const pageDefinitions = await this.pageDefinitionModel.find({
        pageId: { $in: pageIds }
      });

      // Attach definitions to pages
      const definitionMap = new Map(
        pageDefinitions.map(def => [def.pageId, def])
      );

      report.pages.forEach((page: any) => {
        page.definition = definitionMap.get(page.id);
      });
    }

    return report;
  }

  /**
   * Update report metadata
   */
  async updateReport(reportId: string, userId: string, data: Partial<CreateReportRequest>) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!this.canModifyReport(report, userId)) {
      throw new BadRequestException('Not authorized to modify this report');
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        title: data.title,
        description: data.description,
        author: data.author,
        tags: data.tags,
        category: data.category,
        version: { increment: 1 },
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });
  }

  /**
   * Create a page within a report
   */
  async createPage(reportId: string, userId: string, data: CreatePageRequest) {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (!this.canModifyReport(report, userId)) {
        throw new BadRequestException('Not authorized to modify this report');
      }

      // Create page in PostgreSQL
      const page = await this.prisma.reportPage.create({
        data: {
          reportId,
          title: data.title,
          description: data.description,
          order: data.order,
          layoutType: (data.layoutType?.toUpperCase() || 'FLEXIBLE') as any,
          columns: data.columns || 1,
          width: data.width || 1920,
          height: data.height || 1080,
          version: 1,
        }
      });

      // Create initial page definition in MongoDB
      await this.pageDefinitionModel.create({
        pageId: page.id,
        reportId,
        version: 1,
        layout: {
          type: data.layoutType || 'flexible',
          columns: data.columns || 1,
        },
        componentInstances: [],
        pageSettings: {},
        interactions: {},
        metadata: {
          renderingHints: {},
          cacheStrategy: 'default',
          dependencies: [],
        },
      });

      // Update report version
      await this.prisma.report.update({
        where: { id: reportId },
        data: { version: { increment: 1 } }
      });

      return this.getPage(page.id, userId);
    } catch (error) {
      this.logger.error('Failed to create page:', error);
      throw error;
    }
  }

  /**
   * Get page with definition
   */
  async getPage(pageId: string, userId?: string) {
    const page = await this.prisma.reportPage.findUnique({
      where: { id: pageId },
      include: {
        report: {
          select: { id: true, title: true, userId: true, isPublic: true }
        },
        components: {
          include: {
            component: {
              select: { 
                id: true, 
                name: true, 
                type: true, 
                version: true,
                supportedFormats: true,
                defaultProps: true,
              }
            }
          }
        }
      }
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check access permissions
    if (!this.canAccessReport(page.report, userId)) {
      throw new NotFoundException('Page not found');
    }

    // Get page definition from MongoDB
    const definition = await this.pageDefinitionModel.findOne({
      pageId,
      version: page.version,
    });

    return {
      ...page,
      definition,
    };
  }

  /**
   * Update page layout and components
   */
  async updatePageLayout(pageId: string, userId: string, data: UpdatePageLayoutRequest) {
    try {
      const page = await this.prisma.reportPage.findUnique({
        where: { id: pageId },
        include: {
          report: { select: { id: true, userId: true } }
        }
      });

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      if (!this.canModifyReport(page.report, userId)) {
        throw new BadRequestException('Not authorized to modify this page');
      }

      const newVersion = page.version + 1;

      // Update page in PostgreSQL
      await this.prisma.reportPage.update({
        where: { id: pageId },
        data: {
          layoutType: data.layoutType ? (data.layoutType.toUpperCase() as any) : undefined,
          columns: data.columns,
          version: newVersion,
        },
      });

      // Get current definition to merge changes
      const currentDefinition = await this.pageDefinitionModel.findOne({
        pageId,
        version: page.version,
      });

      if (!currentDefinition) {
        throw new NotFoundException('Current page definition not found');
      }

      // Create new version of page definition
      const updatedDefinition = {
        ...currentDefinition.toObject(),
        _id: undefined,
        version: newVersion,
        layout: {
          ...currentDefinition.layout,
          type: data.layoutType || currentDefinition.layout.type,
          columns: data.columns || currentDefinition.layout.columns,
          rows: data.rows,
          gridTemplate: data.gridTemplate,
          breakpoints: data.breakpoints,
        },
        componentInstances: data.components || currentDefinition.componentInstances,
        pageSettings: data.pageSettings || currentDefinition.pageSettings,
        metadata: {
          ...currentDefinition.metadata,
          dependencies: this.extractDependencies(data.components || currentDefinition.componentInstances),
        },
      };

      await this.pageDefinitionModel.create(updatedDefinition);

      // Update component instances in PostgreSQL if provided
      if (data.components) {
        // Remove existing component instances
        await this.prisma.pageComponent.deleteMany({
          where: { pageId }
        });

        // Create new component instances
        if (data.components.length > 0) {
          await this.prisma.pageComponent.createMany({
            data: data.components.map(comp => ({
              pageId,
              componentId: comp.componentId,
              componentVersion: comp.componentVersion,
              x: comp.position.x,
              y: comp.position.y,
              width: comp.position.width,
              height: comp.position.height,
              zIndex: comp.position.zIndex,
              props: comp.props,
            }))
          });
        }
      }

      // Update report version
      await this.prisma.report.update({
        where: { id: page.reportId },
        data: { version: { increment: 1 } }
      });

      return this.getPage(pageId, userId);
    } catch (error) {
      this.logger.error('Failed to update page layout:', error);
      throw error;
    }
  }

  /**
   * Add component to page
   */
  async addComponentToPage(
    pageId: string, 
    userId: string, 
    componentData: Omit<PageComponentInstance, 'id'>
  ) {
    const page = await this.prisma.reportPage.findUnique({
      where: { id: pageId },
      include: {
        report: { select: { id: true, userId: true } }
      }
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (!this.canModifyReport(page.report, userId)) {
      throw new BadRequestException('Not authorized to modify this page');
    }

    // Verify component exists and user can access it
    const component = await this.prisma.component.findUnique({
      where: { id: componentData.componentId }
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    // Create component instance
    const pageComponent = await this.prisma.pageComponent.create({
      data: {
        pageId,
        componentId: componentData.componentId,
        componentVersion: componentData.componentVersion,
        x: componentData.position.x,
        y: componentData.position.y,
        width: componentData.position.width,
        height: componentData.position.height,
        zIndex: componentData.position.zIndex,
        props: componentData.props,
      },
      include: {
        component: {
          select: { 
            id: true, 
            name: true, 
            type: true, 
            usageCount: true 
          }
        }
      }
    });

    // Update component usage count
    await this.prisma.component.update({
      where: { id: componentData.componentId },
      data: { usageCount: { increment: 1 } }
    });

    // Update page definition in MongoDB
    await this.updatePageDefinitionComponents(pageId, page.version);

    return pageComponent;
  }

  /**
   * Remove component from page
   */
  async removeComponentFromPage(pageId: string, componentInstanceId: string, userId: string) {
    const page = await this.prisma.reportPage.findUnique({
      where: { id: pageId },
      include: {
        report: { select: { id: true, userId: true } }
      }
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    if (!this.canModifyReport(page.report, userId)) {
      throw new BadRequestException('Not authorized to modify this page');
    }

    const pageComponent = await this.prisma.pageComponent.findUnique({
      where: { id: componentInstanceId }
    });

    if (!pageComponent || pageComponent.pageId !== pageId) {
      throw new NotFoundException('Component instance not found');
    }

    // Remove component instance
    await this.prisma.pageComponent.delete({
      where: { id: componentInstanceId }
    });

    // Update page definition in MongoDB
    await this.updatePageDefinitionComponents(pageId, page.version);

    return { success: true };
  }

  /**
   * List reports with filtering
   */
  async listReports(
    userId?: string,
    filters: {
      author?: string;
      category?: string;
      tags?: string[];
      search?: string;
      isPublished?: boolean;
      page?: number;
      limit?: number;
      sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'author';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Access control
    if (userId) {
      where.OR = [
        { userId },
        { isPublished: true }
      ];
    } else {
      where.isPublished = true;
    }

    // Filters
    if (filters.author) {
      where.author = { contains: filters.author, mode: 'insensitive' };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { author: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    // Sorting
    const orderBy: any = {};
    const sortField = filters.sortBy || 'updatedAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortField] = sortOrder;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          },
          pages: {
            select: { id: true, title: true, order: true },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { pages: true, exports: true }
          }
        }
      }),
      this.prisma.report.count({ where })
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Publish report
   */
  async publishReport(reportId: string, userId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!this.canModifyReport(report, userId)) {
      throw new BadRequestException('Not authorized to modify this report');
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: { 
        isPublished: true,
        publishedAt: new Date(),
      }
    });
  }

  /**
   * Clone report
   */
  async cloneReport(reportId: string, userId: string, title?: string) {
    const originalReport = await this.getReport(reportId, userId, true);

    if (!originalReport) {
      throw new NotFoundException('Report not found');
    }

    // Create new report
    const clonedReport = await this.createReport(userId, {
      title: title || `${originalReport.title} (Copy)`,
      description: originalReport.description,
      author: originalReport.author,
      tags: originalReport.tags,
      category: originalReport.category,
    });

    // Clone pages
    for (const page of originalReport.pages) {
      const clonedPage = await this.createPage(clonedReport.id, userId, {
        title: page.title,
        description: page.description,
        order: page.order,
        layoutType: page.layoutType.toLowerCase() as any,
        columns: page.columns,
        width: page.width,
        height: page.height,
      });

      // Clone page components if they exist
      if (page.components && page.components.length > 0) {
        const componentInstances: PageComponentInstance[] = page.components.map((comp: any) => ({
          id: comp.id,
          componentId: comp.componentId,
          componentVersion: comp.componentVersion,
          position: {
            x: comp.x,
            y: comp.y,
            width: comp.width,
            height: comp.height,
            zIndex: comp.zIndex,
          },
          props: comp.props,
        }));

        await this.updatePageLayout(clonedPage.id, userId, {
          components: componentInstances
        });
      }
    }

    return this.getReport(clonedReport.id, userId, true);
  }

  // Private helper methods

  private async updatePageDefinitionComponents(pageId: string, version: number) {
    const components = await this.prisma.pageComponent.findMany({
      where: { pageId },
      include: {
        component: {
          select: { id: true, name: true, type: true }
        }
      }
    });

    const componentInstances = components.map(comp => ({
      id: comp.id,
      componentId: comp.componentId,
      componentVersion: comp.componentVersion,
      position: {
        x: comp.x,
        y: comp.y,
        width: comp.width,
        height: comp.height,
        zIndex: comp.zIndex,
      },
      props: comp.props,
      dataBindings: {},
      responsive: {},
    }));

    await this.pageDefinitionModel.updateOne(
      { pageId, version },
      {
        $set: {
          componentInstances,
          'metadata.dependencies': this.extractDependencies(componentInstances),
        }
      }
    );
  }

  private extractDependencies(components: PageComponentInstance[]): string[] {
    return [...new Set(components.map(comp => comp.componentId))];
  }

  private canAccessReport(report: any, userId?: string): boolean {
    if (report.isPublished) return true;
    return report.userId === userId;
  }

  private canModifyReport(report: any, userId: string): boolean {
    return report.userId === userId;
  }
}