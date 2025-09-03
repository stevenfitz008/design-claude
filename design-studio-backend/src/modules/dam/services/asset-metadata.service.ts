import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as sharp from 'sharp';
import * as exifr from 'exifr';
import { fileTypeFromBuffer } from 'file-type';
import * as mimeTypes from 'mime-types';
import { 
  AssetSearchIndex, 
  AssetSearchIndexType,
  AssetProcessingJob,
  AssetProcessingJobType 
} from '../../../database/mongodb/schemas';

export interface MetadataExtractionResult {
  technical: {
    format: string;
    mimeType: string;
    fileSize: number;
    dimensions: { width: number; height: number };
    colorProfile?: string;
    bitDepth?: number;
    compression?: string;
    dpi?: number;
    hasAnimation: boolean;
    duration?: number;
  };
  visual: {
    dominantColors: string[];
    colorPalette: string[];
    brightness: number;
    contrast: number;
    saturation: number;
    hasTransparency: boolean;
    aspectRatio: number;
    orientation: 'landscape' | 'portrait' | 'square';
  };
  exif?: {
    cameraMake?: string;
    cameraModel?: string;
    dateTime?: Date;
    gpsLatitude?: number;
    gpsLongitude?: number;
    [key: string]: any;
  };
  content?: {
    detectedObjects: string[];
    hasText: boolean;
    hasFaces: boolean;
    isScreenshot: boolean;
    aiDescription?: string;
    keywords: string[];
  };
}

@Injectable()
export class AssetMetadataService {
  private readonly logger = new Logger(AssetMetadataService.name);

  constructor(
    private prisma: PrismaService,
    @InjectModel(AssetSearchIndex.name)
    private assetSearchIndexModel: Model<AssetSearchIndexType>,
    @InjectModel(AssetProcessingJob.name)
    private assetProcessingJobModel: Model<AssetProcessingJobType>,
  ) {}

  /**
   * Extract comprehensive metadata from asset buffer
   */
  async extractMetadata(
    buffer: Buffer,
    filename: string,
    assetId: string,
  ): Promise<MetadataExtractionResult> {
    try {
      this.logger.log(`Extracting metadata for asset ${assetId}`);

      const [fileType, sharpMetadata, exifData] = await Promise.all([
        fileTypeFromBuffer(buffer),
        this.extractImageMetadata(buffer).catch(() => null),
        this.extractExifData(buffer).catch(() => null),
      ]);

      const format = fileType?.ext || filename.split('.').pop()?.toLowerCase() || 'unknown';
      const mimeType = fileType?.mime || mimeTypes.lookup(filename) || 'application/octet-stream';

      const result: MetadataExtractionResult = {
        technical: {
          format,
          mimeType,
          fileSize: buffer.length,
          dimensions: sharpMetadata 
            ? { width: sharpMetadata.width, height: sharpMetadata.height }
            : { width: 0, height: 0 },
          colorProfile: sharpMetadata?.icc?.description,
          bitDepth: sharpMetadata?.depth,
          compression: sharpMetadata?.compression,
          dpi: sharpMetadata?.density,
          hasAnimation: sharpMetadata?.pages ? sharpMetadata.pages > 1 : false,
        },
        visual: sharpMetadata ? await this.extractVisualFeatures(buffer, sharpMetadata) : {
          dominantColors: [],
          colorPalette: [],
          brightness: 50,
          contrast: 50,
          saturation: 50,
          hasTransparency: false,
          aspectRatio: 1,
          orientation: 'square' as const,
        },
        exif: exifData,
        content: await this.extractContentFeatures(buffer, format),
      };

      return result;
    } catch (error) {
      this.logger.error(`Failed to extract metadata for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Extract image metadata using Sharp
   */
  private async extractImageMetadata(buffer: Buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata;
    } catch (error) {
      this.logger.warn('Failed to extract Sharp metadata:', error);
      return null;
    }
  }

  /**
   * Extract EXIF data
   */
  private async extractExifData(buffer: Buffer) {
    try {
      const exifData = await exifr.parse(buffer, {
        pick: [
          'Make', 'Model', 'DateTime', 'DateTimeOriginal', 'DateTimeDigitized',
          'GPS', 'GPSLatitude', 'GPSLongitude', 'Orientation', 'Software',
          'ColorSpace', 'WhiteBalance', 'Flash', 'FocalLength', 'ISO',
          'ExposureTime', 'FNumber', 'ExposureProgram'
        ]
      });

      if (exifData) {
        return {
          cameraMake: exifData.Make,
          cameraModel: exifData.Model,
          dateTime: exifData.DateTime || exifData.DateTimeOriginal,
          gpsLatitude: exifData.GPSLatitude,
          gpsLongitude: exifData.GPSLongitude,
          ...exifData,
        };
      }
      return null;
    } catch (error) {
      this.logger.warn('Failed to extract EXIF data:', error);
      return null;
    }
  }

  /**
   * Extract visual features from image
   */
  private async extractVisualFeatures(buffer: Buffer, metadata: sharp.Metadata) {
    try {
      // Get processed buffer for color analysis
      const { data } = await sharp(buffer)
        .resize(100, 100, { fit: 'cover' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const stats = await sharp(buffer).stats();
      
      // Calculate brightness, contrast, saturation
      const brightness = Math.round((stats.channels[0].mean / 255) * 100);
      const contrast = Math.round(stats.channels[0].stdev * 2); // Simplified contrast calculation
      
      // Calculate saturation for RGB images
      let saturation = 50; // Default for grayscale
      if (stats.channels.length >= 3) {
        const r = stats.channels[0].mean;
        const g = stats.channels[1].mean;
        const b = stats.channels[2].mean;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        saturation = max === 0 ? 0 : Math.round(((max - min) / max) * 100);
      }

      // Detect transparency
      const hasTransparency = metadata.channels === 4 || metadata.hasAlpha || false;

      // Calculate aspect ratio and orientation
      const aspectRatio = metadata.width && metadata.height 
        ? metadata.width / metadata.height 
        : 1;
      
      let orientation: 'landscape' | 'portrait' | 'square';
      if (aspectRatio > 1.1) orientation = 'landscape';
      else if (aspectRatio < 0.9) orientation = 'portrait';
      else orientation = 'square';

      // Extract color palette (simplified)
      const dominantColors = await this.extractDominantColors(buffer);

      return {
        dominantColors,
        colorPalette: dominantColors, // For now, same as dominant colors
        brightness,
        contrast: Math.min(contrast, 100),
        saturation,
        hasTransparency,
        aspectRatio: Math.round(aspectRatio * 100) / 100,
        orientation,
      };
    } catch (error) {
      this.logger.warn('Failed to extract visual features:', error);
      return {
        dominantColors: [],
        colorPalette: [],
        brightness: 50,
        contrast: 50,
        saturation: 50,
        hasTransparency: false,
        aspectRatio: 1,
        orientation: 'square' as const,
      };
    }
  }

  /**
   * Extract dominant colors from image
   */
  private async extractDominantColors(buffer: Buffer, count = 5): Promise<string[]> {
    try {
      // Resize image for faster processing
      const { data, info } = await sharp(buffer)
        .resize(50, 50, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = [];
      const channels = info.channels;
      
      // Sample pixels
      for (let i = 0; i < data.length; i += channels) {
        if (channels >= 3) {
          pixels.push({
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
          });
        }
      }

      // Simple k-means clustering to find dominant colors
      const dominantColors = this.kMeansColorClustering(pixels, count);
      return dominantColors.map(color => 
        `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`
      );
    } catch (error) {
      this.logger.warn('Failed to extract dominant colors:', error);
      return [];
    }
  }

  /**
   * Simple k-means clustering for color extraction
   */
  private kMeansColorClustering(pixels: { r: number; g: number; b: number }[], k: number) {
    if (pixels.length === 0) return [];

    // Initialize centroids randomly
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push({ ...randomPixel });
    }

    // Run k-means for a few iterations
    for (let iteration = 0; iteration < 5; iteration++) {
      const clusters = Array.from({ length: k }, () => []);

      // Assign pixels to nearest centroid
      pixels.forEach(pixel => {
        let minDistance = Infinity;
        let nearestCentroid = 0;

        centroids.forEach((centroid, index) => {
          const distance = Math.sqrt(
            Math.pow(pixel.r - centroid.r, 2) +
            Math.pow(pixel.g - centroid.g, 2) +
            Math.pow(pixel.b - centroid.b, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = index;
          }
        });

        clusters[nearestCentroid].push(pixel);
      });

      // Update centroids
      clusters.forEach((cluster, index) => {
        if (cluster.length > 0) {
          centroids[index] = {
            r: Math.round(cluster.reduce((sum, p) => sum + p.r, 0) / cluster.length),
            g: Math.round(cluster.reduce((sum, p) => sum + p.g, 0) / cluster.length),
            b: Math.round(cluster.reduce((sum, p) => sum + p.b, 0) / cluster.length),
          };
        }
      });
    }

    return centroids;
  }

  /**
   * Extract content features (placeholder for AI integration)
   */
  private async extractContentFeatures(buffer: Buffer, format: string) {
    // This would integrate with AI services for object detection, OCR, etc.
    // For now, return basic content analysis
    return {
      detectedObjects: [],
      hasText: false,
      hasFaces: false,
      isScreenshot: format === 'png' && buffer.length > 100000, // Simple heuristic
      keywords: [],
    };
  }

  /**
   * Store extracted metadata in database
   */
  async storeMetadata(assetId: string, metadata: MetadataExtractionResult): Promise<void> {
    try {
      // Store in PostgreSQL AssetMetadata table
      await this.prisma.assetMetadata.upsert({
        where: { assetId },
        update: {
          colorProfile: metadata.technical.colorProfile,
          bitDepth: metadata.technical.bitDepth,
          compression: metadata.technical.compression,
          dpi: metadata.technical.dpi,
          cameraMake: metadata.exif?.cameraMake,
          cameraModel: metadata.exif?.cameraModel,
          dateTime: metadata.exif?.dateTime,
          gpsLatitude: metadata.exif?.gpsLatitude,
          gpsLongitude: metadata.exif?.gpsLongitude,
          dominantColors: metadata.visual.dominantColors,
          detectedObjects: metadata.content?.detectedObjects || [],
          description: metadata.content?.aiDescription,
          keywords: metadata.content?.keywords || [],
          hasText: metadata.content?.hasText || false,
          hasFaces: metadata.content?.hasFaces || false,
          isScreenshot: metadata.content?.isScreenshot || false,
          analyzedAt: new Date(),
        },
        create: {
          assetId,
          colorProfile: metadata.technical.colorProfile,
          bitDepth: metadata.technical.bitDepth,
          compression: metadata.technical.compression,
          dpi: metadata.technical.dpi,
          cameraMake: metadata.exif?.cameraMake,
          cameraModel: metadata.exif?.cameraModel,
          dateTime: metadata.exif?.dateTime,
          gpsLatitude: metadata.exif?.gpsLatitude,
          gpsLongitude: metadata.exif?.gpsLongitude,
          dominantColors: metadata.visual.dominantColors,
          detectedObjects: metadata.content?.detectedObjects || [],
          description: metadata.content?.aiDescription,
          keywords: metadata.content?.keywords || [],
          hasText: metadata.content?.hasText || false,
          hasFaces: metadata.content?.hasFaces || false,
          isScreenshot: metadata.content?.isScreenshot || false,
        },
      });

      // Store in MongoDB search index
      await this.updateSearchIndex(assetId, metadata);

    } catch (error) {
      this.logger.error(`Failed to store metadata for asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Update search index with metadata
   */
  private async updateSearchIndex(assetId: string, metadata: MetadataExtractionResult): Promise<void> {
    try {
      const asset = await this.prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          filename: true,
          originalName: true,
          tags: true,
          userId: true,
          size: true,
          width: true,
          height: true,
          mimeType: true,
        },
      });

      if (!asset) return;

      await this.assetSearchIndexModel.findOneAndUpdate(
        { assetId },
        {
          assetId,
          userId: asset.userId,
          searchableContent: {
            title: asset.originalName,
            description: metadata.content?.aiDescription || '',
            tags: asset.tags,
            keywords: metadata.content?.keywords || [],
            categories: [metadata.technical.format.toUpperCase()],
          },
          visualFeatures: metadata.visual,
          technicalSpecs: {
            format: metadata.technical.format,
            fileSize: asset.size,
            dimensions: { 
              width: asset.width || metadata.technical.dimensions.width,
              height: asset.height || metadata.technical.dimensions.height,
            },
            colorProfile: metadata.technical.colorProfile,
            bitDepth: metadata.technical.bitDepth,
            compression: metadata.technical.compression,
            hasAnimation: metadata.technical.hasAnimation,
            duration: metadata.technical.duration,
          },
          contentAnalysis: {
            detectedObjects: metadata.content?.detectedObjects || [],
            detectedText: metadata.content?.hasText ? ['text-detected'] : [],
            sceneType: metadata.content?.isScreenshot ? 'screenshot' : 'photo',
          },
          usageStats: {
            downloadCount: 0,
            viewCount: 0,
            likeCount: 0,
            shareCount: 0,
            popularityScore: 0,
          },
          indexedAt: new Date(),
          lastAnalyzedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      this.logger.error(`Failed to update search index for asset ${assetId}:`, error);
    }
  }

  /**
   * Queue metadata extraction job
   */
  async queueMetadataExtraction(assetId: string, userId: string, storageKey: string): Promise<void> {
    try {
      await this.assetProcessingJobModel.create({
        assetId,
        userId,
        jobType: 'metadata_extraction',
        status: 'pending',
        priority: 5, // Medium priority
        jobData: {
          inputPath: storageKey,
          parameters: {
            extractExif: true,
            extractVisualFeatures: true,
            generateThumbnail: true,
          },
        },
      });

      this.logger.log(`Queued metadata extraction job for asset ${assetId}`);
    } catch (error) {
      this.logger.error(`Failed to queue metadata extraction for asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Get asset metadata with search index data
   */
  async getAssetMetadata(assetId: string) {
    const [metadata, searchIndex] = await Promise.all([
      this.prisma.assetMetadata.findUnique({
        where: { assetId },
      }),
      this.assetSearchIndexModel.findOne({ assetId }),
    ]);

    return {
      metadata,
      searchIndex,
      combined: {
        technical: {
          format: searchIndex?.technicalSpecs.format,
          fileSize: searchIndex?.technicalSpecs.fileSize,
          dimensions: searchIndex?.technicalSpecs.dimensions,
          colorProfile: metadata?.colorProfile,
          bitDepth: metadata?.bitDepth,
          compression: metadata?.compression,
          dpi: metadata?.dpi,
        },
        visual: searchIndex?.visualFeatures,
        exif: {
          cameraMake: metadata?.cameraMake,
          cameraModel: metadata?.cameraModel,
          dateTime: metadata?.dateTime,
          gpsLatitude: metadata?.gpsLatitude,
          gpsLongitude: metadata?.gpsLongitude,
        },
        content: {
          description: metadata?.description,
          keywords: metadata?.keywords || [],
          detectedObjects: metadata?.detectedObjects || [],
          hasText: metadata?.hasText || false,
          hasFaces: metadata?.hasFaces || false,
        },
      },
    };
  }
}