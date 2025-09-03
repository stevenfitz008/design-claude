import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AssetVersionService {
  private readonly logger = new Logger(AssetVersionService.name);

  constructor(private prisma: PrismaService) {}

  async createVersion(assetId: string, userId: string, storageKey: string, size: number, changeLog?: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error('Asset not found');

    const nextVersion = await this.getNextVersion(assetId);
    
    return this.prisma.assetVersion.create({
      data: {
        assetId,
        version: nextVersion,
        storageKey,
        size,
        checksum: 'placeholder-checksum',
        changeLog,
        isActive: true,
        createdBy: userId,
      }
    });
  }

  async getVersionHistory(assetId: string) {
    return this.prisma.assetVersion.findMany({
      where: { assetId },
      orderBy: { version: 'desc' },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    });
  }

  private async getNextVersion(assetId: string): Promise<number> {
    const latest = await this.prisma.assetVersion.findFirst({
      where: { assetId },
      orderBy: { version: 'desc' }
    });
    return (latest?.version || 0) + 1;
  }
}