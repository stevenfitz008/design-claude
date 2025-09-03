import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class VersionControlService {
  private readonly logger = new Logger(VersionControlService.name);

  constructor(private prisma: PrismaService) {}

  async getComponentVersions(componentId: string) {
    return this.prisma.componentVersion.findMany({
      where: { componentId },
      orderBy: { version: 'desc' },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    });
  }

  async getStableVersions(componentId: string) {
    return this.prisma.componentVersion.findMany({
      where: { componentId, isStable: true },
      orderBy: { version: 'desc' }
    });
  }

  async markVersionDeprecated(componentId: string, version: number) {
    return this.prisma.componentVersion.update({
      where: { componentId_version: { componentId, version } },
      data: { isDeprecated: true }
    });
  }
}