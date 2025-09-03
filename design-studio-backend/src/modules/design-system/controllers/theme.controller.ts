import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ThemeService } from '../services/theme.service';

@ApiTags('Design System - Themes')
@Controller('api/design-system/themes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Post()
  @ApiOperation({ summary: 'Create design theme' })
  @ApiResponse({ status: 201, description: 'Theme created successfully' })
  async createTheme(
    @Request() req,
    @Body() createDto: { name: string; description?: string; definition: any }
  ) {
    return this.themeService.createTheme(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get themes' })
  @ApiResponse({ status: 200, description: 'Themes retrieved successfully' })
  async getThemes(@Request() req) {
    return this.themeService.getThemes(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get theme by ID' })
  @ApiResponse({ status: 200, description: 'Theme retrieved successfully' })
  async getTheme(@Param('id') id: string) {
    return this.themeService.getTheme(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update theme' })
  @ApiResponse({ status: 200, description: 'Theme updated successfully' })
  async updateTheme(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: { name?: string; description?: string; definition?: any }
  ) {
    return this.themeService.updateTheme(id, req.user.id, updateDto);
  }
}