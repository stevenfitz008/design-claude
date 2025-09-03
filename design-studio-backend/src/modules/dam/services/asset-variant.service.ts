import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AssetTransformationService } from './asset-transformation.service';

@Injectable()
export class AssetVariantService {
  constructor(
    private prismaService: PrismaService,
    private assetTransformationService: AssetTransformationService,
  ) {}

  async getAssetVariants(assetId: string) {
    const asset = await this.prismaService.asset.findUnique({
      where: { id: assetId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Generate common variants if they don't exist
    const variants = await this.generateCommonVariants(assetId);

    return {
      success: true,
      data: {
        asset,
        variants,
      },
      timestamp: Date.now(),
    };
  }

  async generateVariant(assetId: string, variantData: any) {
    const asset = await this.prismaService.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Use asset transformation service to generate variant
    const transformedAsset = await this.assetTransformationService.transformAsset(
      assetId,
      {
        width: variantData.width,
        height: variantData.height,
        format: variantData.format,
        quality: variantData.quality,
      },
    );

    return {
      success: true,
      data: transformedAsset,
      timestamp: Date.now(),
    };
  }

  private async generateCommonVariants(assetId: string) {
    const asset = await this.prismaService.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return [];
    }

    const commonSizes = [
      { width: 150, height: 150, name: 'thumbnail' },
      { width: 400, height: 400, name: 'medium' },
      { width: 800, height: 800, name: 'large' },
    ];

    const variants = [];

    for (const size of commonSizes) {
      try {
        const variant = await this.assetTransformationService.transformAsset(
          assetId,
          {
            width: size.width,
            height: size.height,
            format: 'webp',
            quality: 80,
          },
        );
        variants.push({
          ...variant,
          name: size.name,
        });
      } catch (error) {
        // Skip failed transformations
        console.warn(`Failed to generate ${size.name} variant for asset ${assetId}:`, error.message);
      }
    }

    return variants;
  }

  async deleteVariant(assetId: string, variantId: string) {
    // Implementation for deleting specific variants
    const variant = await this.prismaService.assetVersion.findFirst({
      where: {
        assetId,
        id: variantId,
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.prismaService.assetVersion.delete({
      where: { id: variantId },
    });

    return {
      success: true,
      message: 'Variant deleted successfully',
      timestamp: Date.now(),
    };
  }
}