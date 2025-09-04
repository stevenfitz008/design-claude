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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportDto, ReportWithPagesDto, ReportStatsDto } from './dto/report-response.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Report created successfully',
    type: ReportDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Report limit reached' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Report title already exists' })
  async create(
    @Body() createReportDto: CreateReportDto,
    @Request() req: any,
  ): Promise<ReportDto> {
    return this.reportsService.create(createReportDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reports retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { 
          type: 'array', 
          items: { 
            oneOf: [
              { $ref: '#/components/schemas/ReportDto' },
              { $ref: '#/components/schemas/ReportWithPagesDto' }
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
    @Query() queryDto: ReportQueryDto,
    @Request() req: any,
  ): Promise<{ data: ReportDto[] | ReportWithPagesDto[]; total: number; page: number; pageSize: number }> {
    return this.reportsService.findAll(queryDto, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user report statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: ReportStatsDto,
  })
  async getStats(@Request() req: any): Promise<ReportStatsDto> {
    return this.reportsService.getUserStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID', type: 'string' })
  @ApiQuery({
    name: 'includePages',
    description: 'Include pages in response',
    type: 'boolean',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ReportDto' },
        { $ref: '#/components/schemas/ReportWithPagesDto' },
      ],
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found or access denied' })
  async findOne(
    @Param('id') id: string,
    @Query('includePages', new DefaultValuePipe(false), ParseBoolPipe) includePages: boolean,
    @Request() req: any,
  ): Promise<ReportDto | ReportWithPagesDto> {
    return this.reportsService.findOne(id, req.user.id, includePages);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'id', description: 'Report ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report updated successfully',
    type: ReportDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found or access denied' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Report title already exists or version conflict' })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req: any,
  ): Promise<ReportDto> {
    return this.reportsService.update(id, updateReportDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'id', description: 'Report ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Report deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found or access denied' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.reportsService.remove(id, req.user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a report' })
  @ApiParam({ name: 'id', description: 'Report ID to duplicate', type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Report duplicated successfully',
    type: ReportDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Source report not found or access denied' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Report title already exists' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { title?: string },
    @Request() req: any,
  ): Promise<ReportDto> {
    return this.reportsService.duplicate(id, req.user.id, body.title);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish a report' })
  @ApiParam({ name: 'id', description: 'Report ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report publication status updated',
    type: ReportDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found or access denied' })
  async togglePublishStatus(
    @Param('id') id: string,
    @Body() body: { isPublished: boolean },
    @Request() req: any,
  ): Promise<ReportDto> {
    return this.reportsService.update(
      id,
      { isPublished: body.isPublished },
      req.user.id,
    );
  }

  @Put(':id/visibility')
  @ApiOperation({ summary: 'Change report visibility (public/private)' })
  @ApiParam({ name: 'id', description: 'Report ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report visibility updated',
    type: ReportDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Report not found or access denied' })
  async changeVisibility(
    @Param('id') id: string,
    @Body() body: { isPublic: boolean },
    @Request() req: any,
  ): Promise<ReportDto> {
    return this.reportsService.update(
      id,
      { isPublic: body.isPublic },
      req.user.id,
    );
  }

  // Health check endpoint
  @Get('health/status')
  @ApiOperation({ summary: 'Check reports service health' })
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
    const healthy = await this.reportsService.isHealthy();
    return {
      healthy,
      timestamp: new Date().toISOString(),
    };
  }
}