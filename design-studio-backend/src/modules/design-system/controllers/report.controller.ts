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
  PageComponentInstance 
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