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
  ParseIntPipe,
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
import { ComponentsService } from './components.service';
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

@ApiTags('components')
@Controller('components')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new component' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Component created successfully',
    type: ComponentDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Component limit reached' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Component name already exists' })
  async create(
    @Body() createComponentDto: CreateComponentDto,
    @Request() req: any,
  ): Promise<ComponentDto> {
    return this.componentsService.create(createComponentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all components for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Components retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { 
          type: 'array', 
          items: { 
            oneOf: [
              { $ref: '#/components/schemas/ComponentDto' },
              { $ref: '#/components/schemas/ComponentWithDefinitionDto' }
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
    @Query() queryDto: ComponentQueryDto,
    @Request() req: any,
  ): Promise<{ data: ComponentDto[] | ComponentWithDefinitionDto[]; total: number; page: number; pageSize: number }> {
    return this.componentsService.findAll(queryDto, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user component statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: ComponentStatsDto,
  })
  async getStats(@Request() req: any): Promise<ComponentStatsDto> {
    return this.componentsService.getComponentStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific component by ID' })
  @ApiParam({ name: 'id', description: 'Component ID', type: 'string' })
  @ApiQuery({
    name: 'includeDefinition',
    description: 'Include full component definition in response',
    type: 'boolean',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Component retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ComponentDto' },
        { $ref: '#/components/schemas/ComponentWithDefinitionDto' },
      ],
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component not found or access denied' })
  async findOne(
    @Param('id') id: string,
    @Query('includeDefinition', new DefaultValuePipe(false), ParseBoolPipe) includeDefinition: boolean,
    @Request() req: any,
  ): Promise<ComponentDto | ComponentWithDefinitionDto> {
    return this.componentsService.findOne(id, req.user.id, includeDefinition);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a component' })
  @ApiParam({ name: 'id', description: 'Component ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Component updated successfully',
    type: ComponentDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component not found or access denied' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Component name conflict or version conflict' })
  async update(
    @Param('id') id: string,
    @Body() updateComponentDto: UpdateComponentDto,
    @Request() req: any,
  ): Promise<ComponentDto> {
    return this.componentsService.update(id, updateComponentDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a component' })
  @ApiParam({ name: 'id', description: 'Component ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Component deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Component deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component not found or access denied' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Component is in use and cannot be deleted' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.componentsService.remove(id, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a component' })
  @ApiParam({ name: 'id', description: 'Component ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Component versions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { 
          type: 'array', 
          items: { 
            oneOf: [
              { $ref: '#/components/schemas/ComponentVersionDto' },
              { $ref: '#/components/schemas/ComponentVersionWithDefinitionDto' }
            ]
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component not found or access denied' })
  async getVersions(
    @Param('id') id: string,
    @Query() queryDto: ComponentVersionQueryDto,
    @Request() req: any,
  ): Promise<{ data: ComponentVersionDto[] | ComponentVersionWithDefinitionDto[]; total: number; page: number; pageSize: number }> {
    return this.componentsService.getVersions(id, queryDto, req.user.id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new version of a component' })
  @ApiParam({ name: 'id', description: 'Component ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        changeLog: { 
          type: 'string', 
          example: 'Added new chart types and improved performance',
          description: 'Description of changes in this version'
        },
        markStable: {
          type: 'boolean',
          example: false,
          description: 'Mark this version as stable (optional)',
        },
      },
      required: ['changeLog'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Component version created successfully',
    type: ComponentVersionDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component not found or access denied' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid version data' })
  async createVersion(
    @Param('id') id: string,
    @Body() body: { changeLog: string; markStable?: boolean },
    @Request() req: any,
  ): Promise<ComponentVersionDto> {
    return this.componentsService.createVersion(
      id,
      body.changeLog,
      body.markStable || false,
      req.user.id,
    );
  }

  @Put(':id/versions/:version')
  @ApiOperation({ summary: 'Update a specific component version' })
  @ApiParam({ name: 'id', description: 'Component ID', type: 'string' })
  @ApiParam({ name: 'version', description: 'Version number', type: 'number' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        changeLog: { 
          type: 'string', 
          example: 'Updated change log',
        },
        isStable: {
          type: 'boolean',
          example: true,
        },
        isDeprecated: {
          type: 'boolean',
          example: false,
        },
        minVersion: {
          type: 'string',
          example: '2.1.0',
          description: 'Minimum compatible app version',
        },
        maxVersion: {
          type: 'string',
          example: '3.0.0',
          description: 'Maximum compatible app version',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Component version updated successfully',
    type: ComponentVersionDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component or version not found or access denied' })
  async updateVersion(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() body: {
      changeLog?: string;
      isStable?: boolean;
      isDeprecated?: boolean;
      minVersion?: string;
      maxVersion?: string;
    },
    @Request() req: any,
  ): Promise<ComponentVersionDto> {
    return this.componentsService.updateVersion(id, version, body, req.user.id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get component usage statistics' })
  @ApiParam({ name: 'id', description: 'Component ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage statistics retrieved successfully',
    type: ComponentUsageStatsDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Component not found or access denied' })
  async getUsageStats(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ComponentUsageStatsDto> {
    return this.componentsService.getUsageStats(id, req.user.id);
  }

  // Health check endpoint
  @Get('health/status')
  @ApiOperation({ summary: 'Check components service health' })
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
    const healthy = await this.componentsService.isHealthy();
    return {
      healthy,
      timestamp: new Date().toISOString(),
    };
  }
}