import { useEffect, useRef, useCallback } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { generateThumbnailFromStage, createDebouncedThumbnailGenerator, getDefaultThumbnail } from '@/utils/thumbnailGenerator';
import type Konva from 'konva';

/**
 * Hook for real-time page thumbnail generation
 * Automatically updates page thumbnails when canvas content changes
 */
export const usePageThumbnails = () => {
  const { updatePage, currentPageId, getCurrentPage } = usePageStore();
  const { elements } = useCanvasStore();
  const stageRef = useRef<Konva.Stage | null>(null);

  // Create debounced thumbnail generator to avoid excessive updates
  const debouncedGenerator = useRef(
    createDebouncedThumbnailGenerator((thumbnail: string | null) => {
      if (currentPageId && thumbnail) {
        // Update the current page with the new thumbnail
        updatePage(currentPageId, { thumbnail });
      }
    }, 1000) // 1 second debounce
  );

  // Set the stage reference for thumbnail generation
  const setStageRef = useCallback((stage: Konva.Stage | null) => {
    stageRef.current = stage;
  }, []);

  // Generate thumbnail for current page
  const generateCurrentPageThumbnail = useCallback(() => {
    if (!stageRef.current || !currentPageId) return;

    const currentPage = getCurrentPage();
    if (!currentPage) return;

    // If page has no elements, generate default thumbnail
    if (elements.length === 0) {
      const pageOrder = currentPage.order || 0;
      const defaultThumbnail = getDefaultThumbnail(pageOrder + 1, { width: 80, height: 60 });
      updatePage(currentPageId, { thumbnail: defaultThumbnail });
      return;
    }

    // Generate thumbnail from current stage
    debouncedGenerator.current(stageRef.current, { width: 80, height: 60 });
  }, [currentPageId, elements, getCurrentPage, updatePage]);

  // Generate thumbnail when elements change
  useEffect(() => {
    generateCurrentPageThumbnail();
  }, [generateCurrentPageThumbnail]);

  // Generate thumbnail when current page changes
  useEffect(() => {
    // Add a small delay to ensure stage is properly rendered
    const timeout = setTimeout(() => {
      generateCurrentPageThumbnail();
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentPageId, generateCurrentPageThumbnail]);

  // Manual thumbnail generation (useful for immediate updates)
  const generateThumbnailNow = useCallback(() => {
    if (!stageRef.current || !currentPageId) return;

    const thumbnail = generateThumbnailFromStage(stageRef.current, { width: 80, height: 60 });
    if (thumbnail) {
      updatePage(currentPageId, { thumbnail });
    }
  }, [currentPageId, updatePage]);

  // Generate thumbnail for a specific page by temporarily switching to it
  const generateThumbnailForPage = useCallback((pageId: string) => {
    // This would require temporarily switching to the page, rendering it, and generating thumbnail
    // For now, we'll just generate a default thumbnail
    const page = usePageStore.getState().pages.find(p => p.id === pageId);
    if (page) {
      const pageOrder = page.order || 0;
      const defaultThumbnail = getDefaultThumbnail(pageOrder + 1, { width: 80, height: 60 });
      updatePage(pageId, { thumbnail: defaultThumbnail });
    }
  }, [updatePage]);

  return {
    setStageRef,
    generateCurrentPageThumbnail,
    generateThumbnailNow,
    generateThumbnailForPage
  };
};