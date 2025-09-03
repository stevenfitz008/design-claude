import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class DependencyService {
  private readonly logger = new Logger(DependencyService.name);

  constructor(private prisma: PrismaService) {}

  async addDependency(componentId: string, dependsOnId: string, type: 'REQUIRED' | 'OPTIONAL' | 'PEER') {
    return this.prisma.componentDependency.create({
      data: { componentId, dependsOnId, dependencyType: type }
    });
  }

  async getComponentDependencies(componentId: string) {
    return this.prisma.componentDependency.findMany({
      where: { componentId },
      include: { dependsOn: true }
    });
  }

  async validateDependencies(componentId: string): Promise<{ valid: boolean; missing: string[] }> {
    const dependencies = await this.getComponentDependencies(componentId);
    const missing: string[] = [];
    
    for (const dep of dependencies) {
      if (dep.dependencyType === 'REQUIRED') {
        const exists = await this.prisma.component.findUnique({
          where: { id: dep.dependsOnId }
        });
        if (!exists) {
          missing.push(dep.dependsOnId);
        }
      }
    }
    
    return { valid: missing.length === 0, missing };
  }
}