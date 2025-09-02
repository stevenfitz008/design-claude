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
  ParseBoolPipe,
  DefaultValuePipe,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto, ProjectWithCanvasDto, ProjectStatsDto } from './dto/project-response.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project created successfully',
    type: ProjectResponseDto
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Project limit reached' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Projects retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/ProjectResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' }
      }
    }
  })
  async findAll(
    @Query() queryDto: ProjectQueryDto,
    @Request() req: any
  ): Promise<{ data: ProjectResponseDto[]; total: number; page: number; pageSize: number }> {
    return this.projectsService.findAll(queryDto, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user project statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: ProjectStatsDto
  })
  async getStats(@Request() req: any): Promise<ProjectStatsDto> {
    return this.projectsService.getUserStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
  @ApiQuery({
    name: 'includeCanvas',
    description: 'Include canvas data in response',
    type: 'boolean',
    required: false,
    example: false
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ProjectResponseDto' },
        { $ref: '#/components/schemas/ProjectWithCanvasDto' }
      ]
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  async findOne(
    @Param('id') id: string,
    @Query('includeCanvas', new DefaultValuePipe(false), ParseBoolPipe) includeCanvas: boolean,
    @Request() req: any
  ): Promise<ProjectResponseDto | ProjectWithCanvasDto> {
    return this.projectsService.findOne(id, req.user.id, includeCanvas);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project updated successfully',
    type: ProjectResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found or access denied' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Project name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Project deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found or access denied' })
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    return this.projectsService.remove(id, req.user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a project' })
  @ApiParam({ name: 'id', description: 'Project ID to duplicate', type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project duplicated successfully',
    type: ProjectResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found or cannot be duplicated' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Project limit reached' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { name?: string },
    @Request() req: any
  ): Promise<ProjectResponseDto> {
    return this.projectsService.duplicate(id, req.user.id, body.name);
  }

  @Put(':id/open')
  @ApiOperation({ summary: 'Update project last opened timestamp' })
  @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project last opened timestamp updated',
    type: ProjectResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found or access denied' })
  async updateLastOpened(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, {}, req.user.id);
  }

  // Health check endpoint
  @Get('health/status')
  @ApiOperation({ summary: 'Check projects service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getHealthStatus(): Promise<{ healthy: boolean; timestamp: string }> {
    const healthy = await this.projectsService.isHealthy();
    return {
      healthy,
      timestamp: new Date().toISOString()
    };
  }
}