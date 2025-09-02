import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ExportFormat, ExportQuality, ExportOptionsDto } from '../dto/export.dto';
import { ImageExportService } from './image-export.service';

@Injectable()
export class VideoExportService {
  private readonly outputDir = process.env.EXPORT_OUTPUT_DIR || './exports';
  private readonly tempDir = process.env.TEMP_DIR || './temp';
  
  private readonly qualityPresets = {
    [ExportQuality.LOW]: {
      bitrate: '500k',
      crf: 28,
      preset: 'fast',
      profile: 'baseline',
    },
    [ExportQuality.MEDIUM]: {
      bitrate: '1000k',
      crf: 23,
      preset: 'medium',
      profile: 'main',
    },
    [ExportQuality.HIGH]: {
      bitrate: '2000k',
      crf: 18,
      preset: 'slow',
      profile: 'high',
    },
    [ExportQuality.ULTRA]: {
      bitrate: '4000k',
      crf: 15,
      preset: 'veryslow',
      profile: 'high',
    },
  };

  constructor(private readonly imageExportService: ImageExportService) {}

  async exportVideo(
    canvasData: any,
    timelineData: any,
    options: ExportOptionsDto,
    outputPath: string,
    onProgress?: (progress: number) => void,
  ): Promise<{ filePath: string; fileSize: number; metadata: any }> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });

    const tempFramesDir = path.join(this.tempDir, `frames_${Date.now()}`);
    await fs.mkdir(tempFramesDir, { recursive: true });

    try {
      // Generate frame sequence
      const frameCount = await this.generateFrameSequence(
        canvasData,
        timelineData,
        options,
        tempFramesDir,
        onProgress,
      );

      // Create video from frames
      const videoMetadata = await this.createVideoFromFrames(
        tempFramesDir,
        frameCount,
        options,
        outputPath,
        onProgress,
      );

      // Clean up temporary frames
      await this.cleanupTempFiles(tempFramesDir);

      // Get final file stats
      const stats = await fs.stat(outputPath);

      return {
        filePath: outputPath,
        fileSize: stats.size,
        metadata: {
          ...videoMetadata,
          duration: options.duration,
          fps: options.fps,
          frameCount,
        },
      };
    } catch (error) {
      // Clean up on error
      await this.cleanupTempFiles(tempFramesDir);
      throw error;
    }
  }

  async exportGIF(
    canvasData: any,
    timelineData: any,
    options: ExportOptionsDto,
    outputPath: string,
    onProgress?: (progress: number) => void,
  ): Promise<{ filePath: string; fileSize: number; metadata: any }> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    const tempFramesDir = path.join(this.tempDir, `gif_frames_${Date.now()}`);
    await fs.mkdir(tempFramesDir, { recursive: true });

    try {
      // Generate frame sequence with optimized settings for GIF
      const gifOptions = {
        ...options,
        fps: Math.min(options.fps || 15, 20), // Limit GIF FPS for file size
        format: ExportFormat.PNG,
      };

      const frameCount = await this.generateFrameSequence(
        canvasData,
        timelineData,
        gifOptions,
        tempFramesDir,
        (progress) => onProgress && onProgress(progress * 0.7), // 70% for frame generation
      );

      // Create GIF from frames using FFmpeg with optimization
      const gifMetadata = await this.createGIFFromFrames(
        tempFramesDir,
        frameCount,
        options,
        outputPath,
        (progress) => onProgress && onProgress(70 + progress * 0.3), // 30% for GIF creation
      );

      // Clean up temporary frames
      await this.cleanupTempFiles(tempFramesDir);

      // Get final file stats
      const stats = await fs.stat(outputPath);

      return {
        filePath: outputPath,
        fileSize: stats.size,
        metadata: {
          ...gifMetadata,
          duration: options.duration,
          fps: gifOptions.fps,
          frameCount,
          loop: options.loop,
        },
      };
    } catch (error) {
      await this.cleanupTempFiles(tempFramesDir);
      throw error;
    }
  }

  private async generateFrameSequence(
    canvasData: any,
    timelineData: any,
    options: ExportOptionsDto,
    outputDir: string,
    onProgress?: (progress: number) => void,
  ): Promise<number> {
    const duration = options.duration || 5; // Default 5 seconds
    const fps = options.fps || 30;
    const frameCount = Math.ceil(duration * fps);
    
    const width = options.width || 1920;
    const height = options.height || 1080;

    for (let frame = 0; frame < frameCount; frame++) {
      const time = frame / fps;
      const progress = (frame / frameCount) * 100;

      // Generate canvas state at this time
      const frameCanvasData = this.interpolateCanvasAtTime(canvasData, timelineData, time);

      // Export frame as image
      const framePath = path.join(outputDir, `frame_${frame.toString().padStart(6, '0')}.png`);
      
      await this.imageExportService.exportImage(
        frameCanvasData,
        {
          format: ExportFormat.PNG,
          width,
          height,
          quality: options.quality,
          transparent: false, // Videos don't support transparency
          backgroundColor: options.backgroundColor || '#000000',
        },
        framePath,
      );

      if (onProgress && frame % 10 === 0) {
        onProgress(progress);
      }
    }

    return frameCount;
  }

  private interpolateCanvasAtTime(canvasData: any, timelineData: any, time: number): any {
    if (!timelineData || !timelineData.tracks) {
      return canvasData;
    }

    // Create a copy of canvas data to modify
    const frameData = JSON.parse(JSON.stringify(canvasData));

    // Apply animation transformations
    timelineData.tracks.forEach((track: any) => {
      if (!track.enabled || !track.keyframes || track.keyframes.length === 0) {
        return;
      }

      // Find the element to animate
      const element = this.findElementById(frameData, track.targetId);
      if (!element) return;

      // Find surrounding keyframes
      let prevKeyframe = null;
      let nextKeyframe = null;

      for (const keyframe of track.keyframes) {
        if (keyframe.time <= time) {
          prevKeyframe = keyframe;
        }
        if (keyframe.time >= time && !nextKeyframe) {
          nextKeyframe = keyframe;
          break;
        }
      }

      // Interpolate value
      let value;
      if (!prevKeyframe) {
        value = nextKeyframe?.value;
      } else if (!nextKeyframe || prevKeyframe.time === nextKeyframe.time) {
        value = prevKeyframe.value;
      } else {
        // Apply easing and interpolate
        const progress = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
        const easedProgress = this.applyEasing(progress, prevKeyframe.easing, prevKeyframe.easingParams);
        value = this.interpolateValue(prevKeyframe.value, nextKeyframe.value, easedProgress);
      }

      // Apply the animated value to the element
      if (value !== undefined) {
        element[track.property] = value;
      }
    });

    return frameData;
  }

  private findElementById(canvasData: any, id: string): any {
    if (!canvasData?.elements) return null;

    for (const element of canvasData.elements) {
      if (element.id === id) {
        return element;
      }
      // Recursively search in nested elements (groups)
      if (element.children) {
        const found = this.findElementById({ elements: element.children }, id);
        if (found) return found;
      }
    }
    return null;
  }

  private applyEasing(t: number, easing: string = 'linear', params?: number[]): number {
    switch (easing.toLowerCase()) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - Math.pow(1 - t, 2);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'cubic-bezier':
        if (params && params.length === 4) {
          return this.cubicBezier(t, params[0], params[1], params[2], params[3]);
        }
        return t;
      case 'linear':
      default:
        return t;
    }
  }

  private cubicBezier(t: number, p1: number, p2: number, p3: number, p4: number): number {
    // Simplified cubic bezier calculation
    // In production, use a more accurate implementation
    return (1 - t) ** 3 * 0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p3 + t ** 3 * 1;
  }

  private interpolateValue(startValue: any, endValue: any, progress: number): any {
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return startValue + (endValue - startValue) * progress;
    }
    
    if (typeof startValue === 'string' && typeof endValue === 'string') {
      // For colors, parse and interpolate
      if (startValue.startsWith('#') && endValue.startsWith('#')) {
        return this.interpolateColor(startValue, endValue, progress);
      }
    }

    // For non-numeric values, snap to nearest
    return progress < 0.5 ? startValue : endValue;
  }

  private interpolateColor(startColor: string, endColor: string, progress: number): string {
    const start = this.parseHexColor(startColor);
    const end = this.parseHexColor(endColor);
    
    const r = Math.round(start.r + (end.r - start.r) * progress);
    const g = Math.round(start.g + (end.g - start.g) * progress);
    const b = Math.round(start.b + (end.b - start.b) * progress);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private parseHexColor(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }

  private async createVideoFromFrames(
    framesDir: string,
    frameCount: number,
    options: ExportOptionsDto,
    outputPath: string,
    onProgress?: (progress: number) => void,
  ): Promise<any> {
    const quality = this.qualityPresets[options.quality || ExportQuality.HIGH];
    const fps = options.fps || 30;
    
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-framerate', fps.toString(),
        '-i', path.join(framesDir, 'frame_%06d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', quality.crf.toString(),
        '-preset', quality.preset,
        '-profile:v', quality.profile,
      ];

      if (options.bitrate) {
        ffmpegArgs.push('-b:v', `${options.bitrate}k`);
      }

      if (options.format === ExportFormat.WEBM) {
        ffmpegArgs.splice(ffmpegArgs.indexOf('-c:v') + 1, 1, 'libvpx-vp9');
        ffmpegArgs.push('-deadline', 'good', '-cpu-used', '2');
      }

      if (options.loop && options.format === ExportFormat.MP4) {
        ffmpegArgs.push('-stream_loop', '-1');
      }

      ffmpegArgs.push('-y', outputPath);

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      let progress = 0;

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        // Parse FFmpeg progress
        const frameMatch = output.match(/frame=\s*(\d+)/);
        if (frameMatch) {
          const currentFrame = parseInt(frameMatch[1]);
          progress = (currentFrame / frameCount) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({
            format: options.format.toLowerCase(),
            codec: options.format === ExportFormat.WEBM ? 'vp9' : 'h264',
            quality: quality.crf,
            bitrate: options.bitrate || quality.bitrate,
          });
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg error: ${error.message}`));
      });
    });
  }

  private async createGIFFromFrames(
    framesDir: string,
    frameCount: number,
    options: ExportOptionsDto,
    outputPath: string,
    onProgress?: (progress: number) => void,
  ): Promise<any> {
    const fps = Math.min(options.fps || 15, 20); // Limit GIF FPS
    
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-framerate', fps.toString(),
        '-i', path.join(framesDir, 'frame_%06d.png'),
        '-vf', 'palettegen=reserve_transparent=1',
        '-y', path.join(path.dirname(outputPath), 'palette.png'),
      ];

      // First pass: generate palette
      const paletteProcess = spawn('ffmpeg', ffmpegArgs);

      paletteProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Palette generation failed with code ${code}`));
          return;
        }

        // Second pass: create GIF with palette
        const gifArgs = [
          '-framerate', fps.toString(),
          '-i', path.join(framesDir, 'frame_%06d.png'),
          '-i', path.join(path.dirname(outputPath), 'palette.png'),
          '-lavfi', 'paletteuse=reserve_transparent=1',
        ];

        if (options.loop !== false) {
          gifArgs.push('-loop', '0');
        }

        gifArgs.push('-y', outputPath);

        const gifProcess = spawn('ffmpeg', gifArgs);
        let progress = 0;

        gifProcess.stderr.on('data', (data) => {
          const output = data.toString();
          const frameMatch = output.match(/frame=\s*(\d+)/);
          if (frameMatch) {
            const currentFrame = parseInt(frameMatch[1]);
            progress = (currentFrame / frameCount) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          }
        });

        gifProcess.on('close', (code) => {
          // Clean up palette file
          fs.unlink(path.join(path.dirname(outputPath), 'palette.png')).catch(() => {});

          if (code === 0) {
            resolve({
              format: 'gif',
              fps,
              loop: options.loop !== false,
              optimized: true,
            });
          } else {
            reject(new Error(`GIF creation failed with code ${code}`));
          }
        });

        gifProcess.on('error', (error) => {
          reject(new Error(`GIF creation error: ${error.message}`));
        });
      });

      paletteProcess.on('error', (error) => {
        reject(new Error(`Palette generation error: ${error.message}`));
      });
    });
  }

  private async cleanupTempFiles(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp directory ${dir}:`, error.message);
    }
  }

  validateVideoOptions(options: ExportOptionsDto): { valid: boolean; message?: string } {
    if (!options.duration || options.duration < 0.1) {
      return { valid: false, message: 'Duration must be at least 0.1 seconds' };
    }

    if (options.duration > 60) {
      return { valid: false, message: 'Duration cannot exceed 60 seconds' };
    }

    if (options.fps && (options.fps < 1 || options.fps > 120)) {
      return { valid: false, message: 'FPS must be between 1 and 120' };
    }

    const width = options.width || 1920;
    const height = options.height || 1080;

    if (width > 4096 || height > 4096) {
      return { valid: false, message: 'Video dimensions cannot exceed 4096x4096' };
    }

    return { valid: true };
  }
}