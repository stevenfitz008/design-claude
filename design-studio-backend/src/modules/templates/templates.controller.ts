import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TemplatesService } from './templates.service';
import { TemplateQueryDto } from './dto/template-query.dto';
import { 
  TemplateResponseDto, 
  TemplateWithCanvasDto, 
  TemplateListResponseDto, 
  TemplateCategoriesResponseDto,
  TemplateUsageResponseDto 
} from './dto/template-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Get templates with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: TemplateListResponseDto,
  })
  async getTemplates(@Query() queryDto: TemplateQueryDto): Promise<TemplateListResponseDto> {
    return this.templatesService.getTemplates(queryDto);
  }

  @Get('categories')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Get template categories with counts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template categories',
    type: TemplateCategoriesResponseDto,
  })
  async getCategories(): Promise<TemplateCategoriesResponseDto> {
    return this.templatesService.getCategories();
  }

  @Get('featured')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Get featured templates' })
  @ApiQuery({ name: 'limit', description: 'Number of featured templates', required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured templates',
    type: [TemplateResponseDto],
  })
  async getFeaturedTemplates(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<TemplateResponseDto[]> {
    return this.templatesService.getFeaturedTemplates(limit);
  }

  @Get('popular')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Get popular templates' })
  @ApiQuery({ name: 'limit', description: 'Number of popular templates', required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Popular templates',
    type: [TemplateResponseDto],
  })
  async getPopularTemplates(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<TemplateResponseDto[]> {
    return this.templatesService.getPopularTemplates(limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get templates by user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
  @ApiQuery({ 
    name: 'includePrivate', 
    description: 'Include private templates (only works for own templates)', 
    required: false, 
    example: false 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User templates',
    type: [TemplateResponseDto],
  })
  async getTemplatesByUser(
    @Param('userId') userId: string,
    @Query('includePrivate', new DefaultValuePipe(false), ParseBoolPipe) includePrivate: boolean,
    @Request() req: any,
  ): Promise<TemplateResponseDto[]> {
    // Only allow private templates for the requesting user
    const canIncludePrivate = includePrivate && userId === req.user.id;
    return this.templatesService.getTemplatesByUser(userId, canIncludePrivate);
  }

  @Get(':id')
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute
  @ApiOperation({ summary: 'Get specific template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiQuery({
    name: 'includeCanvas',
    description: 'Include canvas data in response',
    type: 'boolean',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template details',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/TemplateResponseDto' },
        { $ref: '#/components/schemas/TemplateWithCanvasDto' }
      ]
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  async getTemplateById(
    @Param('id') id: string,
    @Query('includeCanvas', new DefaultValuePipe(false), ParseBoolPipe) includeCanvas: boolean,
  ): Promise<TemplateResponseDto | TemplateWithCanvasDto> {
    return this.templatesService.getTemplateById(id, includeCanvas);
  }

  @Get(':id/similar')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Get similar templates' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiQuery({ name: 'limit', description: 'Number of similar templates', required: false, example: 5 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Similar templates',
    type: [TemplateResponseDto],
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  async getSimilarTemplates(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<TemplateResponseDto[]> {
    return this.templatesService.searchSimilarTemplates(id, limit);
  }

  @Post(':id/use')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 uses per minute
  @ApiOperation({ summary: 'Track template usage (download, preview, use)' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiQuery({ 
    name: 'type', 
    description: 'Usage type', 
    enum: ['download', 'preview', 'use'], 
    required: false,
    example: 'use'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template usage tracked',
    type: TemplateUsageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Premium template requires Pro plan' })
  async trackTemplateUsage(
    @Param('id') id: string,
    @Query('type') type: 'download' | 'preview' | 'use' = 'use',
    @Request() req: any,
  ): Promise<TemplateUsageResponseDto> {
    return this.templatesService.trackTemplateUsage(id, req.user.id, type);
  }

  @Get('health/status')
  @ApiOperation({ summary: 'Check templates service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' },
        totalTemplates: { type: 'number' }
      }
    }
  })
  async getHealthStatus(): Promise<{ healthy: boolean; timestamp: string; totalTemplates?: number }> {
    const healthy = await this.templatesService.isHealthy();
    const result: any = {
      healthy,
      timestamp: new Date().toISOString(),
    };

    if (healthy) {
      const templates = await this.templatesService.getTemplates({ page: 1, limit: 1 });
      result.totalTemplates = templates.total;
    }

    return result;
  }
}