import { useState, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ImageElement, CropData } from '@/types/canvas';

export interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  aspectRatio?: number; // null for free crop, number for locked ratio
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const useImageCrop = () => {
  const { updateElement, elements, selection } = useCanvasStore();
  const [cropMode, setCropMode] = useState(false);
  const [activeCropElementId, setActiveCropElementId] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropPosition | null>(null);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);

  // Auto-activate crop mode when a single image is selected
  const selectedImageElements = elements.filter(el => 
    el.type === 'image' && selection.includes(el.id)
  ) as ImageElement[];
  
  const hasImageSelection = selectedImageElements.length === 1;
  const selectedImageElement = hasImageSelection ? selectedImageElements[0] : null;

  // Calculate crop based on position in image coordinates
  const calculateCrop = useCallback((
    imageElement: ImageElement,
    cropPosition: CropPosition
  ): CropData => {
    const originalWidth = imageElement.originalWidth || imageElement.width;
    const originalHeight = imageElement.originalHeight || imageElement.height;
    
    // Convert display coordinates to image coordinates
    const scaleX = originalWidth / imageElement.width;
    const scaleY = originalHeight / imageElement.height;
    
    return {
      x: Math.max(0, cropPosition.x * scaleX),
      y: Math.max(0, cropPosition.y * scaleY),
      width: Math.min(cropPosition.width * scaleX, originalWidth),
      height: Math.min(cropPosition.height * scaleY, originalHeight)
    };
  }, []);

  // Apply crop to image element
  const applyCrop = useCallback((
    elementId: string,
    cropPosition: CropPosition
  ) => {
    const element = elements.find(el => el.id === elementId) as ImageElement;
    if (!element || element.type !== 'image') return;

    const cropData = calculateCrop(element, cropPosition);
    
    console.log('🎯 Applying crop to image:', {
      elementId,
      cropPosition,
      calculatedCrop: cropData,
      originalDimensions: {
        width: element.originalWidth,
        height: element.originalHeight
      }
    });

    updateElement(elementId, {
      cropData,
      // Update display dimensions to match crop area
      width: cropPosition.width,
      height: cropPosition.height
    });
  }, [elements, updateElement, calculateCrop]);

  // Start crop mode for an image
  const startCrop = useCallback((elementId: string) => {
    console.log('🌾 startCrop called with elementId:', elementId);
    
    const element = elements.find(el => el.id === elementId) as ImageElement;
    console.log('🔍 Found element:', element ? { id: element.id, type: element.type } : null);
    
    if (!element || element.type !== 'image') {
      console.log('❌ Invalid element - not an image or not found');
      return;
    }

    console.log('✅ Setting crop mode to true for element:', elementId);
    setCropMode(true);
    setActiveCropElementId(elementId);
    
    // Initialize crop area to current image bounds or full image
    const existingCrop = element.cropData;
    if (existingCrop) {
      // Convert existing crop back to display coordinates
      const scaleX = element.width / (element.originalWidth || element.width);
      const scaleY = element.height / (element.originalHeight || element.height);
      
      setCropArea({
        x: existingCrop.x * scaleX,
        y: existingCrop.y * scaleY,
        width: existingCrop.width * scaleX,
        height: existingCrop.height * scaleY
      });
    } else {
      // Start with full image area
      const initialCropArea = {
        x: 0,
        y: 0,
        width: element.width,
        height: element.height
      };
      console.log('📏 Setting initial crop area:', initialCropArea);
      setCropArea(initialCropArea);
    }

    console.log('🌾 Started crop mode for image:', elementId);
  }, [elements]);

  // Update crop area during drag
  const updateCropArea = useCallback((newArea: CropPosition) => {
    setCropArea(newArea);
  }, []);

  // Finish crop and apply changes
  const finishCrop = useCallback(() => {
    if (activeCropElementId && cropArea) {
      applyCrop(activeCropElementId, cropArea);
    }
    
    setCropMode(false);
    setActiveCropElementId(null);
    setCropArea(null);
    
    console.log('✅ Finished crop operation');
  }, [activeCropElementId, cropArea, applyCrop]);

  // Cancel crop without applying changes
  const cancelCrop = useCallback(() => {
    setCropMode(false);
    setActiveCropElementId(null);
    setCropArea(null);
    
    console.log('❌ Cancelled crop operation');
  }, []);

  // Reset crop to show full image
  const resetCrop = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId) as ImageElement;
    if (!element || element.type !== 'image') return;

    updateElement(elementId, {
      cropData: {
        x: 0,
        y: 0,
        width: element.originalWidth || element.width,
        height: element.originalHeight || element.height
      }
    });

    console.log('🔄 Reset crop for image:', elementId);
  }, [elements, updateElement]);

  // Predefined crop ratios
  const applyCropRatio = useCallback((
    elementId: string,
    ratio: number | 'square' | 'portrait' | 'landscape' | 'original'
  ) => {
    const element = elements.find(el => el.id === elementId) as ImageElement;
    if (!element || element.type !== 'image') return;

    const originalWidth = element.originalWidth || element.width;
    const originalHeight = element.originalHeight || element.height;
    
    let targetRatio: number;
    
    switch (ratio) {
      case 'square':
        targetRatio = 1;
        break;
      case 'portrait':
        targetRatio = 3 / 4; // 4:3 portrait
        break;
      case 'landscape':
        targetRatio = 4 / 3; // 4:3 landscape
        break;
      case 'original':
        targetRatio = originalWidth / originalHeight;
        break;
      default:
        targetRatio = typeof ratio === 'number' ? ratio : originalWidth / originalHeight;
    }

    // Calculate crop area to maintain aspect ratio
    let cropWidth = originalWidth;
    let cropHeight = originalHeight;
    let cropX = 0;
    let cropY = 0;

    const currentRatio = originalWidth / originalHeight;

    if (targetRatio > currentRatio) {
      // Target is wider - crop height
      cropHeight = originalWidth / targetRatio;
      cropY = (originalHeight - cropHeight) / 2;
    } else {
      // Target is taller - crop width
      cropWidth = originalHeight * targetRatio;
      cropX = (originalWidth - cropWidth) / 2;
    }

    const cropData: CropData = {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(cropWidth, originalWidth),
      height: Math.min(cropHeight, originalHeight)
    };

    updateElement(elementId, { cropData });

    console.log('📐 Applied crop ratio:', {
      elementId,
      ratio: typeof ratio === 'string' ? ratio : `${ratio}:1`,
      cropData
    });
  }, [elements, updateElement]);

  return {
    // State
    cropMode,
    activeCropElementId,
    cropArea,
    hasImageSelection,
    selectedImageElement,
    
    // Actions
    startCrop,
    updateCropArea,
    finishCrop,
    cancelCrop,
    resetCrop,
    applyCropRatio,
    applyCrop,
    calculateCrop
  };
};