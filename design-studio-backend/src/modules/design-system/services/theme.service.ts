import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);

  constructor(private prisma: PrismaService) {}

  async createTheme(userId: string, data: { name: string; description?: string; definition: any }) {
    return this.prisma.designTheme.create({
      data: { ...data, createdBy: userId }
    });
  }

  async getThemes(userId?: string) {
    const where = userId 
      ? { OR: [{ createdBy: userId }, { isPublic: true }] }
      : { isPublic: true };
      
    return this.prisma.designTheme.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true } } }
    });
  }

  async getTheme(id: string) {
    return this.prisma.designTheme.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    });
  }

  async updateTheme(id: string, userId: string, data: Partial<{ name: string; description: string; definition: any }>) {
    return this.prisma.designTheme.update({
      where: { id, createdBy: userId },
      data: { ...data, version: { increment: 1 } }
    });
  }
}