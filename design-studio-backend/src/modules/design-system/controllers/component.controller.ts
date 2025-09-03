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
import { ComponentService, CreateComponentRequest, UpdateComponentRequest } from '../services/component.service';

@ApiTags('Design System - Components')
@Controller('api/design-system/components')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new component' })
  @ApiResponse({ status: 201, description: 'Component created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid component data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createComponent(@Request() req, @Body() createComponentDto: CreateComponentRequest) {
    return this.componentService.createComponent(req.user.id, createComponentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List components with filtering' })
  @ApiQuery({ name: 'type', required: false, description: 'Component type filter' })
  @ApiQuery({ name: 'category', required: false, description: 'Component category filter' })
  @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated tags filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  @ApiQuery({ name: 'isSystem', required: false, type: Boolean, description: 'Filter system components' })
  @ApiQuery({ name: 'createdBy', required: false, description: 'Filter by creator user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'usageCount', 'version'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Components retrieved successfully' })
  async listComponents(
    @Request() req,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('isSystem') isSystem?: boolean,
    @Query('createdBy') createdBy?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'usageCount' | 'version',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    return this.componentService.listComponents(req.user.id, {
      type,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      search,
      isSystem,
      createdBy,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('public')
  @ApiOperation({ summary: 'List public components' })
  @ApiResponse({ status: 200, description: 'Public components retrieved successfully' })
  async listPublicComponents(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'usageCount' | 'version',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    return this.componentService.listComponents(undefined, {
      type,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get component by ID' })
  @ApiQuery({ name: 'version', required: false, type: Number, description: 'Specific version to retrieve' })
  @ApiResponse({ status: 200, description: 'Component retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async getComponent(
    @Request() req,
    @Param('id') id: string,
    @Query('version', new ParseIntPipe({ optional: true })) version?: number
  ) {
    return this.componentService.getComponent(id, req.user.id, version);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update component (creates new version)' })
  @ApiResponse({ status: 200, description: 'Component updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify component' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async updateComponent(
    @Request() req,
    @Param('id') id: string,
    @Body() updateComponentDto: UpdateComponentRequest & { changeLog?: string }
  ) {
    const { changeLog, ...updateData } = updateComponentDto;
    return this.componentService.updateComponent(id, req.user.id, updateData, changeLog);
  }

  @Patch(':id/versions/:version/stable')
  @ApiOperation({ summary: 'Mark component version as stable' })
  @ApiResponse({ status: 200, description: 'Component version marked as stable' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify component' })
  @ApiResponse({ status: 404, description: 'Component or version not found' })
  @HttpCode(HttpStatus.OK)
  async markVersionStable(
    @Request() req,
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number
  ) {
    return this.componentService.markVersionStable(id, version, req.user.id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish component (make public)' })
  @ApiResponse({ status: 200, description: 'Component published successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to modify component' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @HttpCode(HttpStatus.OK)
  async publishComponent(@Request() req, @Param('id') id: string) {
    return this.componentService.publishComponent(id, req.user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get component usage statistics' })
  @ApiResponse({ status: 200, description: 'Component stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async getComponentStats(@Request() req, @Param('id') id: string) {
    return this.componentService.getComponentStats(id, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get component version history' })
  @ApiResponse({ status: 200, description: 'Version history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async getVersionHistory(@Request() req, @Param('id') id: string) {
    return this.componentService.getVersionHistory(id);
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get specific component version' })
  @ApiResponse({ status: 200, description: 'Component version retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Component or version not found' })
  async getComponentVersion(
    @Request() req,
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number
  ) {
    return this.componentService.getComponent(id, req.user.id, version);
  }
}

// DTOs for API documentation
export class CreateComponentDto implements CreateComponentRequest {
  name: string;
  description?: string;
  type: 'chart' | 'text' | 'image' | 'table' | 'shape' | 'container' | 'form' | 'media' | 'widget';
  category: string;
  tags?: string[];
  definition: any; // ComponentDefinition
  defaultProps?: Record<string, any>;
  supportedFormats?: string[];
  dependencies?: string[];
}

export class UpdateComponentDto implements UpdateComponentRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  definition?: any; // Partial<ComponentDefinition>
  defaultProps?: Record<string, any>;
  supportedFormats?: string[];
  changeLog?: string;
}