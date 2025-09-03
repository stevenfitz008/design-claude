import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  ComponentDefinitionDocument, 
  ComponentDefinitionDocumentType,
  ComponentDefinition 
} from '../../../database/mongodb/schemas';

export interface CreateComponentRequest {
  name: string;
  description?: string;
  type: 'chart' | 'text' | 'image' | 'table' | 'shape' | 'container' | 'form' | 'media' | 'widget';
  category: string;
  tags?: string[];
  definition: ComponentDefinition;
  defaultProps?: Record<string, any>;
  supportedFormats?: string[];
  dependencies?: string[];
}

export interface UpdateComponentRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  definition?: Partial<ComponentDefinition>;
  defaultProps?: Record<string, any>;
  supportedFormats?: string[];
}

export interface ComponentVersion {
  version: number;
  definition: ComponentDefinition;
  metadata: any;
  isActive: boolean;
  isStable: boolean;
  createdAt: Date;
  changeLog?: string;
}

@Injectable()
export class ComponentService {
  private readonly logger = new Logger(ComponentService.name);

  constructor(
    private prisma: PrismaService,
    @InjectModel(ComponentDefinitionDocument.name)
    private componentDefinitionModel: Model<ComponentDefinitionDocumentType>,
  ) {}

  /**
   * Create a new component
   */
  async createComponent(userId: string, data: CreateComponentRequest) {
    try {
      this.logger.log(`Creating component: ${data.name}`);

      // Validate component definition
      this.validateComponentDefinition(data.definition);

      // Create component in PostgreSQL
      const component = await this.prisma.component.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type.toUpperCase() as any,
          category: data.category,
          tags: data.tags || [],
          definitionId: '', // Will be updated after MongoDB creation
          defaultProps: data.defaultProps || {},
          supportedFormats: data.supportedFormats || ['SVG', 'HTML'],
          createdBy: userId,
          version: 1,
        },
      });

      // Store component definition in MongoDB
      const definitionDoc = await this.componentDefinitionModel.create({
        componentId: component.id,
        version: 1,
        createdBy: userId,
        definition: data.definition,
        metadata: {
          changeLog: 'Initial component creation',
          performanceMetrics: {
            complexity: this.calculateComplexity(data.definition),
            estimatedRenderTime: this.estimateRenderTime(data.definition),
          },
        },
        isActive: true,
        isStable: false,
      });

      // Update component with definition ID
      await this.prisma.component.update({
        where: { id: component.id },
        data: { definitionId: definitionDoc._id.toString() },
      });

      // Create first version record
      await this.prisma.componentVersion.create({
        data: {
          componentId: component.id,
          version: 1,
          definitionId: definitionDoc._id.toString(),
          props: data.defaultProps || {},
          isStable: false,
          createdBy: userId,
        },
      });

      return this.getComponent(component.id, userId);
    } catch (error) {
      this.logger.error('Failed to create component:', error);
      throw error;
    }
  }

  /**
   * Get component with specific version
   */
  async getComponent(componentId: string, userId?: string, version?: number) {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, avatar: true }
        },
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, name: true, version: true }
            }
          }
        }
      }
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    // Check access permissions
    if (!this.canAccessComponent(component, userId)) {
      throw new NotFoundException('Component not found');
    }

    // Get specific version or latest
    const targetVersion = version || component.version;
    const versionRecord = component.versions.find(v => v.version === targetVersion);
    
    if (!versionRecord) {
      throw new NotFoundException(`Component version ${targetVersion} not found`);
    }

    // Get definition from MongoDB
    const definition = await this.componentDefinitionModel.findOne({
      componentId,
      version: targetVersion,
    });

    return {
      ...component,
      currentVersion: targetVersion,
      definition: definition?.definition,
      versionMetadata: definition?.metadata,
    };
  }

  /**
   * Update component (creates new version)
   */
  async updateComponent(
    componentId: string,
    userId: string,
    data: UpdateComponentRequest,
    changeLog?: string
  ) {
    try {
      const component = await this.prisma.component.findUnique({
        where: { id: componentId },
        include: { versions: { orderBy: { version: 'desc' } } }
      });

      if (!component) {
        throw new NotFoundException('Component not found');
      }

      if (!this.canModifyComponent(component, userId)) {
        throw new BadRequestException('Not authorized to modify this component');
      }

      const newVersion = component.version + 1;

      // Get current definition to merge changes
      const currentDefinition = await this.componentDefinitionModel.findOne({
        componentId,
        version: component.version,
      });

      if (!currentDefinition) {
        throw new NotFoundException('Current component definition not found');
      }

      // Merge definition changes
      const updatedDefinition = data.definition 
        ? this.mergeDefinitions(currentDefinition.definition, data.definition)
        : currentDefinition.definition;

      // Validate merged definition
      this.validateComponentDefinition(updatedDefinition);

      // Create new version in MongoDB
      const definitionDoc = await this.componentDefinitionModel.create({
        componentId,
        version: newVersion,
        createdBy: userId,
        definition: updatedDefinition,
        metadata: {
          changeLog: changeLog || 'Component update',
          performanceMetrics: {
            complexity: this.calculateComplexity(updatedDefinition),
            estimatedRenderTime: this.estimateRenderTime(updatedDefinition),
          },
        },
        isActive: true,
        isStable: false,
      });

      // Update component in PostgreSQL
      const updatedComponent = await this.prisma.component.update({
        where: { id: componentId },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          tags: data.tags,
          definitionId: definitionDoc._id.toString(),
          defaultProps: data.defaultProps,
          supportedFormats: data.supportedFormats,
          version: newVersion,
          usageCount: { increment: 1 },
        },
      });

      // Create version record
      await this.prisma.componentVersion.create({
        data: {
          componentId,
          version: newVersion,
          definitionId: definitionDoc._id.toString(),
          changeLog: changeLog || 'Component update',
          props: data.defaultProps || component.defaultProps,
          isStable: false,
          createdBy: userId,
        },
      });

      // Mark previous version as inactive
      await this.componentDefinitionModel.updateOne(
        { componentId, version: component.version },
        { $set: { isActive: false } }
      );

      return this.getComponent(componentId, userId, newVersion);
    } catch (error) {
      this.logger.error('Failed to update component:', error);
      throw error;
    }
  }

  /**
   * List components with filtering
   */
  async listComponents(
    userId?: string,
    filters: {
      type?: string;
      category?: string;
      tags?: string[];
      search?: string;
      isSystem?: boolean;
      createdBy?: string;
      page?: number;
      limit?: number;
      sortBy?: 'name' | 'createdAt' | 'usageCount' | 'version';
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
        { createdBy: userId },
        { isPublished: true }
      ];
    } else {
      where.isPublished = true;
    }

    // Filters
    if (filters.type) {
      where.type = filters.type.toUpperCase();
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
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    // Sorting
    const orderBy: any = {};
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortField] = sortOrder;

    const [components, total] = await Promise.all([
      this.prisma.component.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          },
          versions: {
            take: 1,
            orderBy: { version: 'desc' }
          }
        }
      }),
      this.prisma.component.count({ where })
    ]);

    return {
      components,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark component version as stable
   */
  async markVersionStable(componentId: string, version: number, userId: string) {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId }
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    if (!this.canModifyComponent(component, userId)) {
      throw new BadRequestException('Not authorized to modify this component');
    }

    await Promise.all([
      this.prisma.componentVersion.update({
        where: {
          componentId_version: { componentId, version }
        },
        data: { isStable: true }
      }),
      this.componentDefinitionModel.updateOne(
        { componentId, version },
        { $set: { isStable: true } }
      )
    ]);

    return this.getComponent(componentId, userId, version);
  }

  /**
   * Publish component (make public)
   */
  async publishComponent(componentId: string, userId: string) {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId }
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    if (!this.canModifyComponent(component, userId)) {
      throw new BadRequestException('Not authorized to modify this component');
    }

    return this.prisma.component.update({
      where: { id: componentId },
      data: { isPublished: true }
    });
  }

  /**
   * Get component usage statistics
   */
  async getComponentStats(componentId: string, userId?: string) {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
      include: {
        pageComponents: {
          include: {
            page: {
              include: {
                report: {
                  select: { id: true, title: true, userId: true }
                }
              }
            }
          }
        }
      }
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    if (!this.canAccessComponent(component, userId)) {
      throw new NotFoundException('Component not found');
    }

    const usage = component.pageComponents.map(pc => ({
      reportId: pc.page.report.id,
      reportTitle: pc.page.report.title,
      pageId: pc.page.id,
      version: pc.componentVersion,
      createdAt: pc.createdAt,
    }));

    return {
      componentId,
      totalUsage: component.usageCount,
      activeUsage: usage.length,
      usage,
      versions: await this.getVersionHistory(componentId),
    };
  }

  /**
   * Get version history
   */
  async getVersionHistory(componentId: string) {
    return this.prisma.componentVersion.findMany({
      where: { componentId },
      orderBy: { version: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });
  }

  // Private helper methods

  private validateComponentDefinition(definition: ComponentDefinition) {
    if (!definition.name || !definition.type) {
      throw new BadRequestException('Component definition must include name and type');
    }

    if (!definition.template) {
      throw new BadRequestException('Component definition must include template');
    }

    if (!definition.propsSchema) {
      throw new BadRequestException('Component definition must include props schema');
    }

    // Validate props schema structure
    if (!definition.propsSchema.properties || !definition.propsSchema.required) {
      throw new BadRequestException('Props schema must include properties and required fields');
    }
  }

  private mergeDefinitions(current: ComponentDefinition, updates: Partial<ComponentDefinition>): ComponentDefinition {
    return {
      ...current,
      ...updates,
      template: updates.template ? { ...current.template, ...updates.template } : current.template,
      propsSchema: updates.propsSchema ? { 
        ...current.propsSchema, 
        ...updates.propsSchema,
        properties: { 
          ...current.propsSchema.properties, 
          ...(updates.propsSchema.properties || {}) 
        }
      } : current.propsSchema,
      rendering: updates.rendering ? { ...current.rendering, ...updates.rendering } : current.rendering,
    };
  }

  private calculateComplexity(definition: ComponentDefinition): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Count template elements
    if (definition.template.html) score += definition.template.html.length / 1000;
    if (definition.template.svg) score += definition.template.svg.length / 1000;
    if (definition.template.canvas) score += definition.template.canvas.length * 2;
    
    // Count properties
    score += Object.keys(definition.propsSchema.properties).length * 0.5;
    
    // Check for data binding
    if (definition.dataBinding) score += 2;
    
    // Check for interactions
    if (definition.interactions) score += 1;

    if (score < 5) return 'low';
    if (score < 15) return 'medium';
    return 'high';
  }

  private estimateRenderTime(definition: ComponentDefinition): number {
    // Simple estimation based on complexity
    const complexity = this.calculateComplexity(definition);
    switch (complexity) {
      case 'low': return 50;
      case 'medium': return 200;
      case 'high': return 500;
      default: return 100;
    }
  }

  private canAccessComponent(component: any, userId?: string): boolean {
    if (component.isPublished) return true;
    if (component.isSystem) return true;
    return component.createdBy === userId;
  }

  private canModifyComponent(component: any, userId: string): boolean {
    return component.createdBy === userId || component.isSystem === false;
  }
}