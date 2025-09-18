import Konva from 'konva';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  scale?: number;
}

/**
 * Generates a thumbnail image from a Konva stage
 */
export const generateThumbnailFromStage = (
  stage: Konva.Stage,
  options: ThumbnailOptions = {}
): string | null => {
  try {
    const {
      width = 80,
      height = 60,
      quality = 0.8,
      scale = 0.15
    } = options;

    // Create a temporary canvas for thumbnail generation
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Get stage content as image
    const stageCanvas = stage.toCanvas({
      pixelRatio: scale,
      width: width,
      height: height,
      mimeType: 'image/jpeg',
      quality: quality
    });

    // Draw the stage content to our thumbnail canvas
    ctx.drawImage(stageCanvas, 0, 0, width, height);

    // Return as base64 data URL
    return canvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
};

/**
 * Generates a thumbnail from canvas elements data
 */
export const generateThumbnailFromElements = (
  elements: any[],
  canvasSize: { width: number; height: number },
  options: ThumbnailOptions = {}
): string | null => {
  try {
    const {
      width = 80,
      height = 60,
      quality = 0.8
    } = options;

    // Create a temporary stage for thumbnail generation
    const stage = new Konva.Stage({
      container: document.createElement('div'),
      width: canvasSize.width,
      height: canvasSize.height
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Add elements to the temporary stage
    elements.forEach((element) => {
      try {
        let shape: Konva.Shape | null = null;

        switch (element.type) {
          case 'text':
            shape = new Konva.Text({
              x: element.x,
              y: element.y,
              text: element.text,
              fontSize: element.fontSize,
              fill: element.fill,
              fontFamily: element.fontFamily
            });
            break;
          case 'rect':
            shape = new Konva.Rect({
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              fill: element.fill,
              stroke: element.stroke
            });
            break;
          case 'circle':
            shape = new Konva.Circle({
              x: element.x,
              y: element.y,
              radius: element.radius,
              fill: element.fill,
              stroke: element.stroke
            });
            break;
          case 'image':
            // For thumbnails, we'll represent images as rectangles with a placeholder
            shape = new Konva.Rect({
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              fill: '#e0e0e0',
              stroke: '#ccc',
              strokeWidth: 1
            });
            break;
        }

        if (shape) {
          layer.add(shape);
        }
      } catch (elementError) {
        console.warn('Failed to add element to thumbnail:', elementError);
      }
    });

    layer.draw();

    // Generate thumbnail from the temporary stage
    const thumbnail = generateThumbnailFromStage(stage, { width, height, quality });

    // Clean up
    stage.destroy();

    return thumbnail;
  } catch (error) {
    console.error('Failed to generate thumbnail from elements:', error);
    return null;
  }
};

/**
 * Creates a debounced thumbnail generator to avoid excessive regeneration
 */
export const createDebouncedThumbnailGenerator = (
  callback: (thumbnail: string | null) => void,
  delay: number = 500
) => {
  let timeoutId: NodeJS.Timeout;

  return (stage: Konva.Stage, options?: ThumbnailOptions) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const thumbnail = generateThumbnailFromStage(stage, options);
      callback(thumbnail);
    }, delay);
  };
};

/**
 * Default thumbnail placeholder for empty pages
 */
export const getDefaultThumbnail = (
  pageNumber: number,
  options: ThumbnailOptions = {}
): string => {
  const {
    width = 80,
    height = 60
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Draw a simple placeholder
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#ccc';
  ctx.strokeRect(0, 0, width, height);

  // Draw page number
  ctx.fillStyle = '#666';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pageNumber.toString(), width / 2, height / 2);

  return canvas.toDataURL('image/jpeg', 0.8);
};