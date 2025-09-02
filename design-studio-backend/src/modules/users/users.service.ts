import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findById(id: string) {
    return this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        preferences: true,
        limits: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.avatar && { avatar: data.avatar.trim() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        preferences: true,
        limits: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  async updatePreferences(userId: string, preferences: any) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { preferences },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        preferences: true,
        limits: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.prismaService.user.count();
      return true;
    } catch {
      return false;
    }
  }
}