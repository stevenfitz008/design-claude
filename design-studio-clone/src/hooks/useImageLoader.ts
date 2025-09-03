import { useState, useEffect, useCallback, useRef } from 'react';
import type { UnsplashPhoto } from '@/services/unsplashService';

export type ImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface ImageLoadState {
  status: ImageLoadStatus;
  error?: string;
  placeholderLoaded: boolean;
  fullImageLoaded: boolean;
  currentSrc?: string;
}

export interface UseImageLoaderOptions {
  enablePlaceholder?: boolean;
  placeholderQuality?: number;
  loadingStrategy?: 'eager' | 'lazy' | 'viewport';
  retryAttempts?: number;
  retryDelay?: number;
  onLoad?: (src: string) => void;
  onError?: (error: string) => void;
}

// Simple in-memory cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();
const MAX_CACHE_SIZE = 100;

export function useImageLoader(
  photo: UnsplashPhoto | null,
  targetWidth?: number,
  targetHeight?: number,
  options: UseImageLoaderOptions = {}
) {
  const {
    enablePlaceholder = true,
    placeholderQuality = 10,
    loadingStrategy = 'lazy',
    retryAttempts = 3,
    retryDelay = 1000,
    onLoad,
    onError,
  } = options;

  const [state, setState] = useState<ImageLoadState>({
    status: 'idle',
    placeholderLoaded: false,
    fullImageLoaded: false,
  });

  const retryCountRef = useRef(0);
  const loadingAbortController = useRef<AbortController>();
  const observerRef = useRef<IntersectionObserver>();
  const elementRef = useRef<HTMLImageElement>();

  const getOptimalUrl = useCallback((isPlaceholder = false) => {
    if (!photo) return '';
    
    if (isPlaceholder) {
      return `${photo.urls.thumb}&w=50&h=50&blur=5&q=${placeholderQuality}`;
    }
    
    if (targetWidth || targetHeight) {
      const params = new URLSearchParams();
      if (targetWidth) params.append('w', Math.ceil(targetWidth * window.devicePixelRatio).toString());
      if (targetHeight) params.append('h', Math.ceil(targetHeight * window.devicePixelRatio).toString());
      params.append('fit', 'crop');
      params.append('auto', 'format');
      params.append('q', '85');
      
      return `${photo.urls.raw}&${params.toString()}`;
    }
    
    return photo.urls.regular;
  }, [photo, targetWidth, targetHeight, placeholderQuality]);

  const loadImage = useCallback(async (src: string, isPlaceholder = false) => {
    // Check cache first
    if (imageCache.has(src)) {
      const cachedImage = imageCache.get(src);
      if (cachedImage?.complete && cachedImage.naturalWidth > 0) {
        setState(prev => ({
          ...prev,
          status: 'loaded',
          currentSrc: src,
          ...(isPlaceholder 
            ? { placeholderLoaded: true }
            : { fullImageLoaded: true }
          ),
        }));
        onLoad?.(src);
        return;
      }
    }

    // Cancel any existing loading
    loadingAbortController.current?.abort();
    loadingAbortController.current = new AbortController();

    setState(prev => ({
      ...prev,
      status: 'loading',
      error: undefined,
    }));

    try {
      const img = new Image();
      const signal = loadingAbortController.current.signal;

      // Set up promise for image loading
      const imagePromise = new Promise<void>((resolve, reject) => {
        img.onload = () => {
          if (signal.aborted) return;
          
          // Add to cache
          if (imageCache.size >= MAX_CACHE_SIZE) {
            const firstKey = imageCache.keys().next().value;
            imageCache.delete(firstKey);
          }
          imageCache.set(src, img);
          
          setState(prev => ({
            ...prev,
            status: 'loaded',
            currentSrc: src,
            ...(isPlaceholder 
              ? { placeholderLoaded: true }
              : { fullImageLoaded: true }
            ),
          }));
          
          onLoad?.(src);
          resolve();
        };

        img.onerror = () => {
          if (signal.aborted) return;
          reject(new Error(`Failed to load image: ${src}`));
        };

        signal.addEventListener('abort', () => {
          img.onload = null;
          img.onerror = null;
          reject(new Error('Image loading aborted'));
        });
      });

      // Start loading
      img.crossOrigin = 'anonymous';
      img.src = src;

      await imagePromise;
      retryCountRef.current = 0;

    } catch (error) {
      if (loadingAbortController.current?.signal.aborted) {
        return; // Ignore aborted requests
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          loadImage(src, isPlaceholder);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));

      onError?.(errorMessage);
    }
  }, [retryAttempts, retryDelay, onLoad, onError]);

  const startLoading = useCallback(() => {
    if (!photo) return;

    const loadSequence = async () => {
      try {
        // Load placeholder first if enabled
        if (enablePlaceholder) {
          const placeholderUrl = getOptimalUrl(true);
          await loadImage(placeholderUrl, true);
        }

        // Then load full image
        const fullUrl = getOptimalUrl(false);
        await loadImage(fullUrl, false);
      } catch (error) {
        // Error handling is done in loadImage
      }
    };

    loadSequence();
  }, [photo, enablePlaceholder, getOptimalUrl, loadImage]);

  const setImageRef = useCallback((element: HTMLImageElement | null) => {
    elementRef.current = element || undefined;

    if (loadingStrategy === 'viewport' && element) {
      // Clean up previous observer
      observerRef.current?.disconnect();

      // Set up intersection observer for lazy loading
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && state.status === 'idle') {
              startLoading();
              observerRef.current?.disconnect();
            }
          });
        },
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1,
        }
      );

      observerRef.current.observe(element);
    }
  }, [loadingStrategy, state.status, startLoading]);

  // Effect for eager and lazy loading strategies
  useEffect(() => {
    if (!photo) {
      setState({
        status: 'idle',
        placeholderLoaded: false,
        fullImageLoaded: false,
      });
      return;
    }

    if (loadingStrategy === 'eager') {
      startLoading();
    } else if (loadingStrategy === 'lazy' && state.status === 'idle') {
      // For lazy loading, start immediately but with lower priority
      const timeoutId = setTimeout(startLoading, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [photo, loadingStrategy, startLoading, state.status]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      loadingAbortController.current?.abort();
      observerRef.current?.disconnect();
    };
  }, []);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    startLoading();
  }, [startLoading]);

  const getCurrentSrc = useCallback(() => {
    if (state.fullImageLoaded && state.currentSrc) {
      return state.currentSrc;
    }
    if (state.placeholderLoaded && enablePlaceholder) {
      return getOptimalUrl(true);
    }
    return '';
  }, [state, enablePlaceholder, getOptimalUrl]);

  return {
    ...state,
    src: getCurrentSrc(),
    placeholderSrc: enablePlaceholder ? getOptimalUrl(true) : '',
    fullSrc: getOptimalUrl(false),
    retry,
    setImageRef,
  };
}