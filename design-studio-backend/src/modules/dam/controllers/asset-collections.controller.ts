import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AssetCollectionService } from '../services/asset-collection.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('asset-collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dam/collections')
export class AssetCollectionsController {
  constructor(private readonly collectionService: AssetCollectionService) {}

  @Get()
  async getCollections() {
    return this.collectionService.findAll();
  }

  @Post()
  async createCollection(@Body() collectionData: any) {
    return this.collectionService.create(collectionData);
  }

  @Get(':id')
  async getCollection(@Param('id') id: string) {
    return this.collectionService.findOne(id);
  }

  @Put(':id')
  async updateCollection(@Param('id') id: string, @Body() updateData: any) {
    return this.collectionService.update(id, updateData);
  }

  @Delete(':id')
  async deleteCollection(@Param('id') id: string) {
    return this.collectionService.remove(id);
  }
}