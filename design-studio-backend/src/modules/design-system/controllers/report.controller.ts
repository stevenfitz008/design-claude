import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { 
  ReportService, 
  CreateReportRequest, 
  CreatePageRequest,
  UpdatePageLayoutRequest,
  PageComponentInstance,
  SaveCanvasStateRequest,
  ReportVersionResponse,
  CanvasState
} from '../services/report.service';

@ApiTags('Design System - Reports')
@Controller('api/design-system/reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid report data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createReport(@Request() req, @Body() createReportDto: CreateReportRequest) {
    return this.reportService.createReport(req.user.id, createReportDto);
  }

  @Get()
  @ApiOperation({ summary: 'List reports with filtering' })
  @ApiQuery({ name: 'author', required: false, description: 'Filter by author name' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated tags filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean, description: 'Filter published reports' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['title', 'createdAt', 'updatedAt', 'author'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async listReports(
    @Request() req,
    @Query('author') author?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('isPublished') isPublished?: boolean,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('sortBy') sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'author',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    return this.reportService.listReports(req.user.id, {
      author,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      search,
      isPublished,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('public')
  @ApiOperation({ summary: 'List public reports' })
  @ApiResponse({ status: 200, description: 'Public reports retrieved successfully' })
  async listPublicReports(
    @Query('author') author?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('sortBy') sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'author',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    return this.reportService.listReports(undefined, {
      author,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      search,
      isPublished: true,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiQuery({ name: 'includeDefinitions', required: false, type: Boolean, description: 'Include page definitions' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(
    @Request() req,
    @Param('id') id: string,
    @Query('includeDefinitions') includeDefinitions?: boolean
  ) {
    return this.reportService.getReport(id, req.user.id, includeDefinitions);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update report metadata' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @Request() req,
    @Param('id') id: string,
    @Body() updateReportDto: Partial<CreateReportRequest>
  ) {
    return this.reportService.updateReport(id, req.user.id, updateReportDto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish report (make public)' })
  @ApiResponse({ status: 200, description: 'Report published successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @HttpCode(HttpStatus.OK)
  async publishReport(@Request() req, @Param('id') id: string) {
    return this.reportService.publishReport(id, req.user.id);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone report' })
  @ApiResponse({ status: 201, description: 'Report cloned successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async cloneReport(
    @Request() req,
    @Param('id') id: string,
    @Body() cloneDto: { title?: string }
  ) {
    return this.reportService.cloneReport(id, req.user.id, cloneDto.title);
  }

  // Page management endpoints

  @Post(':reportId/pages')
  @ApiOperation({ summary: 'Create a page within a report' })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async createPage(
    @Request() req,
    @Param('reportId') reportId: string,
    @Body() createPageDto: CreatePageRequest
  ) {
    return this.reportService.createPage(reportId, req.user.id, createPageDto);
  }

  @Get(':reportId/pages/:pageId')
  @ApiOperation({ summary: 'Get page with definition' })
  @ApiResponse({ status: 200, description: 'Page retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async getPage(
    @Request() req,
    @Param('reportId') reportId: string,
    @Param('pageId') pageId: string
  ) {
    return this.reportService.getPage(pageId, req.user.id);
  }

  @Put(':reportId/pages/:pageId/layout')
  @ApiOperation({ summary: 'Update page layout and components' })
  @ApiResponse({ status: 200, description: 'Page layout updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify page' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async updatePageLayout(
    @Request() req,
    @Param('reportId') reportId: string,
    @Param('pageId') pageId: string,
    @Body() updateLayoutDto: UpdatePageLayoutRequest
  ) {
    return this.reportService.updatePageLayout(pageId, req.user.id, updateLayoutDto);
  }

  @Post(':reportId/pages/:pageId/components')
  @ApiOperation({ summary: 'Add component to page' })
  @ApiResponse({ status: 201, description: 'Component added to page successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify page' })
  @ApiResponse({ status: 404, description: 'Page or component not found' })
  async addComponentToPage(
    @Request() req,
    @Param('reportId') reportId: string,
    @Param('pageId') pageId: string,
    @Body() componentDto: Omit<PageComponentInstance, 'id'>
  ) {
    return this.reportService.addComponentToPage(pageId, req.user.id, componentDto);
  }

  @Delete(':reportId/pages/:pageId/components/:componentId')
  @ApiOperation({ summary: 'Remove component from page' })
  @ApiResponse({ status: 200, description: 'Component removed from page successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify page' })
  @ApiResponse({ status: 404, description: 'Component instance not found' })
  async removeComponentFromPage(
    @Request() req,
    @Param('reportId') reportId: string,
    @Param('pageId') pageId: string,
    @Param('componentId') componentId: string
  ) {
    return this.reportService.removeComponentFromPage(pageId, componentId, req.user.id);
  }

  // Canvas integration and version management endpoints

  @Post(':id/versions')
  @ApiOperation({ summary: 'Save canvas state as new version' })
  @ApiResponse({ status: 201, description: 'Canvas version saved successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async saveCanvasVersion(
    @Request() req,
    @Param('id') reportId: string,
    @Body() saveCanvasDto: SaveCanvasStateRequest
  ) {
    return this.reportService.saveCanvasVersion(reportId, req.user.id, saveCanvasDto);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a report' })
  @ApiResponse({ status: 200, description: 'Report versions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportVersions(
    @Request() req,
    @Param('id') reportId: string
  ) {
    return this.reportService.getReportVersions(reportId, req.user.id);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get specific version of a report' })
  @ApiResponse({ status: 200, description: 'Report version retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report or version not found' })
  async getReportVersion(
    @Request() req,
    @Param('id') reportId: string,
    @Param('versionId') versionId: string
  ) {
    return this.reportService.getReportVersion(reportId, versionId, req.user.id);
  }

  @Delete(':id/versions/:versionId')
  @ApiOperation({ summary: 'Delete specific version of a report' })
  @ApiResponse({ status: 200, description: 'Report version deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify report' })
  @ApiResponse({ status: 404, description: 'Report or version not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete the only version' })
  async deleteReportVersion(
    @Request() req,
    @Param('id') reportId: string,
    @Param('versionId') versionId: string
  ) {
    await this.reportService.deleteReportVersion(reportId, versionId, req.user.id);
    return { success: true };
  }

  @Put(':id/open')
  @ApiOperation({ summary: 'Load report into canvas and update last opened timestamp' })
  @ApiResponse({ status: 200, description: 'Report loaded successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async openReportInCanvas(
    @Request() req,
    @Param('id') reportId: string,
    @Query('versionId') versionId?: string
  ) {
    // Update last opened timestamp
    await this.reportService.updateLastOpened(reportId, req.user.id);
    
    if (versionId) {
      // Load specific version
      const version = await this.reportService.getReportVersion(reportId, versionId, req.user.id);
      return {
        reportId,
        canvasState: version.canvasState,
        version: version.version,
        versionId: version.id,
      };
    } else {
      // Load latest version
      const canvasState = await this.reportService.getLatestCanvasState(reportId, req.user.id);
      const report = await this.reportService.getReport(reportId, req.user.id);
      return {
        reportId,
        canvasState: canvasState || {
          elements: [],
          canvasSize: { width: 1000, height: 625 },
          backgroundColor: '#ffffff',
          zoom: 1,
          pan: { x: 0, y: 0 },
          showGrid: false,
          gridSize: 20,
          snapToGrid: false,
          showGuides: false,
          snapToGuides: false,
        },
        version: report.version,
        versionId: null,
      };
    }
  }

  @Post(':id/auto-save')
  @ApiOperation({ summary: 'Auto-save canvas state (creates version if significant changes)' })
  @ApiResponse({ status: 201, description: 'Auto-save completed' })
  @ApiResponse({ status:403, description: 'Not authorized to modify report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async autoSaveCanvas(
    @Request() req,
    @Param('id') reportId: string,
    @Body() saveCanvasDto: SaveCanvasStateRequest
  ) {
    // Force auto-save flag
    const autoSaveData = {
      ...saveCanvasDto,
      autoSaved: true,
      changeDescription: saveCanvasDto.changeDescription || 'Auto-save'
    };
    
    const version = await this.reportService.saveCanvasVersion(reportId, req.user.id, autoSaveData);
    
    // Cleanup old versions in background
    this.reportService.cleanupOldVersions(reportId).catch(err => 
      console.warn('Failed to cleanup old versions:', err)
    );
    
    return version;
  }
}

// DTOs for API documentation
export class CreateReportDto implements CreateReportRequest {
  title: string;
  description?: string;
  author: string;
  tags?: string[];
  category?: string;
}

export class CreatePageDto implements CreatePageRequest {
  title: string;
  description?: string;
  order: number;
  layoutType?: 'flexible' | 'grid' | 'fixed' | 'responsive';
  columns?: number;
  width?: number;
  height?: number;
}

export class UpdatePageLayoutDto implements UpdatePageLayoutRequest {
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

export class PageComponentDto implements Omit<PageComponentInstance, 'id'> {
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

export class SaveCanvasStateDto implements SaveCanvasStateRequest {
  canvasState: {
    elements: any[];
    canvasSize: { width: number; height: number };
    backgroundColor: string;
    zoom: number;
    pan: { x: number; y: number };
    showGrid: boolean;
    gridSize: number;
    snapToGrid: boolean;
    showGuides: boolean;
    snapToGuides: boolean;
  };
  changeDescription?: string;
  autoSaved?: boolean;
}