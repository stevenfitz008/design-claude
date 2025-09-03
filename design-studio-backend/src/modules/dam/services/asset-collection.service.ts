import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AssetCollectionService {
  private readonly logger = new Logger(AssetCollectionService.name);

  constructor(private prisma: PrismaService) {}

  async createCollection(userId: string, data: { name: string; description?: string; color?: string; parentId?: string }) {
    return this.prisma.assetCollection.create({
      data: { ...data, userId }
    });
  }

  async getUserCollections(userId: string) {
    return this.prisma.assetCollection.findMany({
      where: { userId },
      include: {
        assets: { include: { asset: true } },
        children: true,
        parent: true,
      }
    });
  }

  async addAssetToCollection(collectionId: string, assetId: string) {
    return this.prisma.assetCollectionItem.create({
      data: { collectionId, assetId }
    });
  }

  async removeAssetFromCollection(collectionId: string, assetId: string) {
    return this.prisma.assetCollectionItem.deleteMany({
      where: { collectionId, assetId }
    });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prisma.assetCollection.findMany({
      where,
      include: {
        assets: { include: { asset: true } },
        children: true,
        parent: true,
        _count: { select: { assets: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: any) {
    return this.prisma.assetCollection.create({
      data,
      include: {
        assets: { include: { asset: true } },
        children: true,
        parent: true,
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.assetCollection.findUnique({
      where: { id },
      include: {
        assets: { include: { asset: true } },
        children: true,
        parent: true,
        _count: { select: { assets: true } }
      }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.assetCollection.update({
      where: { id },
      data,
      include: {
        assets: { include: { asset: true } },
        children: true,
        parent: true,
      }
    });
  }

  async remove(id: string) {
    return this.prisma.assetCollection.delete({
      where: { id }
    });
  }
}