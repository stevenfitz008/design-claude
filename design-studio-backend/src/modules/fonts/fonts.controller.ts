import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
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
import { FontsService } from './fonts.service';
import { FontQueryDto } from './dto/font-query.dto';
import { FontResponseDto, FontListResponseDto, FontCategoriesResponseDto } from './dto/font-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('fonts')
@Controller('fonts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Get()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Get all Google Fonts with pagination' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', description: 'Results per page', required: false, example: 50 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Font families retrieved successfully',
    type: FontListResponseDto,
  })
  async getAllFonts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('per_page', new DefaultValuePipe(50), ParseIntPipe) per_page: number,
  ): Promise<FontListResponseDto> {
    return this.fontsService.getAllFonts(page, per_page);
  }

  @Get('search')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Search fonts by name and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Font search results',
    type: FontListResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid search parameters' })
  async searchFonts(@Query() queryDto: FontQueryDto): Promise<FontListResponseDto> {
    return this.fontsService.searchFonts(queryDto);
  }

  @Get('categories')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Get font categories with counts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Font categories',
    type: FontCategoriesResponseDto,
  })
  async getCategories(): Promise<FontCategoriesResponseDto> {
    return this.fontsService.getCategories();
  }

  @Get('trending')
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  @ApiOperation({ summary: 'Get trending fonts' })
  @ApiQuery({ name: 'limit', description: 'Number of trending fonts', required: false, example: 20 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trending fonts',
    type: [FontResponseDto],
  })
  async getTrendingFonts(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<FontResponseDto[]> {
    return this.fontsService.getTrendingFonts(limit);
  }

  @Get(':family')
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute
  @ApiOperation({ summary: 'Get specific font family details' })
  @ApiParam({ name: 'family', description: 'Font family name', type: 'string', example: 'Roboto' })
  @ApiQuery({
    name: 'includeVariants',
    description: 'Include detailed font variants and files',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Font family details',
    type: FontResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Font family not found' })
  async getFontByFamily(
    @Param('family') family: string,
    @Query('includeVariants', new DefaultValuePipe(false), ParseBoolPipe) includeVariants: boolean,
  ): Promise<FontResponseDto> {
    return this.fontsService.getFontByFamily(family, includeVariants);
  }

  @Get(':family/variants')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Get font variants and download URLs' })
  @ApiParam({ name: 'family', description: 'Font family name', type: 'string', example: 'Roboto' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Font variants with download URLs',
    type: FontResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Font family not found' })
  async getFontVariants(@Param('family') family: string): Promise<FontResponseDto> {
    return this.fontsService.getFontByFamily(family, true);
  }

  @Get('health/status')
  @ApiOperation({ summary: 'Check fonts service health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' },
        cached_fonts: { type: 'number' }
      }
    }
  })
  async getHealthStatus(): Promise<{ healthy: boolean; timestamp: string; cached_fonts?: number }> {
    const healthy = await this.fontsService.isHealthy();
    const result: any = {
      healthy,
      timestamp: new Date().toISOString()
    };

    if (healthy) {
      const fonts = await this.fontsService.getAllFonts(1, 1);
      result.cached_fonts = fonts.total;
    }

    return result;
  }
}