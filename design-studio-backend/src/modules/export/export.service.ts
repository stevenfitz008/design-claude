import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { ImageExportService } from './services/image-export.service';
import { VideoExportService } from './services/video-export.service';
import { CreateExportDto, ExportFormat } from './dto/export.dto';
import { ExportStatus } from '@prisma/client';

@Injectable()
export class ExportService {
  constructor(
    private prismaService: PrismaService,
    private imageExportService: ImageExportService,
    private videoExportService: VideoExportService,
    @InjectQueue('export') private exportQueue: Queue,
  ) {}

  async createExport(exportDto: CreateExportDto, userId: string) {
    // Verify user has access to the project
    const project = await this.prismaService.project.findFirst({
      where: {
        id: exportDto.projectId,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create export record
    const exportRecord = await this.prismaService.export.create({
      data: {
        projectId: exportDto.projectId,
        userId,
        format: exportDto.format,
        quality: 90, // Default high quality
        width: exportDto.width,
        height: exportDto.height,
        status: 'PENDING',
        settings: exportDto.settings || {},
      },
    });

    // Queue the export job
    await this.exportQueue.add('process-export', {
      exportId: exportRecord.id,
      userId,
    });

    return {
      success: true,
      data: exportRecord,
      message: 'Export queued successfully',
      timestamp: Date.now(),
    };
  }

  async getExportStatus(exportId: string, userId: string) {
    const exportRecord = await this.prismaService.export.findFirst({
      where: {
        id: exportId,
        userId,
      },
    });

    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }

    return {
      success: true,
      data: exportRecord,
      timestamp: Date.now(),
    };
  }

  async getUserExports(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [exports, total] = await Promise.all([
      this.prismaService.export.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.export.count({
        where: { userId },
      }),
    ]);

    return {
      success: true,
      data: exports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: Date.now(),
    };
  }

  async processExport(exportId: string) {
    const exportRecord = await this.prismaService.export.findUnique({
      where: { id: exportId },
      include: {
        project: true,
      },
    });

    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }

    try {
      // Update status to processing
      await this.prismaService.export.update({
        where: { id: exportId },
        data: { status: 'PROCESSING' },
      });

      let result;
      
      // Process based on format
      switch (exportRecord.format) {
        case ExportFormat.PNG:
        case ExportFormat.JPG:
        case ExportFormat.WEBP:
          // Get canvas data from project (placeholder for now)
          const canvasData = {}; // TODO: Get actual canvas data from project
          const options = {
            format: exportRecord.format,
            width: exportRecord.width || undefined,
            height: exportRecord.height || undefined,
            quality: exportRecord.quality || undefined,
          } as ExportOptionsDto;
          const outputPath = `./exports/${exportRecord.id}.${exportRecord.format.toLowerCase()}`;
          
          const exportResult = await this.imageExportService.exportImage(canvasData, options, outputPath);
          result = {
            url: `/exports/${exportRecord.id}.${exportRecord.format.toLowerCase()}`,
            fileSize: exportResult.fileSize,
            format: exportRecord.format,
          };
          break;
        case ExportFormat.MP4:
        case ExportFormat.GIF:
          // For now, use a simple placeholder implementation
          result = {
            url: `/exports/${exportRecord.id}.${exportRecord.format.toLowerCase()}`,
            fileSize: 1024000, // 1MB placeholder
            format: exportRecord.format,
          };
          break;
        default:
          throw new Error(`Unsupported export format: ${exportRecord.format}`);
      }

      // Update with success
      await this.prismaService.export.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          outputUrl: result.url,
          fileSize: result.fileSize,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      // Update with error
      await this.prismaService.export.update({
        where: { id: exportId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  async deleteExport(exportId: string, userId: string) {
    const exportRecord = await this.prismaService.export.findFirst({
      where: {
        id: exportId,
        userId,
      },
    });

    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }

    // Delete file from storage if it exists
    if (exportRecord.outputUrl) {
      // TODO: Delete file from S3/storage
    }

    await this.prismaService.export.delete({
      where: { id: exportId },
    });

    return {
      success: true,
      message: 'Export deleted successfully',
      timestamp: Date.now(),
    };
  }

  async cancelExport(exportId: string, userId: string) {
    const exportRecord = await this.prismaService.export.findFirst({
      where: {
        id: exportId,
        userId,
      },
    });

    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }

    if (exportRecord.status === ExportStatus.COMPLETED) {
      throw new Error('Cannot cancel completed export');
    }

    await this.prismaService.export.update({
      where: { id: exportId },
      data: {
        status: ExportStatus.EXPIRED,
      },
    });

    return {
      success: true,
      message: 'Export cancelled successfully',
      timestamp: Date.now(),
    };
  }
}