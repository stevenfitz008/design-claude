import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExportService } from './export.service';
import { CreateExportDto, ExportDto } from './dto/export.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Export')
@ApiBearerAuth()
@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new export job' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Export job created successfully',
    type: ExportDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid export parameters',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found',
  })
  async createExport(
    @Body() createExportDto: CreateExportDto,
    @Request() req: any,
  ): Promise<ApiResponseDto<ExportDto>> {
    const result = await this.exportService.createExport(createExportDto, req.user.id);
    return ApiResponseDto.success(result.data as any, result.message);
  }

  @Get()
  @ApiOperation({ summary: 'Get user exports with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exports retrieved successfully',
    type: [ExportDto],
  })
  async getUserExports(
    @Query() paginationDto: PaginationDto,
    @Request() req: any,
  ): Promise<ApiResponseDto<ExportDto[]>> {
    const result = await this.exportService.getUserExports(
      req.user.id,
      paginationDto.page,
      paginationDto.limit,
    );
    
    return {
      success: true,
      data: result.data as any,
      message: 'Exports retrieved successfully',
      timestamp: Date.now(),
      ...result.pagination && { pagination: result.pagination },
    };
  }

  @Get(':exportId')
  @ApiOperation({ summary: 'Get export status and details' })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export details retrieved successfully',
    type: ExportDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found',
  })
  async getExportStatus(
    @Param('exportId') exportId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto<ExportDto>> {
    const result = await this.exportService.getExportStatus(exportId, req.user.id);
    return ApiResponseDto.success(result.data as any, 'Export details retrieved successfully');
  }

  @Delete(':exportId')
  @ApiOperation({ summary: 'Delete an export' })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found',
  })
  async deleteExport(
    @Param('exportId') exportId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto<null>> {
    const result = await this.exportService.deleteExport(exportId, req.user.id);
    return ApiResponseDto.success(null, result.message);
  }

  @Post(':exportId/cancel')
  @ApiOperation({ summary: 'Cancel a pending or processing export' })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export cancelled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Export cannot be cancelled',
  })
  async cancelExport(
    @Param('exportId') exportId: string,
    @Request() req: any,
  ): Promise<ApiResponseDto<null>> {
    const result = await this.exportService.cancelExport(exportId, req.user.id);
    return ApiResponseDto.success(null, result.message);
  }
}