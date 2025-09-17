import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { DEFAULT_IMAGE_FILTERS, FILTER_PRESETS } from '@/utils/imageProcessor';
import type { ImageElement, CanvasElement } from '@/types/canvas';

/**
 * Advanced keyboard shortcuts for professional image editing
 * Inspired by Photoshop and other professional tools
 */
export const useImageKeyboardShortcuts = () => {
  const { 
    elements, 
    selection, 
    updateElement, 
    duplicateElements,
    deleteElements,
    selectAll,
    clearSelection,
  } = useCanvasStore();

  const getSelectedImages = useCallback((): ImageElement[] => {
    return elements.filter((el): el is ImageElement => 
      selection.includes(el.id) && el.type === 'image'
    );
  }, [elements, selection]);

  const applyToSelectedImages = useCallback((updater: (element: ImageElement) => Partial<ImageElement>) => {
    const selectedImages = getSelectedImages();
    selectedImages.forEach(image => {
      updateElement(image.id, updater(image));
    });
  }, [getSelectedImages, updateElement]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, code, ctrlKey, metaKey, shiftKey, altKey } = event;
    const isCmd = ctrlKey || metaKey;
    const selectedImages = getSelectedImages();
    
    if (selectedImages.length === 0) return;

    // Prevent default browser behavior for our shortcuts
    const shouldPreventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    switch (true) {
      // === BASIC OPERATIONS ===
      
      // Delete selected images
      case key === 'Delete' || key === 'Backspace':
        shouldPreventDefault();
        deleteElements(selection);
        break;

      // Duplicate images
      case key === 'd' && isCmd:
      case key === 'j' && isCmd: // Photoshop-style
        shouldPreventDefault();
        duplicateElements(selection);
        break;

      // Select all
      case key === 'a' && isCmd:
        shouldPreventDefault();
        selectAll();
        break;

      // Deselect all
      case key === 'd' && isCmd && shiftKey:
        shouldPreventDefault();
        clearSelection();
        break;

      // === TRANSFORM OPERATIONS ===
      
      // Flip horizontal
      case key === 'h' && isCmd && shiftKey:
        shouldPreventDefault();
        applyToSelectedImages(image => ({ scaleX: image.scaleX * -1 }));
        break;

      // Flip vertical
      case key === 'v' && isCmd && shiftKey:
        shouldPreventDefault();
        applyToSelectedImages(image => ({ scaleY: image.scaleY * -1 }));
        break;

      // Rotate 90° clockwise
      case key === 'r' && isCmd:
        shouldPreventDefault();
        applyToSelectedImages(image => ({ rotation: image.rotation + 90 }));
        break;

      // Rotate 90° counter-clockwise
      case key === 'r' && isCmd && shiftKey:
        shouldPreventDefault();
        applyToSelectedImages(image => ({ rotation: image.rotation - 90 }));
        break;

      // Free transform mode (placeholder for future implementation)
      case key === 't' && isCmd:
        shouldPreventDefault();
        console.log('Free transform mode activated');
        break;

      default:
        // No matching shortcut
        return;
    }
  }, [getSelectedImages, applyToSelectedImages, deleteElements, duplicateElements, selectAll, clearSelection, selection, elements, updateElement]);

  useEffect(() => {
    // Only listen to keyboard events when there are selected images
    const hasSelectedImages = getSelectedImages().length > 0;
    
    if (hasSelectedImages) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, getSelectedImages]);

  // Return available shortcuts for UI display
  return {
    shortcuts: {
      basic: {
        delete: ['Delete', 'Backspace'],
        duplicate: ['Cmd+D', 'Cmd+J'],
        selectAll: ['Cmd+A'],
        deselect: ['Cmd+Shift+D'],
      },
      transform: {
        flipHorizontal: ['Cmd+Shift+H'],
        flipVertical: ['Cmd+Shift+V'],
        rotate90CW: ['Cmd+R'],
        rotate90CCW: ['Cmd+Shift+R'],
        freeTransform: ['Cmd+T'],
      },
    },
  };
};