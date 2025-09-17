import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { applyCrop, resetCrop, type CropPosition } from '@/utils/cropUtils';
import type { ImageElement } from '@/types/canvas';

export const useSimpleCrop = () => {
  const { updateElement, elements, selection } = useCanvasStore();
  const [cropMode, setCropMode] = useState(false);
  const [activeCropElementId, setActiveCropElementId] = useState<string | null>(null);

  // Get the currently selected image element (if any)
  const selectedImageElements = elements.filter(el => 
    el.type === 'image' && selection.includes(el.id)
  ) as ImageElement[];
  
  const hasImageSelection = selectedImageElements.length === 1;
  const selectedImageElement = hasImageSelection ? selectedImageElements[0] : null;

  // Apply crop with specific position - using store-based system
  const applyCropPosition = useCallback((elementId: string, position: CropPosition) => {
    const element = elements.find(el => el.id === elementId) as ImageElement;
    if (!element || element.type !== 'image') {
      console.warn('❌ Element not found or not an image:', elementId);
      return;
    }
    
    console.log('🌾 Applying crop position:', { elementId, position });
    
    // Get original image dimensions from element
    const originalWidth = element.originalWidth || element.width;
    const originalHeight = element.originalHeight || element.height;
    
    if (!originalWidth || !originalHeight) {
      console.warn('❌ Original dimensions not available for crop');
      return;
    }
    
    // Calculate crop using store dimensions
    const currentSize = { width: element.width, height: element.height };
    const crop = getCrop(
      { width: originalWidth, height: originalHeight } as HTMLImageElement, 
      currentSize, 
      position
    );
    
    // Debug: Log detailed crop information
    console.log('🔍 Crop Debug Info:', {
      position,
      originalImageSize: { width: originalWidth, height: originalHeight },
      currentDisplaySize: currentSize,
      originalRatio: (originalWidth / originalHeight).toFixed(3),
      displayRatio: (currentSize.width / currentSize.height).toFixed(3),
      calculatedCrop: {
        cropX: Math.round(crop.cropX),
        cropY: Math.round(crop.cropY), 
        cropWidth: Math.round(crop.cropWidth),
        cropHeight: Math.round(crop.cropHeight)
      }
    });
    
    // Update element with crop data - this will trigger re-render with new crop
    updateElement(elementId, {
      cropData: {
        x: crop.cropX,
        y: crop.cropY,
        width: crop.cropWidth,
        height: crop.cropHeight
      },
      cropPosition: position
    });
    
    console.log(`✅ Applied ${position} crop: ${Math.round(crop.cropWidth)}×${Math.round(crop.cropHeight)} at (${Math.round(crop.cropX)},${Math.round(crop.cropY)})`);
  }, [elements, updateElement]);

  // Crop calculation function (exact copy from working test)
  const getCrop = (image: HTMLImageElement, size: { width: number; height: number }, clipPosition: CropPosition) => {
    const width = size.width;
    const height = size.height;
    const aspectRatio = width / height;

    let newWidth;
    let newHeight;

    const imageRatio = image.width / image.height;

    if (aspectRatio >= imageRatio) {
      newWidth = image.width;
      newHeight = image.width / aspectRatio;
    } else {
      newWidth = image.height * aspectRatio;
      newHeight = image.height;
    }

    console.log('🔍 getCrop calculation:', {
      clipPosition,
      imageSize: { w: image.width, h: image.height },
      displaySize: { w: width, h: height },
      imageRatio: imageRatio.toFixed(3),
      aspectRatio: aspectRatio.toFixed(3),
      cropAreaSize: { w: Math.round(newWidth), h: Math.round(newHeight) }
    });

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
  };

  // Reset crop to show full image using store-based system
  const resetCropForElement = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId) as ImageElement;
    if (!element || element.type !== 'image') return;

    console.log('🔄 Resetting crop for element:', elementId);
    
    // Update the store to remove crop data - this will trigger re-render showing full image
    updateElement(elementId, { 
      cropData: undefined,
      cropPosition: undefined 
    });
    
    console.log('✅ Reset crop - showing full image for element:', elementId);
  }, [elements, updateElement]);

  return {
    // State
    cropMode,
    activeCropElementId,
    hasImageSelection,
    selectedImageElement,
    
    // Actions
    applyCropPosition,
    resetCropForElement
  };
};