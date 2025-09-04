import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../../database/prisma.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { 
  ComponentDto, 
  ComponentWithDefinitionDto, 
  ComponentVersionDto, 
  ComponentVersionWithDefinitionDto,
  ComponentUsageStatsDto,
  ComponentStatsDto 
} from './dto/component-response.dto';
import { ComponentQueryDto, ComponentVersionQueryDto } from './dto/component-query.dto';
import { ComponentDefinitionDocument, ComponentDefinitionDocumentType, ComponentDefinition } from '../../database/mongodb/schemas';
import { Component, ComponentVersion, Prisma, ComponentType, ExportFormat } from '@prisma/client';

@Injectable()
export class ComponentsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(ComponentDefinitionDocument.name)
    private readonly componentDefinitionModel: Model<ComponentDefinitionDocumentType>,
  ) {}

  async create(createComponentDto: CreateComponentDto, userId: string): Promise<ComponentDto> {
    try {
      // Check if user has reached component limit (if applicable)
      const userComponentCount = await this.prisma.component.count({
        where: { createdBy: userId },
      });

      // Basic limit check - can be enhanced with user plan-based limits
      const MAX_COMPONENTS = 100; // Can be moved to configuration
      if (userComponentCount >= MAX_COMPONENTS) {
        throw new ForbiddenException('Component limit reached. Upgrade your plan to create more components.');
      }

      // Create MongoDB component definition first
      const componentDefinition: ComponentDefinition = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: createComponentDto.name,
        type: createComponentDto.type.toLowerCase() as any,
        template: createComponentDto.template,
        propsSchema: createComponentDto.propsSchema,
        rendering: {
          supportedFormats: createComponentDto.rendering.supportedFormats,
          dependencies: createComponentDto.rendering.dependencies || [],
          performance: createComponentDto.rendering.performance,
        },
        dataBinding: createComponentDto.dataBinding,
        interactions: createComponentDto.interactions,
      };

      const definitionDoc = await this.componentDefinitionModel.create({
        componentId: '', // Will be updated after component creation
        version: 1,
        createdBy: userId,
        definition: componentDefinition,
        metadata: {
          changeLog: 'Initial component creation',
          testResults: {},
          performanceMetrics: {},
        },
        isActive: true,
        isStable: false,
      });

      // Create the component record in PostgreSQL
      const component = await this.prisma.component.create({
        data: {
          name: createComponentDto.name,
          description: createComponentDto.description,
          type: createComponentDto.type,
          category: createComponentDto.category,
          definitionId: definitionDoc._id.toString(),
          defaultProps: createComponentDto.defaultProps || {},
          supportedFormats: createComponentDto.rendering.supportedFormats,
          version: 1,
          isPublished: createComponentDto.isPublished || false,
          tags: createComponentDto.tags || [],
          isSystem: createComponentDto.isSystem || false,
          usageCount: 0,
          createdBy: userId,
        },
      });

      // Update MongoDB document with component ID
      await this.componentDefinitionModel.updateOne(
        { _id: definitionDoc._id },
        { $set: { componentId: component.id } },
      );

      // Create initial version
      await this.prisma.componentVersion.create({
        data: {
          componentId: component.id,
          version: 1,
          definitionId: definitionDoc._id.toString(),
          changeLog: 'Initial version',
          props: createComponentDto.defaultProps || {},
          isStable: false,
          isDeprecated: false,
          createdBy: userId,
        },
      });

      return this.mapComponentToDto(component);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A component with this name already exists');
        }
      }
      throw error;
    }
  }

  async findAll(
    queryDto: ComponentQueryDto,
    userId: string,
  ): Promise<{ data: ComponentDto[] | ComponentWithDefinitionDto[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      category,
      tags,
      isPublished,
      isSystem,
      supportedFormat,
      minUsageCount,
      maxUsageCount,
      createdBy,
      sortBy = 'name',
      sortOrder = 'asc',
      includeDefinition = false,
    } = queryDto;

    // Build where clause
    const where: Prisma.ComponentWhereInput = {
      // Show user's own components or published components
      OR: [
        { createdBy: userId },
        { isPublished: true },
      ],
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(isPublished !== undefined && { isPublished }),
      ...(isSystem !== undefined && { isSystem }),
      ...(supportedFormat && { supportedFormats: { has: supportedFormat } }),
      ...(minUsageCount !== undefined && { usageCount: { gte: minUsageCount } }),
      ...(maxUsageCount !== undefined && { usageCount: { lte: maxUsageCount } }),
      ...(createdBy && { createdBy }),
    };

    // Count total records
    const total = await this.prisma.component.count({ where });

    // Fetch components with pagination
    const components = await this.prisma.component.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(
      components.map(async (component) => {
        if (includeDefinition) {
          return this.mapComponentWithDefinitionToDto(component);
        }
        return this.mapComponentToDto(component);
      })
    );

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async findOne(id: string, userId: string, includeDefinition = false): Promise<ComponentDto | ComponentWithDefinitionDto> {
    const component = await this.prisma.component.findFirst({
      where: {
        id,
        OR: [
          { createdBy: userId },
          { isPublished: true },
        ],
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found or access denied');
    }

    if (includeDefinition) {
      return this.mapComponentWithDefinitionToDto(component);
    }

    return this.mapComponentToDto(component);
  }

  async update(id: string, updateComponentDto: UpdateComponentDto, userId: string): Promise<ComponentDto> {
    try {
      // Check if component exists and user has access
      const existingComponent = await this.prisma.component.findFirst({
        where: { 
          id,
          createdBy: userId, // Only owner can update
        },
      });

      if (!existingComponent) {
        throw new NotFoundException('Component not found or access denied');
      }

      // Optimistic concurrency control
      if (updateComponentDto.version && updateComponentDto.version !== existingComponent.version) {
        throw new ConflictException('Component has been modified by another user. Please refresh and try again.');
      }

      // If definition fields are updated, create a new version
      const needsNewVersion = updateComponentDto.template || 
                             updateComponentDto.propsSchema || 
                             updateComponentDto.rendering ||
                             updateComponentDto.dataBinding ||
                             updateComponentDto.interactions;

      let newVersionNumber = existingComponent.version;
      let newDefinitionId = existingComponent.definitionId;

      if (needsNewVersion) {
        newVersionNumber = existingComponent.version + 1;

        // Create new MongoDB definition
        const componentDefinition: ComponentDefinition = {
          id: existingComponent.id,
          name: updateComponentDto.name || existingComponent.name,
          type: (updateComponentDto.type?.toLowerCase() || existingComponent.type.toLowerCase()) as any,
          template: updateComponentDto.template || (await this.getComponentDefinition(existingComponent.definitionId))?.template || { styles: {} },
          propsSchema: updateComponentDto.propsSchema || (await this.getComponentDefinition(existingComponent.definitionId))?.propsSchema || { properties: {}, required: [] },
          rendering: updateComponentDto.rendering ? {
            supportedFormats: updateComponentDto.rendering.supportedFormats,
            dependencies: updateComponentDto.rendering.dependencies || [],
            performance: updateComponentDto.rendering.performance,
          } : (await this.getComponentDefinition(existingComponent.definitionId))?.rendering || { 
            supportedFormats: [], 
            dependencies: [], 
            performance: { complexity: 'low', estimatedRenderTime: 0, memoryUsage: 0 }
          },
          dataBinding: updateComponentDto.dataBinding || (await this.getComponentDefinition(existingComponent.definitionId))?.dataBinding,
          interactions: updateComponentDto.interactions || (await this.getComponentDefinition(existingComponent.definitionId))?.interactions,
        };

        const newDefinitionDoc = await this.componentDefinitionModel.create({
          componentId: id,
          version: newVersionNumber,
          createdBy: userId,
          definition: componentDefinition,
          metadata: {
            changeLog: 'Component updated',
            testResults: {},
            performanceMetrics: {},
          },
          isActive: true,
          isStable: false,
        });

        newDefinitionId = newDefinitionDoc._id.toString();

        // Create new component version
        await this.prisma.componentVersion.create({
          data: {
            componentId: id,
            version: newVersionNumber,
            definitionId: newDefinitionId,
            changeLog: `Updated component - Version ${newVersionNumber}`,
            props: updateComponentDto.defaultProps || existingComponent.defaultProps,
            isStable: false,
            isDeprecated: false,
            createdBy: userId,
          },
        });
      }

      // Update PostgreSQL component record
      const updatedComponent = await this.prisma.component.update({
        where: { id },
        data: {
          ...(updateComponentDto.name && { name: updateComponentDto.name }),
          ...(updateComponentDto.description !== undefined && { description: updateComponentDto.description }),
          ...(updateComponentDto.type && { type: updateComponentDto.type }),
          ...(updateComponentDto.category && { category: updateComponentDto.category }),
          ...(needsNewVersion && { definitionId: newDefinitionId }),
          ...(updateComponentDto.defaultProps && { defaultProps: updateComponentDto.defaultProps }),
          ...(updateComponentDto.rendering?.supportedFormats && { supportedFormats: updateComponentDto.rendering.supportedFormats }),
          ...(needsNewVersion && { version: newVersionNumber }),
          ...(updateComponentDto.isPublished !== undefined && { isPublished: updateComponentDto.isPublished }),
          ...(updateComponentDto.tags && { tags: updateComponentDto.tags }),
          ...(updateComponentDto.isSystem !== undefined && { isSystem: updateComponentDto.isSystem }),
        },
      });

      return this.mapComponentToDto(updatedComponent);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A component with this name already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Component not found or access denied');
        }
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    try {
      // Check if component exists and user has access
      const existingComponent = await this.prisma.component.findFirst({
        where: { 
          id,
          createdBy: userId, // Only owner can delete
        },
        include: { 
          pageComponents: true,
          versions: true,
        },
      });

      if (!existingComponent) {
        throw new NotFoundException('Component not found or access denied');
      }

      // Check if component is in use
      if (existingComponent.pageComponents.length > 0) {
        throw new BadRequestException('Cannot delete component that is currently in use in pages');
      }

      // Delete all MongoDB definitions for this component
      await this.componentDefinitionModel.deleteMany({
        componentId: id,
      });

      // Delete the component (this will cascade delete versions due to foreign key constraints)
      await this.prisma.component.delete({
        where: { id },
      });

      return { message: 'Component deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Component not found or access denied');
        }
      }
      throw error;
    }
  }

  async getVersions(
    componentId: string, 
    queryDto: ComponentVersionQueryDto, 
    userId: string
  ): Promise<{ data: ComponentVersionDto[] | ComponentVersionWithDefinitionDto[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      limit = 10,
      isStable,
      excludeDeprecated = true,
      minVersion,
      maxVersion,
      createdBy,
      sortBy = 'version',
      sortOrder = 'desc',
      includeDefinition = false,
    } = queryDto;

    // Verify component exists and user has access
    const component = await this.prisma.component.findFirst({
      where: {
        id: componentId,
        OR: [
          { createdBy: userId },
          { isPublished: true },
        ],
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found or access denied');
    }

    // Build where clause
    const where: Prisma.ComponentVersionWhereInput = {
      componentId,
      ...(isStable !== undefined && { isStable }),
      ...(excludeDeprecated && { isDeprecated: false }),
      ...(minVersion && { version: { gte: minVersion } }),
      ...(maxVersion && { version: { lte: maxVersion } }),
      ...(createdBy && { createdBy }),
    };

    // Count total records
    const total = await this.prisma.componentVersion.count({ where });

    // Fetch versions with pagination
    const versions = await this.prisma.componentVersion.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(
      versions.map(async (version) => {
        if (includeDefinition) {
          return this.mapVersionWithDefinitionToDto(version);
        }
        return this.mapVersionToDto(version);
      })
    );

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async createVersion(
    componentId: string,
    changeLog: string,
    markStable = false,
    userId: string,
  ): Promise<ComponentVersionDto> {
    // Check if component exists and user has access
    const existingComponent = await this.prisma.component.findFirst({
      where: { 
        id: componentId,
        createdBy: userId, // Only owner can create versions
      },
    });

    if (!existingComponent) {
      throw new NotFoundException('Component not found or access denied');
    }

    try {
      // Get latest version number
      const latestVersion = await this.prisma.componentVersion.findFirst({
        where: { componentId },
        orderBy: { version: 'desc' },
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      // Get current component definition
      const currentDefinition = await this.getComponentDefinition(existingComponent.definitionId);
      if (!currentDefinition) {
        throw new BadRequestException('Current component definition not found');
      }

      // Create new MongoDB definition (copy from current)
      const newDefinitionDoc = await this.componentDefinitionModel.create({
        componentId,
        version: newVersionNumber,
        createdBy: userId,
        definition: currentDefinition,
        metadata: {
          changeLog,
          testResults: {},
          performanceMetrics: {},
        },
        isActive: true,
        isStable: markStable,
      });

      // Create new component version
      const newVersion = await this.prisma.componentVersion.create({
        data: {
          componentId,
          version: newVersionNumber,
          definitionId: newDefinitionDoc._id.toString(),
          changeLog,
          props: existingComponent.defaultProps,
          isStable: markStable,
          isDeprecated: false,
          createdBy: userId,
        },
      });

      // Update component's current version
      await this.prisma.component.update({
        where: { id: componentId },
        data: { 
          version: newVersionNumber,
          definitionId: newDefinitionDoc._id.toString(),
        },
      });

      return this.mapVersionToDto(newVersion);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Version conflict occurred');
        }
      }
      throw error;
    }
  }

  async updateVersion(
    componentId: string,
    version: number,
    updates: {
      changeLog?: string;
      isStable?: boolean;
      isDeprecated?: boolean;
      minVersion?: string;
      maxVersion?: string;
    },
    userId: string,
  ): Promise<ComponentVersionDto> {
    // Check if component exists and user has access
    const component = await this.prisma.component.findFirst({
      where: { 
        id: componentId,
        createdBy: userId, // Only owner can update versions
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found or access denied');
    }

    try {
      const updatedVersion = await this.prisma.componentVersion.update({
        where: { 
          componentId_version: {
            componentId,
            version,
          },
        },
        data: {
          ...(updates.changeLog && { changeLog: updates.changeLog }),
          ...(updates.isStable !== undefined && { isStable: updates.isStable }),
          ...(updates.isDeprecated !== undefined && { isDeprecated: updates.isDeprecated }),
          ...(updates.minVersion && { minVersion: updates.minVersion }),
          ...(updates.maxVersion && { maxVersion: updates.maxVersion }),
        },
      });

      return this.mapVersionToDto(updatedVersion);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Component version not found');
        }
      }
      throw error;
    }
  }

  async getUsageStats(componentId: string, userId: string): Promise<ComponentUsageStatsDto> {
    // Check if component exists and user has access
    const component = await this.prisma.component.findFirst({
      where: {
        id: componentId,
        OR: [
          { createdBy: userId },
          { isPublished: true },
        ],
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found or access denied');
    }

    const [
      totalUsage,
      pagesUsed,
      reportsUsed,
      uniqueUsers,
      usageByVersion,
      recentUsage,
      lastUsage,
    ] = await Promise.all([
      // Total usage count
      this.prisma.pageComponent.count({
        where: { componentId },
      }),
      
      // Unique pages using this component
      this.prisma.pageComponent.groupBy({
        by: ['pageId'],
        where: { componentId },
        _count: { pageId: true },
      }),
      
      // Unique reports using this component
      this.prisma.pageComponent.groupBy({
        by: ['pageId'],
        where: { componentId },
        _count: { pageId: true },
      }),
      
      // Unique users using this component
      this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT r.user_id) as count
        FROM page_components pc
        JOIN report_pages rp ON pc.page_id = rp.id
        JOIN reports r ON rp.report_id = r.id
        WHERE pc.component_id = ${componentId}
      `,
      
      // Usage by version
      this.prisma.pageComponent.groupBy({
        by: ['componentVersion'],
        where: { componentId },
        _count: { componentVersion: true },
        orderBy: { componentVersion: 'asc' },
      }),
      
      // Recent usage (last 30 days)
      this.prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT DATE(pc.created_at) as date, COUNT(*) as count
        FROM page_components pc
        WHERE pc.component_id = ${componentId}
          AND pc.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(pc.created_at)
        ORDER BY date ASC
      `,
      
      // Last usage
      this.prisma.pageComponent.findFirst({
        where: { componentId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      componentId,
      totalUsage,
      pagesUsed: pagesUsed.length,
      reportsUsed: reportsUsed.length,
      uniqueUsers: uniqueUsers[0]?.count || 0,
      usageByVersion: usageByVersion.map(stat => ({
        version: stat.componentVersion,
        count: stat._count.componentVersion,
      })),
      recentUsage: recentUsage || [],
      lastUsedAt: lastUsage?.createdAt.toISOString() || '',
    };
  }

  async getComponentStats(userId: string): Promise<ComponentStatsDto> {
    const [
      totalComponents,
      publishedComponents,
      systemComponents,
      userComponents,
      componentsByType,
      mostPopular,
      componentsByCategory,
      averageUsage,
      totalVersions,
    ] = await Promise.all([
      // Total components user has access to
      this.prisma.component.count({
        where: {
          OR: [
            { createdBy: userId },
            { isPublished: true },
          ],
        },
      }),
      
      // Published components
      this.prisma.component.count({
        where: {
          OR: [
            { createdBy: userId },
            { isPublished: true },
          ],
          isPublished: true,
        },
      }),
      
      // System components
      this.prisma.component.count({
        where: {
          OR: [
            { createdBy: userId },
            { isPublished: true },
          ],
          isSystem: true,
        },
      }),
      
      // User-created components
      this.prisma.component.count({
        where: { createdBy: userId },
      }),
      
      // Components by type
      this.prisma.component.groupBy({
        by: ['type'],
        where: {
          OR: [
            { createdBy: userId },
            { isPublished: true },
          ],
        },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      }),
      
      // Most popular components
      this.prisma.component.findMany({
        where: {
          OR: [
            { createdBy: userId },
            { isPublished: true },
          ],
        },
        orderBy: { usageCount: 'desc' },
        take: 10,
        select: { id: true, name: true, usageCount: true },
      }),
      
      // Components by category
      this.prisma.component.groupBy({
        by: ['category'],
        where: {
          OR: [
            { createdBy: userId },
            { isPublished: true },
          ],
        },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      }),
      
      // Average usage per component
      this.prisma.component.aggregate({
        where: {
          OR: [
            { createdBy: userId },
            { isPublished: true },
          ],
        },
        _avg: { usageCount: true },
      }),
      
      // Total versions
      this.prisma.componentVersion.count({
        where: {
          component: {
            OR: [
              { createdBy: userId },
              { isPublished: true },
            ],
          },
        },
      }),
    ]);

    return {
      totalComponents,
      publishedComponents,
      systemComponents,
      userComponents,
      componentsByType: componentsByType.map(stat => ({
        type: stat.type as ComponentType,
        count: stat._count.type,
      })),
      mostPopular,
      componentsByCategory: componentsByCategory.map(stat => ({
        category: stat.category,
        count: stat._count.category,
      })),
      averageUsagePerComponent: Math.round((averageUsage._avg.usageCount || 0) * 10) / 10,
      totalVersions,
      averageVersionsPerComponent: totalComponents > 0 ? Math.round((totalVersions / totalComponents) * 10) / 10 : 0,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.component.findFirst({ take: 1 });
      return true;
    } catch {
      return false;
    }
  }

  private async getComponentDefinition(definitionId: string): Promise<ComponentDefinition | null> {
    try {
      const definitionDoc = await this.componentDefinitionModel.findById(definitionId);
      return definitionDoc?.definition || null;
    } catch {
      return null;
    }
  }

  private mapComponentToDto(component: Component): ComponentDto {
    return {
      id: component.id,
      name: component.name,
      description: component.description,
      type: component.type as ComponentType,
      category: component.category,
      definitionId: component.definitionId,
      defaultProps: component.defaultProps as Record<string, any>,
      supportedFormats: component.supportedFormats as ExportFormat[],
      version: component.version,
      isPublished: component.isPublished,
      tags: component.tags,
      isSystem: component.isSystem,
      usageCount: component.usageCount,
      createdBy: component.createdBy,
      createdAt: component.createdAt.toISOString(),
      updatedAt: component.updatedAt.toISOString(),
    };
  }

  private async mapComponentWithDefinitionToDto(component: Component): Promise<ComponentWithDefinitionDto> {
    const baseComponent = this.mapComponentToDto(component);
    
    // Get MongoDB definition
    const definition = await this.getComponentDefinition(component.definitionId);
    
    if (!definition) {
      throw new NotFoundException('Component definition not found');
    }

    return {
      ...baseComponent,
      template: {
        html: definition.template.html,
        svg: definition.template.svg,
        canvas: definition.template.canvas,
        styles: definition.template.styles,
      },
      propsSchema: definition.propsSchema,
      rendering: definition.rendering,
      dataBinding: definition.dataBinding,
      interactions: definition.interactions,
    };
  }

  private mapVersionToDto(version: ComponentVersion): ComponentVersionDto {
    return {
      id: version.id,
      componentId: version.componentId,
      version: version.version,
      definitionId: version.definitionId,
      changeLog: version.changeLog,
      props: version.props as Record<string, any>,
      isStable: version.isStable,
      isDeprecated: version.isDeprecated,
      minVersion: version.minVersion,
      maxVersion: version.maxVersion,
      createdBy: version.createdBy,
      createdAt: version.createdAt.toISOString(),
    };
  }

  private async mapVersionWithDefinitionToDto(version: ComponentVersion): Promise<ComponentVersionWithDefinitionDto> {
    const baseVersion = this.mapVersionToDto(version);
    
    // Get component and its definition
    const component = await this.prisma.component.findUnique({
      where: { id: version.componentId },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    const definition = await this.mapComponentWithDefinitionToDto(component);

    return {
      ...baseVersion,
      definition,
    };
  }
}