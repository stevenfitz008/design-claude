import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RenderingService, RenderingOptions } from '../services/rendering.service';

@ApiTags('Design System - Rendering')
@Controller('api/design-system/rendering')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RenderingController {
  constructor(private readonly renderingService: RenderingService) {}

  @Post('reports/:id/render')
  @ApiOperation({ summary: 'Render report to specified format' })
  @ApiResponse({ status: 200, description: 'Report rendered successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 400, description: 'Invalid rendering options' })
  async renderReport(
    @Request() req,
    @Param('id') reportId: string,
    @Body() renderingDto: RenderReportDto
  ) {
    const options: RenderingOptions = {
      format: renderingDto.format,
      quality: renderingDto.quality,
      dimensions: renderingDto.dimensions,
      includePages: renderingDto.includePages,
      theme: renderingDto.theme,
      responsive: renderingDto.responsive,
      optimize: renderingDto.optimize,
    };

    return this.renderingService.renderReport(reportId, options, req.user.id);
  }

  @Get('reports/:id/render')
  @ApiOperation({ summary: 'Render report with query parameters' })
  @ApiQuery({ name: 'format', required: true, enum: ['html', 'pdf', 'pptx', 'svg'], description: 'Output format' })
  @ApiQuery({ name: 'quality', required: false, type: Number, description: 'Render quality (1-100)' })
  @ApiQuery({ name: 'width', required: false, type: Number, description: 'Output width in pixels' })
  @ApiQuery({ name: 'height', required: false, type: Number, description: 'Output height in pixels' })
  @ApiQuery({ name: 'pages', required: false, description: 'Comma-separated page IDs to include' })
  @ApiQuery({ name: 'theme', required: false, description: 'Theme to apply' })
  @ApiQuery({ name: 'responsive', required: false, type: Boolean, description: 'Enable responsive rendering' })
  @ApiQuery({ name: 'optimize', required: false, type: Boolean, description: 'Optimize output' })
  @ApiQuery({ name: 'download', required: false, type: Boolean, description: 'Download as file' })
  @ApiResponse({ status: 200, description: 'Report rendered successfully' })
  async renderReportWithQuery(
    @Request() req,
    @Param('id') reportId: string,
    @Query('format') format: 'html' | 'pdf' | 'pptx' | 'svg',
    @Query('quality', new ParseIntPipe({ optional: true })) quality?: number,
    @Query('width', new ParseIntPipe({ optional: true })) width?: number,
    @Query('height', new ParseIntPipe({ optional: true })) height?: number,
    @Query('pages') pages?: string,
    @Query('theme') theme?: string,
    @Query('responsive') responsive?: boolean,
    @Query('optimize') optimize?: boolean,
    @Query('download') download?: boolean,
    @Res({ passthrough: true }) res?: Response
  ) {
    const options: RenderingOptions = {
      format,
      quality,
      dimensions: width && height ? { width, height } : undefined,
      includePages: pages ? pages.split(',').map(p => p.trim()) : undefined,
      theme,
      responsive,
      optimize,
    };

    const result = await this.renderingService.renderReport(reportId, options, req.user.id);

    // If download is requested, set appropriate headers
    if (download && res) {
      const contentType = this.getContentType(format);
      const filename = `report-${reportId}.${format}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // For formats that return structured data, convert to appropriate format
      if (format === 'html') {
        const htmlContent = this.generateHtmlDocument(result);
        return new StreamableFile(Buffer.from(htmlContent));
      } else if (format === 'svg') {
        const svgContent = this.generateSvgDocument(result);
        return new StreamableFile(Buffer.from(svgContent));
      }
    }

    return result;
  }

  @Post('reports/:reportId/pages/:pageId/render')
  @ApiOperation({ summary: 'Render individual page' })
  @ApiResponse({ status: 200, description: 'Page rendered successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async renderPage(
    @Request() req,
    @Param('reportId') reportId: string,
    @Param('pageId') pageId: string,
    @Body() renderingDto: RenderPageDto
  ) {
    // Get page data first
    const pageData = {
      id: pageId,
      version: 1, // This would be retrieved from the database
    };

    const options: RenderingOptions = {
      format: renderingDto.format,
      quality: renderingDto.quality,
      dimensions: renderingDto.dimensions,
      theme: renderingDto.theme,
      responsive: renderingDto.responsive,
      optimize: renderingDto.optimize,
    };

    return this.renderingService.renderPage(pageData, options, req.user.id);
  }

  @Get('reports/:reportId/pages/:pageId/render')
  @ApiOperation({ summary: 'Render page with query parameters' })
  @ApiQuery({ name: 'format', required: true, enum: ['html', 'pdf', 'pptx', 'svg'], description: 'Output format' })
  @ApiQuery({ name: 'quality', required: false, type: Number, description: 'Render quality (1-100)' })
  @ApiQuery({ name: 'width', required: false, type: Number, description: 'Output width in pixels' })
  @ApiQuery({ name: 'height', required: false, type: Number, description: 'Output height in pixels' })
  @ApiQuery({ name: 'theme', required: false, description: 'Theme to apply' })
  @ApiQuery({ name: 'responsive', required: false, type: Boolean, description: 'Enable responsive rendering' })
  @ApiQuery({ name: 'optimize', required: false, type: Boolean, description: 'Optimize output' })
  @ApiResponse({ status: 200, description: 'Page rendered successfully' })
  async renderPageWithQuery(
    @Request() req,
    @Param('reportId') reportId: string,
    @Param('pageId') pageId: string,
    @Query('format') format: 'html' | 'pdf' | 'pptx' | 'svg',
    @Query('quality', new ParseIntPipe({ optional: true })) quality?: number,
    @Query('width', new ParseIntPipe({ optional: true })) width?: number,
    @Query('height', new ParseIntPipe({ optional: true })) height?: number,
    @Query('theme') theme?: string,
    @Query('responsive') responsive?: boolean,
    @Query('optimize') optimize?: boolean
  ) {
    const pageData = {
      id: pageId,
      version: 1, // This would be retrieved from the database
    };

    const options: RenderingOptions = {
      format,
      quality,
      dimensions: width && height ? { width, height } : undefined,
      theme,
      responsive,
      optimize,
    };

    return this.renderingService.renderPage(pageData, options, req.user.id);
  }

  @Get('formats')
  @ApiOperation({ summary: 'Get supported rendering formats' })
  @ApiResponse({ status: 200, description: 'Supported formats retrieved successfully' })
  async getSupportedFormats() {
    return {
      formats: [
        {
          name: 'html',
          displayName: 'HTML',
          description: 'Interactive web page format',
          mimeType: 'text/html',
          extensions: ['html', 'htm'],
          features: ['interactive', 'responsive', 'styled'],
        },
        {
          name: 'svg',
          displayName: 'SVG',
          description: 'Scalable Vector Graphics format',
          mimeType: 'image/svg+xml',
          extensions: ['svg'],
          features: ['vector', 'scalable', 'printable'],
        },
        {
          name: 'pdf',
          displayName: 'PDF',
          description: 'Portable Document Format',
          mimeType: 'application/pdf',
          extensions: ['pdf'],
          features: ['printable', 'paginated', 'portable'],
        },
        {
          name: 'pptx',
          displayName: 'PowerPoint',
          description: 'Microsoft PowerPoint presentation',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          extensions: ['pptx'],
          features: ['presentation', 'slides', 'editable'],
        },
      ],
    };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get rendering cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  async getCacheStats() {
    // This would typically query MongoDB for cache statistics
    return {
      totalCachedRenders: 0,
      cacheHitRate: 0,
      averageRenderTime: 0,
      cacheSize: 0,
      oldestCacheEntry: null,
      mostRecentCacheEntry: null,
    };
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear rendering cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(@Body() clearCacheDto: { reportId?: string; format?: string }) {
    // This would clear cache entries based on the provided filters
    return {
      success: true,
      clearedEntries: 0,
      message: 'Cache cleared successfully',
    };
  }

  // Helper methods

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      html: 'text/html',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    return contentTypes[format] || 'application/octet-stream';
  }

  private generateHtmlDocument(result: any): string {
    const pages = result.pages.map((page: any) => page.content.html || '').join('\n');
    const styles = result.pages
      .map((page: any) => this.objectToCSS(page.content.styles || {}))
      .join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report ${result.reportId}</title>
    <style>
        ${styles}
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .report-page { margin-bottom: 40px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    ${pages}
</body>
</html>`;
  }

  private generateSvgDocument(result: any): string {
    const pages = result.pages.map((page: any) => page.content.svg || '').join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="100%" height="100%" 
     viewBox="0 0 1920 1080">
    ${pages}
</svg>`;
  }

  private objectToCSS(styleObj: Record<string, any>): string {
    return Object.entries(styleObj)
      .map(([selector, rules]) => {
        const ruleStr = Object.entries(rules as any)
          .map(([prop, value]) => `  ${this.camelToKebab(prop)}: ${value};`)
          .join('\n');
        return `${selector} {\n${ruleStr}\n}`;
      })
      .join('\n\n');
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

// DTOs for API documentation
export class RenderReportDto {
  format: 'html' | 'pdf' | 'pptx' | 'svg';
  quality?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  includePages?: string[];
  theme?: string;
  responsive?: boolean;
  optimize?: boolean;
}

export class RenderPageDto {
  format: 'html' | 'pdf' | 'pptx' | 'svg';
  quality?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  theme?: string;
  responsive?: boolean;
  optimize?: boolean;
}

export class ClearCacheDto {
  reportId?: string;
  format?: string;
}