import type { ImageFilters, CropData, ImageElement } from '../types/canvas';

/**
 * Advanced image processor using Canvas API and CSS filters
 * Provides professional-grade photo editing capabilities
 */
export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache = new Map<string, HTMLCanvasElement>();
  
  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: true 
    });
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;
  }

  /**
   * Apply comprehensive filters to an image
   */
  public async processImage(
    image: HTMLImageElement,
    filters: ImageFilters,
    cropData?: CropData,
    cacheKey?: string
  ): Promise<HTMLCanvasElement> {
    // Check cache first
    if (cacheKey && this.imageCache.has(cacheKey)) {
      const cached = this.imageCache.get(cacheKey)!;
      return cached;
    }

    // Set up canvas dimensions
    const sourceWidth = cropData?.width || image.naturalWidth;
    const sourceHeight = cropData?.height || image.naturalHeight;
    
    this.canvas.width = sourceWidth;
    this.canvas.height = sourceHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply CSS filters (hardware accelerated when possible)
    const cssFilters = this.buildCSSFilterString(filters);
    this.ctx.filter = cssFilters;

    // Handle cropping
    if (cropData) {
      this.ctx.drawImage(
        image,
        cropData.x, cropData.y, cropData.width, cropData.height,
        0, 0, this.canvas.width, this.canvas.height
      );
    } else {
      this.ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
    }

    // Apply advanced pixel-level effects
    await this.applyAdvancedEffects(filters);

    // Cache the result
    if (cacheKey) {
      const cachedCanvas = document.createElement('canvas');
      cachedCanvas.width = this.canvas.width;
      cachedCanvas.height = this.canvas.height;
      const cachedCtx = cachedCanvas.getContext('2d')!;
      cachedCtx.drawImage(this.canvas, 0, 0);
      this.imageCache.set(cacheKey, cachedCanvas);
    }

    return this.canvas;
  }

  /**
   * Build CSS filter string for hardware-accelerated effects
   */
  private buildCSSFilterString(filters: ImageFilters): string {
    const cssFilters: string[] = [];

    // Basic adjustments
    if (filters.brightness !== 100) {
      cssFilters.push(`brightness(${filters.brightness}%)`);
    }
    if (filters.contrast !== 100) {
      cssFilters.push(`contrast(${filters.contrast}%)`);
    }
    if (filters.saturation !== 100) {
      cssFilters.push(`saturate(${filters.saturation}%)`);
    }
    if (filters.hue !== 0) {
      cssFilters.push(`hue-rotate(${filters.hue}deg)`);
    }
    if (filters.blur > 0) {
      cssFilters.push(`blur(${filters.blur}px)`);
    }
    if (filters.sepia > 0) {
      cssFilters.push(`sepia(${filters.sepia}%)`);
    }
    if (filters.grayscale > 0) {
      cssFilters.push(`grayscale(${filters.grayscale}%)`);
    }
    if (filters.invert > 0) {
      cssFilters.push(`invert(${filters.invert}%)`);
    }

    // Advanced CSS filters
    if (filters.opacity < 1) {
      cssFilters.push(`opacity(${filters.opacity})`);
    }

    return cssFilters.length > 0 ? cssFilters.join(' ') : 'none';
  }

  /**
   * Apply pixel-level effects that require canvas manipulation
   */
  private async applyAdvancedEffects(filters: ImageFilters): Promise<void> {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    let modified = false;

    // Apply noise
    if (filters.noise > 0) {
      this.applyNoise(data, filters.noise / 100);
      modified = true;
    }

    // Apply pixelation
    if (filters.pixelate > 0) {
      this.applyPixelation(imageData, filters.pixelate);
      modified = true;
    }

    // Apply vignette
    if (filters.vignette > 0) {
      this.applyVignette(data, this.canvas.width, this.canvas.height, filters.vignette / 100);
      modified = true;
    }

    // Apply temperature and tint
    if (filters.temperature !== 0 || filters.tint !== 0) {
      this.applyTemperatureTint(data, filters.temperature / 100, filters.tint / 100);
      modified = true;
    }

    // Apply vibrance (selective saturation)
    if (filters.vibrance !== 100) {
      this.applyVibrance(data, (filters.vibrance - 100) / 100);
      modified = true;
    }

    // Apply exposure
    if (filters.exposure !== 0) {
      this.applyExposure(data, filters.exposure / 100);
      modified = true;
    }

    // Apply highlights and shadows
    if (filters.highlights !== 0 || filters.shadows !== 0) {
      this.applyHighlightsShadows(data, filters.highlights / 100, filters.shadows / 100);
      modified = true;
    }

    // Apply whites and blacks
    if (filters.whites !== 0 || filters.blacks !== 0) {
      this.applyWhitesBlacks(data, filters.whites / 100, filters.blacks / 100);
      modified = true;
    }

    // Apply sharpening
    if (filters.sharpen > 0) {
      const sharpenedData = this.applySharpen(imageData, filters.sharpen / 100);
      this.ctx.putImageData(sharpenedData, 0, 0);
      return;
    }

    // Apply clarity (local contrast enhancement)
    if (filters.clarity !== 0) {
      const clarityData = this.applyClarity(imageData, filters.clarity / 100);
      this.ctx.putImageData(clarityData, 0, 0);
      return;
    }

    if (modified) {
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  /**
   * Add procedural noise to the image
   */
  private applyNoise(data: Uint8ClampedArray, intensity: number): void {
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 255 * intensity;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
  }

  /**
   * Apply pixelation effect
   */
  private applyPixelation(imageData: ImageData, pixelSize: number): void {
    const { width, height, data } = imageData;
    
    for (let y = 0; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        // Get average color for this pixel block
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let py = y; py < Math.min(y + pixelSize, height); py++) {
          for (let px = x; px < Math.min(x + pixelSize, width); px++) {
            const index = (py * width + px) * 4;
            r += data[index];
            g += data[index + 1];
            b += data[index + 2];
            a += data[index + 3];
            count++;
          }
        }
        
        r /= count;
        g /= count;
        b /= count;
        a /= count;
        
        // Apply average color to entire block
        for (let py = y; py < Math.min(y + pixelSize, height); py++) {
          for (let px = x; px < Math.min(x + pixelSize, width); px++) {
            const index = (py * width + px) * 4;
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = a;
          }
        }
      }
    }
  }

  /**
   * Apply vignette effect
   */
  private applyVignette(data: Uint8ClampedArray, width: number, height: number, intensity: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const vignette = 1 - (distance / maxDistance) * intensity;
        
        const index = (y * width + x) * 4;
        data[index] *= vignette;     // R
        data[index + 1] *= vignette; // G
        data[index + 2] *= vignette; // B
      }
    }
  }

  /**
   * Apply temperature and tint adjustments
   */
  private applyTemperatureTint(data: Uint8ClampedArray, temperature: number, tint: number): void {
    for (let i = 0; i < data.length; i += 4) {
      // Temperature: warm (more red/yellow) vs cool (more blue)
      if (temperature > 0) {
        data[i] = Math.min(255, data[i] * (1 + temperature * 0.3));     // R
        data[i + 1] = Math.min(255, data[i + 1] * (1 + temperature * 0.15)); // G
      } else if (temperature < 0) {
        data[i + 2] = Math.min(255, data[i + 2] * (1 + Math.abs(temperature) * 0.3)); // B
      }
      
      // Tint: green vs magenta
      if (tint > 0) {
        data[i + 1] = Math.min(255, data[i + 1] * (1 + tint * 0.2)); // G
      } else if (tint < 0) {
        data[i] = Math.min(255, data[i] * (1 + Math.abs(tint) * 0.15));     // R
        data[i + 2] = Math.min(255, data[i + 2] * (1 + Math.abs(tint) * 0.15)); // B
      }
    }
  }

  /**
   * Apply vibrance (selective saturation boost)
   */
  private applyVibrance(data: Uint8ClampedArray, intensity: number): void {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Calculate current saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const currentSat = max > 0 ? (max - min) / max : 0;
      
      // Apply vibrance boost inversely proportional to current saturation
      const boost = intensity * (1 - currentSat);
      
      data[i] = Math.max(0, Math.min(255, (r + (r - luminance) * boost) * 255));
      data[i + 1] = Math.max(0, Math.min(255, (g + (g - luminance) * boost) * 255));
      data[i + 2] = Math.max(0, Math.min(255, (b + (b - luminance) * boost) * 255));
    }
  }

  /**
   * Apply exposure adjustment
   */
  private applyExposure(data: Uint8ClampedArray, stops: number): void {
    const factor = Math.pow(2, stops);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * factor));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor)); // B
    }
  }

  /**
   * Apply highlights and shadows adjustment
   */
  private applyHighlightsShadows(data: Uint8ClampedArray, highlights: number, shadows: number): void {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      let factor = 1;
      if (luminance > 0.5 && highlights !== 0) {
        // Adjust highlights
        const highlightWeight = (luminance - 0.5) * 2;
        factor += highlights * highlightWeight * 0.5;
      } else if (luminance < 0.5 && shadows !== 0) {
        // Adjust shadows
        const shadowWeight = (0.5 - luminance) * 2;
        factor += shadows * shadowWeight * 0.5;
      }
      
      data[i] = Math.max(0, Math.min(255, data[i] * factor));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor)); // B
    }
  }

  /**
   * Apply whites and blacks adjustment
   */
  private applyWhitesBlacks(data: Uint8ClampedArray, whites: number, blacks: number): void {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      let factor = 1;
      if (luminance > 0.8 && whites !== 0) {
        // Adjust whites
        const whiteWeight = (luminance - 0.8) * 5;
        factor += whites * whiteWeight * 0.3;
      } else if (luminance < 0.2 && blacks !== 0) {
        // Adjust blacks
        const blackWeight = (0.2 - luminance) * 5;
        factor += blacks * blackWeight * 0.3;
      }
      
      data[i] = Math.max(0, Math.min(255, data[i] * factor));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor)); // B
    }
  }

  /**
   * Apply sharpening using unsharp mask
   */
  private applySharpen(imageData: ImageData, intensity: number): ImageData {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    const resultData = result.data;
    
    // Copy alpha channel
    for (let i = 3; i < data.length; i += 4) {
      resultData[i] = data[i];
    }
    
    // Apply unsharp mask
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          const center = (y * width + x) * 4 + c;
          const originalValue = data[center];
          
          // Calculate Laplacian (edge detection)
          const laplacian = 
            -data[((y - 1) * width + x) * 4 + c] - 
            data[(y * width + (x - 1)) * 4 + c] + 
            4 * originalValue - 
            data[(y * width + (x + 1)) * 4 + c] - 
            data[((y + 1) * width + x) * 4 + c];
          
          // Apply sharpening
          const sharpened = originalValue + intensity * laplacian;
          resultData[center] = Math.max(0, Math.min(255, sharpened));
        }
      }
    }
    
    return result;
  }

  /**
   * Apply clarity (local contrast enhancement)
   */
  private applyClarity(imageData: ImageData, intensity: number): ImageData {
    // This is a simplified version - full clarity requires sophisticated local contrast algorithms
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    const resultData = result.data;
    
    // Copy original data
    for (let i = 0; i < data.length; i++) {
      resultData[i] = data[i];
    }
    
    // Apply local contrast enhancement
    const radius = 5;
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        for (let c = 0; c < 3; c++) {
          const center = (y * width + x) * 4 + c;
          const centerValue = data[center];
          
          // Calculate local average
          let sum = 0;
          let count = 0;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c;
              sum += data[idx];
              count++;
            }
          }
          const average = sum / count;
          
          // Enhance local contrast
          const difference = centerValue - average;
          const enhanced = centerValue + intensity * difference * 0.5;
          resultData[center] = Math.max(0, Math.min(255, enhanced));
        }
      }
    }
    
    return result;
  }

  /**
   * Apply shadow/glow effects to canvas
   */
  public applyShadowGlow(
    canvas: HTMLCanvasElement,
    shadow?: ImageElement['shadow']
  ): HTMLCanvasElement {
    if (!shadow?.enabled) return canvas;

    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d')!;
    
    resultCanvas.width = canvas.width + Math.abs(shadow.offsetX) + shadow.blur * 2;
    resultCanvas.height = canvas.height + Math.abs(shadow.offsetY) + shadow.blur * 2;
    
    // Apply shadow
    resultCtx.shadowColor = shadow.color;
    resultCtx.shadowBlur = shadow.blur;
    resultCtx.shadowOffsetX = shadow.offsetX;
    resultCtx.shadowOffsetY = shadow.offsetY;
    
    // Draw original image with shadow
    const offsetX = Math.max(0, -shadow.offsetX) + shadow.blur;
    const offsetY = Math.max(0, -shadow.offsetY) + shadow.blur;
    resultCtx.drawImage(canvas, offsetX, offsetY);
    
    return resultCanvas;
  }

  /**
   * Create a mask for the image
   */
  public createMask(
    canvas: HTMLCanvasElement,
    mask: ImageElement['mask']
  ): HTMLCanvasElement {
    if (!mask?.enabled) return canvas;

    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d')!;
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;

    // Draw mask shape
    resultCtx.fillStyle = 'white';
    switch (mask.type) {
      case 'rectangle':
        resultCtx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      case 'ellipse':
        resultCtx.beginPath();
        resultCtx.ellipse(canvas.width / 2, canvas.height / 2, 
                         canvas.width / 2, canvas.height / 2, 0, 0, 2 * Math.PI);
        resultCtx.fill();
        break;
      case 'custom':
        // Parse SVG path data
        const path = new Path2D(mask.data);
        resultCtx.fill(path);
        break;
    }

    // Apply mask to image
    resultCtx.globalCompositeOperation = 'source-in';
    resultCtx.drawImage(canvas, 0, 0);

    return resultCanvas;
  }

  /**
   * Clear image cache
   */
  public clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * Get cache size
   */
  public getCacheSize(): number {
    return this.imageCache.size;
  }
}

// Singleton instance for performance
export const imageProcessor = new ImageProcessor();

/**
 * Default filter values for new images
 */
export const DEFAULT_IMAGE_FILTERS: ImageFilters = {
  // Basic adjustments
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  
  // Advanced effects
  invert: 0,
  opacity: 1,
  pixelate: 0,
  noise: 0,
  vignette: 0,
  
  // Color adjustments
  temperature: 0,
  tint: 0,
  vibrance: 100,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  
  // Special effects
  sharpen: 0,
  clarity: 0,
  dehaze: 0,
};

/**
 * Common filter presets for quick application
 */
export const FILTER_PRESETS = {
  original: DEFAULT_IMAGE_FILTERS,
  vintage: {
    ...DEFAULT_IMAGE_FILTERS,
    brightness: 90,
    contrast: 110,
    saturation: 80,
    temperature: 20,
    sepia: 30,
    vignette: 20,
  },
  blackAndWhite: {
    ...DEFAULT_IMAGE_FILTERS,
    grayscale: 100,
    contrast: 115,
    brightness: 105,
  },
  dramatic: {
    ...DEFAULT_IMAGE_FILTERS,
    brightness: 85,
    contrast: 140,
    saturation: 120,
    shadows: 30,
    highlights: -20,
    clarity: 40,
  },
  warm: {
    ...DEFAULT_IMAGE_FILTERS,
    temperature: 25,
    vibrance: 115,
    highlights: -10,
  },
  cool: {
    ...DEFAULT_IMAGE_FILTERS,
    temperature: -20,
    tint: -5,
    shadows: -10,
  },
  vivid: {
    ...DEFAULT_IMAGE_FILTERS,
    vibrance: 150,
    saturation: 120,
    contrast: 110,
    clarity: 20,
  },
  matte: {
    ...DEFAULT_IMAGE_FILTERS,
    contrast: 85,
    highlights: -30,
    blacks: 20,
    shadows: 15,
  },
};