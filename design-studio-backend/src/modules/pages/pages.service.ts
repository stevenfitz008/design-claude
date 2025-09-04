import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../../database/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { ReportPageDto, ReportPageWithComponentsDto, PageStatsDto } from './dto/page-response.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { ReportPageDefinition, ReportPageDefinitionType } from '../../database/mongodb/schemas';
import { ReportPage, Prisma, PageComponent } from '@prisma/client';

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(ReportPageDefinition.name)
    private readonly reportPageDefinitionModel: Model<ReportPageDefinitionType>,
  ) {}

  async create(createPageDto: CreatePageDto, userId: string): Promise<ReportPageDto> {
    try {
      // Verify report exists and user has access
      const report = await this.prisma.report.findFirst({
        where: { 
          id: createPageDto.reportId, 
          userId 
        },
      });

      if (!report) {
        throw new NotFoundException('Report not found or access denied');
      }

      // Check for duplicate page order within the report
      if (createPageDto.order !== undefined) {
        const existingPageWithOrder = await this.prisma.reportPage.findFirst({
          where: {
            reportId: createPageDto.reportId,
            order: createPageDto.order,
          },
        });

        if (existingPageWithOrder) {
          throw new ConflictException(`A page with order ${createPageDto.order} already exists in this report`);
        }
      }

      // Create the page record in PostgreSQL
      const page = await this.prisma.reportPage.create({
        data: {
          reportId: createPageDto.reportId,
          title: createPageDto.title,
          description: createPageDto.description,
          order: createPageDto.order,
          layoutType: createPageDto.layoutType || 'FLEXIBLE',
          columns: createPageDto.columns || 1,
          width: createPageDto.width || 1920,
          height: createPageDto.height || 1080,
          version: 1,
        },
      });

      // Create corresponding MongoDB document for complex page definition
      const pageDefinition = await this.reportPageDefinitionModel.create({
        pageId: page.id,
        reportId: createPageDto.reportId,
        version: 1,
        layout: {
          type: createPageDto.layoutType || 'flexible',
          columns: createPageDto.columns || 1,
          breakpoints: {
            desktop: { minWidth: 1200 },
            tablet: { minWidth: 768, maxWidth: 1199 },
            mobile: { maxWidth: 767 },
          },
        },
        componentInstances: [],
        pageSettings: createPageDto.pageSettings || {
          background: { color: '#FFFFFF' },
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        interactions: {
          navigation: {},
          animations: [],
          events: {},
        },
        metadata: {
          renderingHints: {},
          cacheStrategy: 'standard',
          dependencies: [],
        },
      });

      // If components are provided, add them to the page
      if (createPageDto.components && createPageDto.components.length > 0) {
        await this.addComponentsToPage(page.id, createPageDto.components, userId);
      }

      return this.mapPageToDto(page);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Page with this title already exists in the report');
        }
      }
      throw error;
    }
  }

  async findAll(
    queryDto: PageQueryDto,
    userId: string,
  ): Promise<{ data: ReportPageDto[] | ReportPageWithComponentsDto[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      reportId,
      layoutType,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      sortBy = 'order',
      sortOrder = 'asc',
      includeComponents = false,
    } = queryDto;

    // Build where clause - only show pages from reports the user owns
    const where: Prisma.ReportPageWhereInput = {
      report: { userId },
      ...(reportId && { reportId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(layoutType && { layoutType }),
      ...(minWidth && { width: { gte: minWidth } }),
      ...(maxWidth && { width: { lte: maxWidth } }),
      ...(minHeight && { height: { gte: minHeight } }),
      ...(maxHeight && { height: { lte: maxHeight } }),
    };

    // Count total records
    const total = await this.prisma.reportPage.count({ where });

    // Fetch pages with pagination
    const pages = await this.prisma.reportPage.findMany({
      where,
      include: includeComponents ? { 
        components: { 
          orderBy: { zIndex: 'asc' },
          include: { component: true },
        } 
      } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(
      pages.map(async (page) => {
        if (includeComponents) {
          return this.mapPageWithComponentsToDto(page as any);
        }
        return this.mapPageToDto(page);
      })
    );

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async findOne(id: string, userId: string, includeComponents = false): Promise<ReportPageDto | ReportPageWithComponentsDto> {
    const page = await this.prisma.reportPage.findFirst({
      where: { 
        id,
        report: { userId }, // Ensure user owns the report
      },
      include: includeComponents ? { 
        components: { 
          orderBy: { zIndex: 'asc' },
          include: { component: true },
        } 
      } : undefined,
    });

    if (!page) {
      throw new NotFoundException('Page not found or access denied');
    }

    if (includeComponents) {
      return this.mapPageWithComponentsToDto(page as any);
    }

    return this.mapPageToDto(page);
  }

  async update(id: string, updatePageDto: UpdatePageDto, userId: string): Promise<ReportPageDto> {
    try {
      // Check if page exists and user has access
      const existingPage = await this.prisma.reportPage.findFirst({
        where: { 
          id,
          report: { userId },
        },
      });

      if (!existingPage) {
        throw new NotFoundException('Page not found or access denied');
      }

      // Optimistic concurrency control
      if (updatePageDto.version && updatePageDto.version !== existingPage.version) {
        throw new ConflictException('Page has been modified by another user. Please refresh and try again.');
      }

      // Check for order conflicts if order is being changed
      if (updatePageDto.order !== undefined && updatePageDto.order !== existingPage.order) {
        const existingPageWithOrder = await this.prisma.reportPage.findFirst({
          where: {
            reportId: existingPage.reportId,
            order: updatePageDto.order,
            id: { not: id }, // Exclude current page
          },
        });

        if (existingPageWithOrder) {
          throw new ConflictException(`A page with order ${updatePageDto.order} already exists in this report`);
        }
      }

      // Update PostgreSQL record
      const updatedPage = await this.prisma.reportPage.update({
        where: { id },
        data: {
          ...(updatePageDto.title && { title: updatePageDto.title }),
          ...(updatePageDto.description !== undefined && { description: updatePageDto.description }),
          ...(updatePageDto.order !== undefined && { order: updatePageDto.order }),
          ...(updatePageDto.layoutType && { layoutType: updatePageDto.layoutType }),
          ...(updatePageDto.columns !== undefined && { columns: updatePageDto.columns }),
          ...(updatePageDto.width !== undefined && { width: updatePageDto.width }),
          ...(updatePageDto.height !== undefined && { height: updatePageDto.height }),
          version: existingPage.version + 1,
        },
      });

      // Update MongoDB page definition if layout or settings changed
      if (updatePageDto.layoutType || updatePageDto.columns || updatePageDto.pageSettings) {
        await this.reportPageDefinitionModel.updateOne(
          { pageId: id },
          {
            $set: {
              version: updatedPage.version,
              ...(updatePageDto.layoutType && {
                'layout.type': updatePageDto.layoutType.toLowerCase(),
              }),
              ...(updatePageDto.columns && {
                'layout.columns': updatePageDto.columns,
              }),
              ...(updatePageDto.pageSettings && {
                pageSettings: updatePageDto.pageSettings,
              }),
            },
          },
        );
      }

      return this.mapPageToDto(updatedPage);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Page with this title already exists in the report');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Page not found or access denied');
        }
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    try {
      // Check if page exists and user has access
      const existingPage = await this.prisma.reportPage.findFirst({
        where: { 
          id,
          report: { userId },
        },
        include: { components: true },
      });

      if (!existingPage) {
        throw new NotFoundException('Page not found or access denied');
      }

      // Delete MongoDB page definition
      await this.reportPageDefinitionModel.deleteOne({ pageId: id });

      // Delete the page (this will cascade delete components due to foreign key constraints)
      await this.prisma.reportPage.delete({
        where: { id },
      });

      return { message: 'Page deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Page not found or access denied');
        }
      }
      throw error;
    }
  }

  async duplicate(id: string, userId: string, newTitle?: string): Promise<ReportPageDto> {
    const sourcePage = await this.prisma.reportPage.findFirst({
      where: { 
        id,
        report: { userId },
      },
      include: { components: { include: { component: true } } },
    });

    if (!sourcePage) {
      throw new NotFoundException('Source page not found or access denied');
    }

    try {
      // Find next available order
      const maxOrder = await this.prisma.reportPage.aggregate({
        where: { reportId: sourcePage.reportId },
        _max: { order: true },
      });

      const nextOrder = (maxOrder._max.order || 0) + 1;

      // Create duplicated page
      const duplicatedTitle = newTitle || `${sourcePage.title} (Copy)`;
      
      const newPage = await this.prisma.reportPage.create({
        data: {
          reportId: sourcePage.reportId,
          title: duplicatedTitle,
          description: sourcePage.description,
          order: nextOrder,
          layoutType: sourcePage.layoutType,
          columns: sourcePage.columns,
          width: sourcePage.width,
          height: sourcePage.height,
          version: 1,
        },
      });

      // Copy MongoDB page definition
      const sourcePageDefinition = await this.reportPageDefinitionModel.findOne({
        pageId: sourcePage.id,
      });

      if (sourcePageDefinition) {
        await this.reportPageDefinitionModel.create({
          pageId: newPage.id,
          reportId: sourcePage.reportId,
          version: 1,
          layout: sourcePageDefinition.layout,
          componentInstances: sourcePageDefinition.componentInstances.map(instance => ({
            ...instance,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate new ID
          })),
          pageSettings: sourcePageDefinition.pageSettings,
          interactions: sourcePageDefinition.interactions,
          metadata: sourcePageDefinition.metadata,
        });

        // Duplicate page components in PostgreSQL
        await Promise.all(
          sourcePage.components.map(async (component) => {
            await this.prisma.pageComponent.create({
              data: {
                pageId: newPage.id,
                componentId: component.componentId,
                componentVersion: component.componentVersion,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height,
                rotation: component.rotation,
                zIndex: component.zIndex,
                props: component.props,
                isVisible: component.isVisible,
                isLocked: component.isLocked,
              },
            });
          })
        );
      }

      return this.mapPageToDto(newPage);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A page with this title already exists');
        }
      }
      throw error;
    }
  }

  async reorderPages(reportId: string, pageOrders: Array<{ pageId: string; order: number }>, userId: string): Promise<{ message: string }> {
    // Verify report exists and user has access
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found or access denied');
    }

    // Verify all pages belong to this report
    const pageIds = pageOrders.map(p => p.pageId);
    const existingPages = await this.prisma.reportPage.findMany({
      where: { 
        id: { in: pageIds },
        reportId,
      },
    });

    if (existingPages.length !== pageIds.length) {
      throw new BadRequestException('One or more pages do not belong to this report');
    }

    // Check for duplicate orders
    const orders = pageOrders.map(p => p.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new BadRequestException('Duplicate orders are not allowed');
    }

    // Update page orders in a transaction
    try {
      await this.prisma.$transaction(
        pageOrders.map(({ pageId, order }) =>
          this.prisma.reportPage.update({
            where: { id: pageId },
            data: { 
              order,
              version: { increment: 1 },
            },
          })
        )
      );

      return { message: 'Page orders updated successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Order conflict occurred during reordering');
        }
      }
      throw error;
    }
  }

  async addComponentToPage(
    pageId: string,
    componentId: string,
    componentVersion: number,
    position: { x: number; y: number; width: number; height: number; zIndex?: number },
    props: Record<string, any> = {},
    userId: string,
  ): Promise<{ message: string; componentInstanceId: string }> {
    // Verify page exists and user has access
    const page = await this.prisma.reportPage.findFirst({
      where: { 
        id: pageId,
        report: { userId },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found or access denied');
    }

    // Verify component and version exist
    const component = await this.prisma.component.findFirst({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    const componentVersionExists = await this.prisma.componentVersion.findFirst({
      where: { 
        componentId,
        version: componentVersion,
      },
    });

    if (!componentVersionExists) {
      throw new NotFoundException(`Component version ${componentVersion} not found`);
    }

    try {
      // Create page component instance
      const pageComponent = await this.prisma.pageComponent.create({
        data: {
          pageId,
          componentId,
          componentVersion,
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          zIndex: position.zIndex || 0,
          props,
        },
      });

      // Update MongoDB page definition to include the new component instance
      await this.reportPageDefinitionModel.updateOne(
        { pageId },
        {
          $push: {
            componentInstances: {
              id: pageComponent.id,
              componentId,
              componentVersion,
              position: {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
                zIndex: position.zIndex || 0,
              },
              props,
              dataBindings: {},
              responsive: {},
            },
          },
          $inc: { version: 1 },
        },
      );

      // Update component usage count
      await this.prisma.component.update({
        where: { id: componentId },
        data: { usageCount: { increment: 1 } },
      });

      return {
        message: 'Component added to page successfully',
        componentInstanceId: pageComponent.id,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Component instance already exists at this position');
        }
      }
      throw error;
    }
  }

  async removeComponentFromPage(
    pageId: string,
    componentInstanceId: string,
    userId: string,
  ): Promise<{ message: string }> {
    // Verify page exists and user has access
    const pageComponent = await this.prisma.pageComponent.findFirst({
      where: { 
        id: componentInstanceId,
        page: {
          id: pageId,
          report: { userId },
        },
      },
    });

    if (!pageComponent) {
      throw new NotFoundException('Component instance not found or access denied');
    }

    try {
      // Remove from PostgreSQL
      await this.prisma.pageComponent.delete({
        where: { id: componentInstanceId },
      });

      // Remove from MongoDB page definition
      await this.reportPageDefinitionModel.updateOne(
        { pageId },
        {
          $pull: {
            componentInstances: { id: componentInstanceId },
          },
          $inc: { version: 1 },
        },
      );

      // Update component usage count
      await this.prisma.component.update({
        where: { id: pageComponent.componentId },
        data: { usageCount: { decrement: 1 } },
      });

      return { message: 'Component removed from page successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Component instance not found');
        }
      }
      throw error;
    }
  }

  async getPageStats(userId: string): Promise<PageStatsDto> {
    const [
      totalPages,
      layoutTypeStats,
      totalComponents,
      pageSizeStats,
      pagesPerReportStats,
    ] = await Promise.all([
      // Total pages for user
      this.prisma.reportPage.count({ 
        where: { report: { userId } },
      }),
      
      // Layout type distribution
      this.prisma.reportPage.groupBy({
        by: ['layoutType'],
        where: { report: { userId } },
        _count: { layoutType: true },
        orderBy: { _count: { layoutType: 'desc' } },
        take: 5,
      }),
      
      // Total components for calculating average
      this.prisma.pageComponent.count({
        where: { page: { report: { userId } } },
      }),
      
      // Page size distribution
      this.prisma.reportPage.groupBy({
        by: ['width', 'height'],
        where: { report: { userId } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      
      // Pages per report stats
      this.prisma.$queryRaw<Array<{ pages_count: number; report_count: number }>>`
        SELECT 
          COUNT(rp.id)::int as pages_count,
          COUNT(DISTINCT rp.report_id)::int as report_count
        FROM report_pages rp
        INNER JOIN reports r ON r.id = rp.report_id
        WHERE r.user_id = ${userId}
      `,
    ]);

    // Calculate average components per page
    const averageComponentsPerPage = totalPages > 0 ? totalComponents / totalPages : 0;

    // Process page size distribution
    const pageSizeDistribution: Record<string, number> = {};
    pageSizeStats.forEach(stat => {
      const key = `${stat.width}x${stat.height}`;
      pageSizeDistribution[key] = stat._count.id;
    });

    // Get min/max/average pages per report
    const reportPagesStats = await this.prisma.$queryRaw<Array<{ 
      min_pages: number; 
      max_pages: number; 
      avg_pages: number; 
    }>>`
      SELECT 
        MIN(page_count)::int as min_pages,
        MAX(page_count)::int as max_pages,
        AVG(page_count)::float as avg_pages
      FROM (
        SELECT COUNT(rp.id) as page_count
        FROM reports r
        LEFT JOIN report_pages rp ON r.id = rp.report_id
        WHERE r.user_id = ${userId}
        GROUP BY r.id
      ) as report_stats
    `;

    const pagesPerReport = reportPagesStats[0] || { min_pages: 0, max_pages: 0, avg_pages: 0 };

    return {
      totalPages,
      averageComponentsPerPage: Math.round(averageComponentsPerPage * 10) / 10,
      topLayoutTypes: layoutTypeStats.map(stat => ({
        layoutType: stat.layoutType,
        count: stat._count.layoutType,
      })),
      pageSizeDistribution,
      pagesPerReport: {
        min: pagesPerReport.min_pages,
        max: pagesPerReport.max_pages,
        average: Math.round(pagesPerReport.avg_pages * 10) / 10,
      },
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.reportPage.findFirst({ take: 1 });
      return true;
    } catch {
      return false;
    }
  }

  private async addComponentsToPage(
    pageId: string, 
    components: Array<{
      componentId: string;
      componentVersion: number;
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex?: number;
      props?: Record<string, any>;
    }>,
    userId: string,
  ): Promise<void> {
    const pageComponentData = components.map(comp => ({
      pageId,
      componentId: comp.componentId,
      componentVersion: comp.componentVersion,
      x: comp.x,
      y: comp.y,
      width: comp.width,
      height: comp.height,
      zIndex: comp.zIndex || 0,
      props: comp.props || {},
    }));

    await this.prisma.pageComponent.createMany({
      data: pageComponentData,
    });

    // Update component usage counts
    const componentIds = components.map(c => c.componentId);
    const uniqueComponentIds = Array.from(new Set(componentIds));
    
    for (const componentId of uniqueComponentIds) {
      const usageCount = componentIds.filter(id => id === componentId).length;
      await this.prisma.component.update({
        where: { id: componentId },
        data: { usageCount: { increment: usageCount } },
      });
    }
  }

  private mapPageToDto(page: ReportPage): ReportPageDto {
    return {
      id: page.id,
      reportId: page.reportId,
      title: page.title,
      description: page.description,
      order: page.order,
      layoutType: page.layoutType,
      columns: page.columns,
      width: page.width,
      height: page.height,
      version: page.version,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  private async mapPageWithComponentsToDto(page: any): Promise<ReportPageWithComponentsDto> {
    const basePage = this.mapPageToDto(page);
    
    // Get MongoDB page definition for additional data
    const pageDefinition = await this.reportPageDefinitionModel.findOne({
      pageId: page.id,
    });
    
    // Map components
    const components = page.components?.map((component: any) => ({
      id: component.id,
      componentId: component.componentId,
      componentVersion: component.componentVersion,
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      rotation: component.rotation,
      zIndex: component.zIndex,
      props: component.props,
      isVisible: component.isVisible,
      isLocked: component.isLocked,
      createdAt: component.createdAt.toISOString(),
      updatedAt: component.updatedAt.toISOString(),
    })) || [];

    return {
      ...basePage,
      components,
      layout: pageDefinition?.layout || {
        type: 'flexible',
        columns: page.columns,
      },
      pageSettings: pageDefinition?.pageSettings || {
        background: { color: '#FFFFFF' },
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      interactions: pageDefinition?.interactions || {
        navigation: {},
        animations: [],
        events: {},
      },
    };
  }
}