// Utility functions for Konva image cropping based on official examples

export type CropPosition = 
  | 'left-top' | 'center-top' | 'right-top'
  | 'left-middle' | 'center-middle' | 'right-middle' 
  | 'left-bottom' | 'center-bottom' | 'right-bottom';

export interface CropData {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

/**
 * Calculate crop values from source image, its visible size and a crop strategy
 * Based on official Konva crop example
 */
export function getCrop(
  image: { width: number; height: number }, 
  size: { width: number; height: number }, 
  clipPosition: CropPosition = 'center-middle'
): CropData {
  const width = size.width;
  const height = size.height;
  const aspectRatio = width / height;

  let newWidth: number;
  let newHeight: number;

  const imageRatio = image.width / image.height;

  if (aspectRatio >= imageRatio) {
    newWidth = image.width;
    newHeight = image.width / aspectRatio;
  } else {
    newWidth = image.height * aspectRatio;
    newHeight = image.height;
  }

  let x = 0;
  let y = 0;
  
  if (clipPosition === 'left-top') {
    x = 0;
    y = 0;
  } else if (clipPosition === 'left-middle') {
    x = 0;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'left-bottom') {
    x = 0;
    y = image.height - newHeight;
  } else if (clipPosition === 'center-top') {
    x = (image.width - newWidth) / 2;
    y = 0;
  } else if (clipPosition === 'center-middle') {
    x = (image.width - newWidth) / 2;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'center-bottom') {
    x = (image.width - newWidth) / 2;
    y = image.height - newHeight;
  } else if (clipPosition === 'right-top') {
    x = image.width - newWidth;
    y = 0;
  } else if (clipPosition === 'right-middle') {
    x = image.width - newWidth;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'right-bottom') {
    x = image.width - newWidth;
    y = image.height - newHeight;
  }

  return {
    cropX: x,
    cropY: y,
    cropWidth: newWidth,
    cropHeight: newHeight,
  };
}

/**
 * Apply crop to a Konva Image node
 * Based on official Konva crop example
 */
export function applyCrop(konvaImage: any, position: CropPosition) {
  // Store the crop position for reuse during transforms
  konvaImage.setAttr('lastCropUsed', position);
  
  // Get the original image data
  const imageElement = konvaImage.image();
  if (!imageElement) return;

  // Calculate crop based on current display size
  const crop = getCrop(
    { width: imageElement.width, height: imageElement.height },
    { width: konvaImage.width(), height: konvaImage.height() },
    position
  );
  
  // Apply crop attributes to the Konva image
  konvaImage.setAttrs(crop);
  
  console.log('Applied crop:', { position, crop });
}

/**
 * Reset crop to show full image
 */
export function resetCrop(konvaImage: any) {
  const imageElement = konvaImage.image();
  if (!imageElement) return;

  konvaImage.setAttrs({
    cropX: 0,
    cropY: 0,
    cropWidth: imageElement.width,
    cropHeight: imageElement.height,
    lastCropUsed: 'center-middle'
  });
  
  console.log('Reset crop to full image');
}

/**
 * Handle transform events to maintain crop during resize
 * Should be called in transform event handlers
 */
export function handleCropOnTransform(konvaImage: any) {
  // Reset scale on transform (Konva best practice)
  konvaImage.setAttrs({
    scaleX: 1,
    scaleY: 1,
    width: konvaImage.width() * konvaImage.scaleX(),
    height: konvaImage.height() * konvaImage.scaleY(),
  });
  
  // Reapply the last used crop
  const lastCropUsed = konvaImage.getAttr('lastCropUsed') || 'center-middle';
  applyCrop(konvaImage, lastCropUsed);
}