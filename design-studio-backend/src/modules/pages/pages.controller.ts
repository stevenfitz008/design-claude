import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { ReportPageDto, ReportPageWithComponentsDto, PageStatsDto } from './dto/page-response.dto';
import { PageQueryDto } from './dto/page-query.dto';

@ApiTags('pages')
@Controller('pages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new page' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Page created successfully',
    type: ReportPageDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found or access denied' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Page order or title conflict' })
  async create(
    @Body() createPageDto: CreatePageDto,
    @Request() req: any,
  ): Promise<ReportPageDto> {
    return this.pagesService.create(createPageDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pages for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { 
          type: 'array', 
          items: { 
            oneOf: [
              { $ref: '#/components/schemas/ReportPageDto' },
              { $ref: '#/components/schemas/ReportPageWithComponentsDto' }
            ]
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query() queryDto: PageQueryDto,
    @Request() req: any,
  ): Promise<{ data: ReportPageDto[] | ReportPageWithComponentsDto[]; total: number; page: number; pageSize: number }> {
    return this.pagesService.findAll(queryDto, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user page statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: PageStatsDto,
  })
  async getStats(@Request() req: any): Promise<PageStatsDto> {
    return this.pagesService.getPageStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific page by ID' })
  @ApiParam({ name: 'id', description: 'Page ID', type: 'string' })
  @ApiQuery({
    name: 'includeComponents',
    description: 'Include component instances in response',
    type: 'boolean',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ReportPageDto' },
        { $ref: '#/components/schemas/ReportPageWithComponentsDto' },
      ],
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Page not found or access denied' })
  async findOne(
    @Param('id') id: string,
    @Query('includeComponents', new DefaultValuePipe(false), ParseBoolPipe) includeComponents: boolean,
    @Request() req: any,
  ): Promise<ReportPageDto | ReportPageWithComponentsDto> {
    return this.pagesService.findOne(id, req.user.id, includeComponents);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a page' })
  @ApiParam({ name: 'id', description: 'Page ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page updated successfully',
    type: ReportPageDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Page not found or access denied' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Page order conflict or version conflict' })
  async update(
    @Param('id') id: string,
    @Body() updatePageDto: UpdatePageDto,
    @Request() req: any,
  ): Promise<ReportPageDto> {
    return this.pagesService.update(id, updatePageDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a page' })
  @ApiParam({ name: 'id', description: 'Page ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Page deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Page not found or access denied' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.pagesService.remove(id, req.user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a page' })
  @ApiParam({ name: 'id', description: 'Page ID to duplicate', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { 
          type: 'string', 
          example: 'Executive Summary - Copy',
          description: 'New title for duplicated page (optional)'
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Page duplicated successfully',
    type: ReportPageDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Source page not found or access denied' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Page title already exists' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { title?: string },
    @Request() req: any,
  ): Promise<ReportPageDto> {
    return this.pagesService.duplicate(id, req.user.id, body.title);
  }

  @Put('reports/:reportId/reorder')
  @ApiOperation({ summary: 'Reorder pages within a report' })
  @ApiParam({ name: 'reportId', description: 'Report ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pageOrders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pageId: { type: 'string', example: 'page1a2b3c4d5e6f7g8h9' },
              order: { type: 'number', example: 0 },
            },
            required: ['pageId', 'order'],
          },
          example: [
            { pageId: 'page1a2b3c4d5e6f7g8h9', order: 0 },
            { pageId: 'page2a2b3c4d5e6f7g8h9', order: 1 },
          ],
        },
      },
      required: ['pageOrders'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Page orders updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Page orders updated successfully' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found or access denied' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid page orders or duplicate orders' })
  async reorderPages(
    @Param('reportId') reportId: string,
    @Body() body: { pageOrders: Array<{ pageId: string; order: number }> },
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.pagesService.reorderPages(reportId, body.pageOrders, req.user.id);
  }

  @Post(':id/components')
  @ApiOperation({ summary: 'Add a component to a page' })
  @ApiParam({ name: 'id', description: 'Page ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        componentId: { 
          type: 'string', 
          example: 'comp1a2b3c4d5e6f7g8h9',
          description: 'Component ID to add'
        },
        componentVersion: { 
          type: 'number', 
          example: 12,
          description: 'Component version to use'
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number', example: 100 },
            y: { type: 'number', example: 50 },
            width: { type: 'number', example: 400 },
            height: { type: 'number', example: 300 },
            zIndex: { type: 'number', example: 1 },
          },
          required: ['x', 'y', 'width', 'height'],
        },
        props: {
          type: 'object',
          example: { title: 'Chart Title', color: '#FF5733' },
          description: 'Component properties (optional)',
        },
      },
      required: ['componentId', 'componentVersion', 'position'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Component added to page successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Component added to page successfully' },
        componentInstanceId: { type: 'string', example: 'inst1a2b3c4d5e6f7g8h9' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Page, component, or component version not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Component instance conflict' })
  async addComponent(
    @Param('id') id: string,
    @Body() body: {
      componentId: string;
      componentVersion: number;
      position: { x: number; y: number; width: number; height: number; zIndex?: number };
      props?: Record<string, any>;
    },
    @Request() req: any,
  ): Promise<{ message: string; componentInstanceId: string }> {
    return this.pagesService.addComponentToPage(
      id,
      body.componentId,
      body.componentVersion,
      body.position,
      body.props || {},
      req.user.id,
    );
  }

  @Delete(':id/components/:componentInstanceId')
  @ApiOperation({ summary: 'Remove a component from a page' })
  @ApiParam({ name: 'id', description: 'Page ID', type: 'string' })
  @ApiParam({ name: 'componentInstanceId', description: 'Component instance ID to remove', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Component removed from page successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Component removed from page successfully' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component instance not found or access denied' })
  async removeComponent(
    @Param('id') id: string,
    @Param('componentInstanceId') componentInstanceId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.pagesService.removeComponentFromPage(id, componentInstanceId, req.user.id);
  }

  // Health check endpoint
  @Get('health/status')
  @ApiOperation({ summary: 'Check pages service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getHealthStatus(): Promise<{ healthy: boolean; timestamp: string }> {
    const healthy = await this.pagesService.isHealthy();
    return {
      healthy,
      timestamp: new Date().toISOString(),
    };
  }
}