import { useEffect, useCallback } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useCanvasStore } from '@/stores/canvasStore';

/**
 * Hook to sync canvas elements with the current page
 * This creates a bridge between the page system and canvas system
 */
export const usePageCanvas = () => {
  const {
    currentPageId,
    getCurrentPage,
    updatePage,
    pages
  } = usePageStore();

  const {
    elements,
    setElements,
    setCanvasSize,
    setBackgroundColor,
  } = useCanvasStore();

  // Load current page elements into canvas when page changes
  useEffect(() => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    console.log('🔄 Loading page elements:', currentPage.name, 'Elements:', currentPage.elements.length);

    // Update canvas size and background to match page
    setCanvasSize({ width: currentPage.width, height: currentPage.height });
    setBackgroundColor(currentPage.backgroundColor);

    // Load page elements into canvas
    // currentPage.elements should contain CanvasElement objects
    const pageElements = currentPage.elements || [];
    setElements(pageElements);

  }, [currentPageId, getCurrentPage, setCanvasSize, setBackgroundColor, setElements]);

  // Save canvas elements back to current page when elements change
  useEffect(() => {
    if (!currentPageId) return;

    // Debounce this to avoid excessive saves
    const timeoutId = setTimeout(() => {
      console.log('💾 Saving canvas elements to page:', currentPageId, 'Count:', elements.length);

      // Save the full element objects to the page
      updatePage(currentPageId, {
        elements: elements
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [elements, currentPageId, updatePage]);

  // Helper function to switch pages
  const switchToPage = useCallback((pageId: string) => {
    console.log('🔄 Switching to page:', pageId);
    // The page switching will be handled by the pageStore
    // and this hook will react to the currentPageId change
  }, []);

  return {
    currentPageId,
    getCurrentPage,
    switchToPage
  };
};