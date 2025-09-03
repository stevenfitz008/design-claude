import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  initialItems: T[];
  itemsPerPage: number;
  generateItems: (page: number, existingItems: T[]) => Promise<T[]>;
  hasMore: boolean;
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadingRef: (node: HTMLElement | null) => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  initialItems,
  itemsPerPage,
  generateItems,
  hasMore: initialHasMore
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver>();

  const loadingRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newItems = await generateItems(page + 1, items);
      if (newItems.length > 0) {
        setItems(prevItems => [...prevItems, ...newItems]);
        setPage(prevPage => prevPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, items, generateItems]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(initialHasMore);
    setLoading(false);
  }, [initialItems, initialHasMore]);

  // Load initial items if starting empty
  useEffect(() => {
    if (items.length === 0 && hasMore && !loading) {
      loadMore();
    }
  }, []);

  return {
    items,
    loading,
    hasMore,
    loadingRef,
    reset
  };
}
