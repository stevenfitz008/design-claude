import { useState, useEffect, useCallback } from 'react';

interface CachedImage {
  image: HTMLImageElement;
  timestamp: number;
  loading: boolean;
  error?: boolean;
}

interface ImageCacheStore {
  [url: string]: CachedImage;
}

// Global image cache with LRU-like behavior
const imageCache: ImageCacheStore = {};
const CACHE_SIZE_LIMIT = 50;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Cleanup old cache entries
const cleanupCache = () => {
  const now = Date.now();
  const entries = Object.entries(imageCache);
  
  // Remove expired entries
  entries.forEach(([url, cached]) => {
    if (now - cached.timestamp > CACHE_EXPIRY) {
      delete imageCache[url];
    }
  });
  
  // If still over limit, remove oldest entries
  if (entries.length > CACHE_SIZE_LIMIT) {
    const sortedByAge = entries
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, entries.length - CACHE_SIZE_LIMIT);
    
    sortedByAge.forEach(([url]) => {
      delete imageCache[url];
    });
  }
};

// Preload image and store in cache
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Check if already in cache and loaded
    const cached = imageCache[src];
    if (cached && !cached.loading && !cached.error) {
      cached.timestamp = Date.now(); // Update access time
      resolve(cached.image);
      return;
    }

    // If currently loading, wait for it
    if (cached && cached.loading) {
      const checkLoading = () => {
        const current = imageCache[src];
        if (!current.loading) {
          if (current.error) {
            reject(new Error(`Failed to load image: ${src}`));
          } else {
            resolve(current.image);
          }
        } else {
          setTimeout(checkLoading, 50);
        }
      };
      checkLoading();
      return;
    }

    // Start loading new image
    const img = new Image();
    imageCache[src] = {
      image: img,
      timestamp: Date.now(),
      loading: true,
      error: false
    };

    img.onload = () => {
      imageCache[src] = {
        image: img,
        timestamp: Date.now(),
        loading: false,
        error: false
      };
      cleanupCache();
      resolve(img);
    };

    img.onerror = () => {
      imageCache[src] = {
        image: img,
        timestamp: Date.now(),
        loading: false,
        error: true
      };
      reject(new Error(`Failed to load image: ${src}`));
    };

    img.crossOrigin = 'anonymous';
    img.src = src;
  });
};

// React hook for using cached images
export const useImageCache = (src: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setImage(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    preloadImage(src)
      .then((loadedImage) => {
        setImage(loadedImage);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setImage(null);
        setLoading(false);
        setError(true);
      });

  }, [src]);

  return { image, loading, error };
};

// Batch preload images (useful for photo panels)
export const batchPreloadImages = (urls: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(urls.map(url => preloadImage(url).catch(() => null)))
    .then(results => results.filter(Boolean) as HTMLImageElement[]);
};

// Clear cache (useful for memory management)
export const clearImageCache = () => {
  Object.keys(imageCache).forEach(key => {
    delete imageCache[key];
  });
};