import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface GridItem {
  id: string;
  height: number;
  data: any;
}

export interface VirtualGridOptions {
  containerWidth: number;
  containerHeight: number;
  columnWidth: number;
  gap: number;
  overscan?: number;
  minColumnCount?: number;
  maxColumnCount?: number;
}

export interface VirtualGridResult {
  scrollTop: number;
  totalHeight: number;
  visibleItems: Array<{
    item: GridItem;
    x: number;
    y: number;
    width: number;
    height: number;
    columnIndex: number;
    rowIndex: number;
    isVisible: boolean;
  }>;
  scrollToItem: (itemId: string) => void;
  scrollToTop: () => void;
  setScrollTop: (scrollTop: number) => void;
}

export function useVirtualGrid(
  items: GridItem[],
  options: VirtualGridOptions
): VirtualGridResult {
  const {
    containerWidth,
    containerHeight,
    columnWidth,
    gap,
    overscan = 3,
    minColumnCount = 1,
    maxColumnCount = 10,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const columnHeights = useRef<number[]>([]);
  const itemPositions = useRef<Map<string, { x: number; y: number; columnIndex: number; rowIndex: number }>>(new Map());

  // Calculate the number of columns based on container width
  const columnCount = useMemo(() => {
    const availableWidth = containerWidth - gap;
    const columnsWithGaps = Math.floor((availableWidth + gap) / (columnWidth + gap));
    return Math.max(minColumnCount, Math.min(maxColumnCount, columnsWithGaps));
  }, [containerWidth, columnWidth, gap, minColumnCount, maxColumnCount]);

  // Calculate positions for all items using masonry layout
  const { positions, totalHeight } = useMemo(() => {
    const newColumnHeights = new Array(columnCount).fill(0);
    const newPositions = new Map<string, { x: number; y: number; columnIndex: number; rowIndex: number }>();
    let rowIndex = 0;

    items.forEach((item) => {
      // Find the column with the shortest height
      const shortestColumnIndex = newColumnHeights.indexOf(Math.min(...newColumnHeights));
      const x = shortestColumnIndex * (columnWidth + gap);
      const y = newColumnHeights[shortestColumnIndex];

      newPositions.set(item.id, {
        x,
        y,
        columnIndex: shortestColumnIndex,
        rowIndex,
      });

      newColumnHeights[shortestColumnIndex] += item.height + gap;
      rowIndex++;
    });

    columnHeights.current = newColumnHeights;
    itemPositions.current = newPositions;

    return {
      positions: newPositions,
      totalHeight: Math.max(...newColumnHeights) - gap,
    };
  }, [items, columnCount, columnWidth, gap]);

  // Calculate visible items based on scroll position
  const visibleItems = useMemo(() => {
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;
    const overscanTop = Math.max(0, viewportTop - overscan * 200);
    const overscanBottom = viewportBottom + overscan * 200;

    return items.map((item) => {
      const position = positions.get(item.id);
      if (!position) {
        return null;
      }

      const itemTop = position.y;
      const itemBottom = position.y + item.height;
      const isInViewport = itemBottom >= viewportTop && itemTop <= viewportBottom;
      const isInOverscan = itemBottom >= overscanTop && itemTop <= overscanBottom;

      return {
        item,
        x: position.x,
        y: position.y,
        width: columnWidth,
        height: item.height,
        columnIndex: position.columnIndex,
        rowIndex: position.rowIndex,
        isVisible: isInOverscan,
        isInViewport,
      };
    }).filter(Boolean) as VirtualGridResult['visibleItems'];
  }, [items, positions, scrollTop, containerHeight, columnWidth, overscan]);

  // Scroll to specific item
  const scrollToItem = useCallback((itemId: string) => {
    const position = positions.get(itemId);
    if (position) {
      const targetScrollTop = Math.max(0, position.y - containerHeight / 2);
      setScrollTop(targetScrollTop);
    }
  }, [positions, containerHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  return {
    scrollTop,
    totalHeight,
    visibleItems,
    scrollToItem,
    scrollToTop,
    setScrollTop,
  };
}

// Hook for managing scroll container
export function useScrollContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Handle scroll events
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Handle resize events
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial size calculation
    handleResize();

    // Set up resize observer for more accurate size tracking
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll, handleResize]);

  // Function to manually set scroll position
  const setScrollPosition = useCallback((newScrollTop: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = newScrollTop;
    }
  }, []);

  return {
    containerRef,
    scrollTop,
    containerSize,
    setScrollPosition,
  };
}

// Hook for calculating dynamic item heights based on aspect ratios
export function useGridItemHeights(
  items: Array<{ id: string; aspectRatio: number }>,
  columnWidth: number
): GridItem[] {
  return useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      height: Math.round(columnWidth / item.aspectRatio),
      data: item,
    }));
  }, [items, columnWidth]);
}