import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../../database/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportDto, ReportWithPagesDto, ReportStatsDto } from './dto/report-response.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportPageDefinition, ReportPageDefinitionType } from '../../database/mongodb/schemas';
import { Report, Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(ReportPageDefinition.name)
    private readonly reportPageDefinitionModel: Model<ReportPageDefinitionType>,
  ) {}

  async create(createReportDto: CreateReportDto, userId: string): Promise<ReportDto> {
    try {
      // Check if user has reached report limit (if applicable)
      const userReportCount = await this.prisma.report.count({
        where: { userId },
      });

      // Basic limit check - can be enhanced with user plan-based limits
      const MAX_REPORTS = 50; // Can be moved to configuration
      if (userReportCount >= MAX_REPORTS) {
        throw new ForbiddenException('Report limit reached. Upgrade your plan to create more reports.');
      }

      // Create the report
      const report = await this.prisma.report.create({
        data: {
          title: createReportDto.title,
          description: createReportDto.description,
          author: createReportDto.author,
          tags: createReportDto.tags || [],
          category: createReportDto.category,
          isPublished: createReportDto.isPublished || false,
          isPublic: createReportDto.isPublic || false,
          userId,
          version: 1,
        },
      });

      return this.mapReportToDto(report);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A report with this title already exists');
        }
      }
      throw error;
    }
  }

  async findAll(
    queryDto: ReportQueryDto,
    userId: string,
  ): Promise<{ data: ReportDto[] | ReportWithPagesDto[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      tags,
      isPublished,
      isPublic,
      author,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      includePages = false,
      minVersion,
      maxVersion,
      createdAfter,
      createdBefore,
    } = queryDto;

    // Build where clause
    const where: Prisma.ReportWhereInput = {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(isPublished !== undefined && { isPublished }),
      ...(isPublic !== undefined && { isPublic }),
      ...(author && { author: { contains: author, mode: 'insensitive' } }),
      ...(minVersion && { version: { gte: minVersion } }),
      ...(maxVersion && { version: { lte: maxVersion } }),
      ...(createdAfter && { createdAt: { gte: new Date(createdAfter) } }),
      ...(createdBefore && { createdAt: { lte: new Date(createdBefore) } }),
    };

    // Count total records
    const total = await this.prisma.report.count({ where });

    // Fetch reports with pagination
    const reports = await this.prisma.report.findMany({
      where,
      include: includePages ? { pages: { orderBy: { order: 'asc' } } } : undefined,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(
      reports.map(async (report) => {
        if (includePages) {
          return this.mapReportWithPagesToDto(report as any);
        }
        return this.mapReportToDto(report);
      })
    );

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async findOne(id: string, userId: string, includePages = false): Promise<ReportDto | ReportWithPagesDto> {
    const report = await this.prisma.report.findFirst({
      where: { id, userId },
      include: includePages ? { pages: { orderBy: { order: 'asc' } } } : undefined,
    });

    if (!report) {
      throw new NotFoundException('Report not found or access denied');
    }

    if (includePages) {
      return this.mapReportWithPagesToDto(report as any);
    }

    return this.mapReportToDto(report);
  }

  async update(id: string, updateReportDto: UpdateReportDto, userId: string): Promise<ReportDto> {
    try {
      // Check if report exists and user has access
      const existingReport = await this.prisma.report.findFirst({
        where: { id, userId },
      });

      if (!existingReport) {
        throw new NotFoundException('Report not found or access denied');
      }

      // Optimistic concurrency control
      if (updateReportDto.version && updateReportDto.version !== existingReport.version) {
        throw new ConflictException('Report has been modified by another user. Please refresh and try again.');
      }

      const report = await this.prisma.report.update({
        where: { id },
        data: {
          ...(updateReportDto.title && { title: updateReportDto.title }),
          ...(updateReportDto.description !== undefined && { description: updateReportDto.description }),
          ...(updateReportDto.author && { author: updateReportDto.author }),
          ...(updateReportDto.tags && { tags: updateReportDto.tags }),
          ...(updateReportDto.category !== undefined && { category: updateReportDto.category }),
          ...(updateReportDto.isPublished !== undefined && { 
            isPublished: updateReportDto.isPublished,
            ...(updateReportDto.isPublished && !existingReport.publishedAt && { publishedAt: new Date() }),
          }),
          ...(updateReportDto.isPublic !== undefined && { isPublic: updateReportDto.isPublic }),
          version: existingReport.version + 1,
        },
      });

      return this.mapReportToDto(report);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A report with this title already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Report not found or access denied');
        }
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    try {
      // Check if report exists and user has access
      const existingReport = await this.prisma.report.findFirst({
        where: { id, userId },
        include: { pages: { select: { id: true } } },
      });

      if (!existingReport) {
        throw new NotFoundException('Report not found or access denied');
      }

      // Delete related MongoDB documents first
      const pageIds = existingReport.pages.map(page => page.id);
      if (pageIds.length > 0) {
        await this.reportPageDefinitionModel.deleteMany({
          pageId: { $in: pageIds },
        });
      }

      // Delete the report (this will cascade delete pages due to foreign key constraints)
      await this.prisma.report.delete({
        where: { id },
      });

      return { message: 'Report deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Report not found or access denied');
        }
      }
      throw error;
    }
  }

  async duplicate(id: string, userId: string, newTitle?: string): Promise<ReportDto> {
    const sourceReport = await this.prisma.report.findFirst({
      where: { id, userId },
      include: { pages: { orderBy: { order: 'asc' } } },
    });

    if (!sourceReport) {
      throw new NotFoundException('Source report not found or access denied');
    }

    try {
      // Create duplicated report
      const duplicatedTitle = newTitle || `${sourceReport.title} (Copy)`;
      
      const newReport = await this.prisma.report.create({
        data: {
          title: duplicatedTitle,
          description: sourceReport.description,
          author: sourceReport.author,
          tags: sourceReport.tags,
          category: sourceReport.category,
          isPublished: false, // Copies start as drafts
          isPublic: false,
          userId,
          version: 1,
        },
      });

      // Duplicate pages if they exist
      if (sourceReport.pages.length > 0) {
        await Promise.all(
          sourceReport.pages.map(async (sourcePage) => {
            // Create new page record
            const newPage = await this.prisma.reportPage.create({
              data: {
                reportId: newReport.id,
                title: sourcePage.title,
                description: sourcePage.description,
                order: sourcePage.order,
                layoutType: sourcePage.layoutType,
                columns: sourcePage.columns,
                width: sourcePage.width,
                height: sourcePage.height,
                version: 1,
              },
            });

            // Copy MongoDB page definition if it exists
            const sourcePageDefinition = await this.reportPageDefinitionModel.findOne({
              pageId: sourcePage.id,
            });

            if (sourcePageDefinition) {
              await this.reportPageDefinitionModel.create({
                pageId: newPage.id,
                reportId: newReport.id,
                version: 1,
                layout: sourcePageDefinition.layout,
                componentInstances: sourcePageDefinition.componentInstances,
                pageSettings: sourcePageDefinition.pageSettings,
                interactions: sourcePageDefinition.interactions,
                metadata: sourcePageDefinition.metadata,
              });
            }
          })
        );
      }

      return this.mapReportToDto(newReport);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A report with this title already exists');
        }
      }
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<ReportStatsDto> {
    const [
      totalReports,
      publishedReports,
      totalPages,
      totalComponents,
      categoryStats,
      tagStats,
    ] = await Promise.all([
      this.prisma.report.count({ where: { userId } }),
      this.prisma.report.count({ where: { userId, isPublished: true } }),
      this.prisma.reportPage.count({ 
        where: { report: { userId } },
      }),
      this.prisma.pageComponent.count({
        where: { page: { report: { userId } } },
      }),
      this.prisma.report.groupBy({
        by: ['category'],
        where: { userId, category: { not: null } },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5,
      }),
      this.prisma.$queryRaw<Array<{ tag: string; count: number }>>`
        SELECT tag, COUNT(*) as count
        FROM (
          SELECT UNNEST(tags) as tag
          FROM reports
          WHERE user_id = ${userId}
        ) AS tag_counts
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

    const draftReports = totalReports - publishedReports;

    return {
      totalReports,
      publishedReports,
      draftReports,
      totalPages,
      totalComponents,
      topCategories: categoryStats.map(stat => ({
        category: stat.category!,
        count: stat._count.category,
      })),
      topTags: tagStats || [],
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.report.findFirst({ take: 1 });
      return true;
    } catch {
      return false;
    }
  }

  private mapReportToDto(report: Report): ReportDto {
    return {
      id: report.id,
      title: report.title,
      description: report.description,
      author: report.author,
      tags: report.tags,
      category: report.category,
      version: report.version,
      isPublished: report.isPublished,
      isPublic: report.isPublic,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      publishedAt: report.publishedAt?.toISOString(),
      userId: report.userId,
    };
  }

  private async mapReportWithPagesToDto(report: any): Promise<ReportWithPagesDto> {
    const baseReport = this.mapReportToDto(report);
    
    // Map pages - this would be handled by a pages service in a full implementation
    const pages = report.pages?.map((page: any) => ({
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
    })) || [];

    return {
      ...baseReport,
      pages,
    };
  }
}