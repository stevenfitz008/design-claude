import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../../database/prisma.service';
import { CanvasDocument } from '../../database/mongodb/schemas';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto, ProjectWithCanvasDto } from './dto/project-response.dto';
import { ProjectQueryDto } from './dto/project-query.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectModel(CanvasDocument.name) private canvasModel: Model<CanvasDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const {
      name,
      description,
      canvasWidth = 1920,
      canvasHeight = 1080,
      tags = [],
      isPublic = false,
      templateId
    } = createProjectDto;

    // Validate user exists and check limits
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { projects: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check project limits based on user plan
    const projectCount = user.projects.length;
    const maxProjects = user.limits?.maxProjects || 10;

    if (projectCount >= maxProjects) {
      throw new ForbiddenException(`Project limit reached. Current plan allows ${maxProjects} projects.`);
    }

    let canvasDocumentId: string | null = null;
    let initialCanvasData = {
      elements: [],
      layers: [{ id: 'layer-1', name: 'Layer 1', visible: true, locked: false, opacity: 1, blendMode: 'normal', elements: [] }],
      timeline: { duration: 30, currentTime: 0, markers: [] },
      viewport: { zoom: 1, panX: 0, panY: 0 },
      settings: { showGrid: true, snapToGrid: false, gridSize: 20 },
      backgroundColor: { r: 255, g: 255, b: 255, a: 1 }
    };

    // If templateId provided, copy template canvas data
    if (templateId) {
      const template = await this.prismaService.project.findFirst({
        where: { id: templateId, isTemplate: true, isPublic: true }
      });

      if (template?.canvasDocumentId) {
        const templateCanvas = await this.canvasModel.findById(template.canvasDocumentId);
        if (templateCanvas) {
          initialCanvasData = {
            elements: templateCanvas.elements || [],
            layers: templateCanvas.layers || initialCanvasData.layers,
            timeline: templateCanvas.timeline || initialCanvasData.timeline,
            viewport: templateCanvas.viewport || initialCanvasData.viewport,
            settings: templateCanvas.settings || initialCanvasData.settings,
            backgroundColor: templateCanvas.backgroundColor || initialCanvasData.backgroundColor
          };
        }
      }
    }

    try {
      // Create canvas document first
      const canvasDocument = new this.canvasModel({
        projectId: 'temp', // Will be updated after project creation
        userId,
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: initialCanvasData.backgroundColor,
        elements: initialCanvasData.elements,
        layers: initialCanvasData.layers,
        timeline: initialCanvasData.timeline,
        viewport: initialCanvasData.viewport,
        settings: initialCanvasData.settings,
        version: 1
      });

      const savedCanvas = await canvasDocument.save();
      canvasDocumentId = savedCanvas._id.toString();

      // Create project in PostgreSQL
      const project = await this.prismaService.project.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          canvasWidth,
          canvasHeight,
          canvasDocumentId,
          tags,
          isPublic,
          userId,
          version: 1
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, plan: true }
          }
        }
      });

      // Update canvas document with actual project ID
      await this.canvasModel.findByIdAndUpdate(canvasDocumentId, {
        projectId: project.id
      });

      return this.formatProjectResponse(project);
    } catch (error) {
      // Cleanup on error
      if (canvasDocumentId) {
        await this.canvasModel.findByIdAndDelete(canvasDocumentId).catch(() => {});
      }
      throw error;
    }
  }

  async findAll(queryDto: ProjectQueryDto, userId: string): Promise<{ data: ProjectResponseDto[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      isPublic,
      isTemplate,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (typeof isPublic === 'boolean') {
      where.isPublic = isPublic;
    }

    if (typeof isTemplate === 'boolean') {
      where.isTemplate = isTemplate;
    }

    // Execute queries in parallel
    const [projects, total] = await Promise.all([
      this.prismaService.project.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, plan: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      this.prismaService.project.count({ where })
    ]);

    return {
      data: projects.map(project => this.formatProjectResponse(project)),
      total,
      page,
      pageSize: limit
    };
  }

  async findOne(id: string, userId: string, includeCanvas: boolean = false): Promise<ProjectResponseDto | ProjectWithCanvasDto> {
    const project = await this.prismaService.project.findFirst({
      where: {
        id,
        OR: [
          { userId }, // User's own project
          { isPublic: true } // Public project
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, plan: true }
        }
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Update lastOpenedAt if it's user's own project
    if (project.userId === userId) {
      await this.prismaService.project.update({
        where: { id },
        data: { lastOpenedAt: new Date() }
      }).catch(() => {}); // Silent fail for lastOpenedAt update
    }

    const baseResponse = this.formatProjectResponse(project);

    if (!includeCanvas || !project.canvasDocumentId) {
      return baseResponse;
    }

    // Fetch canvas data from MongoDB
    const canvasDocument = await this.canvasModel.findById(project.canvasDocumentId);

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
    } as ProjectWithCanvasDto;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<ProjectResponseDto> {
    // Check if project exists and user has permission
    const existingProject = await this.prismaService.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found or access denied');
    }

    const { canvasData, ...projectUpdates } = updateProjectDto;

    try {
      // Update project metadata
      const updatedProject = await this.prismaService.project.update({
        where: { id },
        data: {
          ...projectUpdates,
          ...(projectUpdates.name && { name: projectUpdates.name.trim() }),
          ...(projectUpdates.description !== undefined && { description: projectUpdates.description?.trim() }),
          version: { increment: 1 },
          updatedAt: new Date()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, plan: true }
          }
        }
      });

      // Update canvas data if provided
      if (canvasData && existingProject.canvasDocumentId) {
        const updateData: any = {
          version: { $inc: 1 },
          lastModified: new Date()
        };

        if (canvasData.elements) updateData.elements = canvasData.elements;
        if (canvasData.layers) updateData.layers = canvasData.layers;
        if (canvasData.timeline) updateData.timeline = canvasData.timeline;
        if (canvasData.viewport) updateData.viewport = canvasData.viewport;
        if (canvasData.settings) updateData.settings = canvasData.settings;
        if (canvasData.backgroundColor) updateData.backgroundColor = canvasData.backgroundColor;

        await this.canvasModel.findByIdAndUpdate(
          existingProject.canvasDocumentId,
          updateData,
          { new: true }
        );
      }

      return this.formatProjectResponse(updatedProject);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('A project with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const project = await this.prismaService.project.findFirst({
      where: { id, userId }
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    try {
      // Delete canvas document from MongoDB
      if (project.canvasDocumentId) {
        await this.canvasModel.findByIdAndDelete(project.canvasDocumentId).catch(() => {
          // Silent fail - canvas document might not exist
        });
      }

      // Delete project from PostgreSQL (cascade will handle related records)
      await this.prismaService.project.delete({
        where: { id }
      });

      return { message: 'Project deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete project');
    }
  }

  async duplicate(id: string, userId: string, name?: string): Promise<ProjectResponseDto> {
    const originalProject = await this.prismaService.project.findFirst({
      where: {
        id,
        OR: [
          { userId }, // User's own project
          { isPublic: true, isTemplate: true } // Public template
        ]
      }
    });

    if (!originalProject) {
      throw new NotFoundException('Project not found or cannot be duplicated');
    }

    // Validate user limits
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { projects: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const projectCount = user.projects.length;
    const maxProjects = user.limits?.maxProjects || 10;

    if (projectCount >= maxProjects) {
      throw new ForbiddenException(`Project limit reached. Current plan allows ${maxProjects} projects.`);
    }

    let canvasDocumentId: string | null = null;

    try {
      // Copy canvas data if exists
      if (originalProject.canvasDocumentId) {
        const originalCanvas = await this.canvasModel.findById(originalProject.canvasDocumentId);
        if (originalCanvas) {
          const newCanvas = new this.canvasModel({
            projectId: 'temp', // Will be updated after project creation
            userId,
            width: originalCanvas.width,
            height: originalCanvas.height,
            backgroundColor: originalCanvas.backgroundColor,
            elements: originalCanvas.elements,
            layers: originalCanvas.layers,
            timeline: originalCanvas.timeline,
            viewport: originalCanvas.viewport,
            settings: originalCanvas.settings,
            version: 1
          });

          const savedCanvas = await newCanvas.save();
          canvasDocumentId = savedCanvas._id.toString();
        }
      }

      // Create duplicate project
      const duplicatedProject = await this.prismaService.project.create({
        data: {
          name: name || `${originalProject.name} (Copy)`,
          description: originalProject.description,
          canvasWidth: originalProject.canvasWidth,
          canvasHeight: originalProject.canvasHeight,
          canvasDocumentId,
          tags: originalProject.tags,
          isPublic: false, // Duplicated projects are private by default
          isTemplate: false, // Duplicated projects are not templates
          userId,
          version: 1
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, plan: true }
          }
        }
      });

      // Update canvas document with actual project ID
      if (canvasDocumentId) {
        await this.canvasModel.findByIdAndUpdate(canvasDocumentId, {
          projectId: duplicatedProject.id
        });
      }

      return this.formatProjectResponse(duplicatedProject);
    } catch (error) {
      // Cleanup on error
      if (canvasDocumentId) {
        await this.canvasModel.findByIdAndDelete(canvasDocumentId).catch(() => {});
      }
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        projects: true,
        assets: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalProjects = user.projects.length;
    const publicProjects = user.projects.filter(p => p.isPublic).length;
    const privateProjects = totalProjects - publicProjects;
    const templateProjects = user.projects.filter(p => p.isTemplate).length;

    // Calculate storage used (rough estimation)
    const storageUsed = user.assets.reduce((total, asset) => total + (asset.size || 0), 0);
    const storageLimit = user.limits?.maxStorageSize || 104857600; // 100MB default

    return {
      totalProjects,
      publicProjects,
      privateProjects,
      templateProjects,
      storageUsed,
      storageLimit
    };
  }

  private formatProjectResponse(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      thumbnail: project.thumbnail,
      canvasWidth: project.canvasWidth,
      canvasHeight: project.canvasHeight,
      canvasDocumentId: project.canvasDocumentId,
      isPublic: project.isPublic,
      isTemplate: project.isTemplate,
      tags: project.tags,
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastOpenedAt: project.lastOpenedAt,
      user: project.user
    };
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      // Test PostgreSQL connection
      await this.prismaService.project.count();
      
      // Test MongoDB connection
      await this.canvasModel.countDocuments();
      
      return true;
    } catch {
      return false;
    }
  }
}