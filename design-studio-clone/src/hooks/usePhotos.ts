import { useState, useCallback } from 'react';
import { UnsplashPhoto, UnsplashSearchParams } from '../types/api';
import { apiClient } from '../services/api';

interface PhotosState {
  photos: UnsplashPhoto[];
  trendingPhotos: UnsplashPhoto[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchQuery: string;
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    perPage: number;
    hasMore: boolean;
  };
}

export const usePhotos = () => {
  const [state, setState] = useState<PhotosState>({
    photos: [],
    trendingPhotos: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    searchQuery: '',
    pagination: {
      total: 0,
      totalPages: 0,
      page: 1,
      perPage: 20,
      hasMore: false,
    },
  });

  const searchPhotos = useCallback(async (params: UnsplashSearchParams, loadMore = false) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: !loadMore, 
        isLoadingMore: loadMore,
        error: null,
        searchQuery: params.query,
      }));

      const response = await apiClient.searchPhotos(params);

      setState(prev => ({
        ...prev,
        photos: loadMore ? [...prev.photos, ...response.results] : response.results,
        pagination: {
          total: response.total,
          totalPages: response.total_pages,
          page: response.page,
          perPage: response.per_page,
          hasMore: response.page < response.total_pages,
        },
        isLoading: false,
        isLoadingMore: false,
      }));

      return response;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: error.message || 'Failed to search photos',
      }));
      throw error;
    }
  }, []);

  const loadMorePhotos = useCallback(async () => {
    if (state.pagination.hasMore && !state.isLoadingMore && state.searchQuery) {
      const nextPage = state.pagination.page + 1;
      await searchPhotos({
        query: state.searchQuery,
        page: nextPage,
        per_page: state.pagination.perPage,
      }, true);
    }
  }, [state.pagination.hasMore, state.isLoadingMore, state.searchQuery, state.pagination.page, state.pagination.perPage, searchPhotos]);

  const loadTrendingPhotos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const trendingPhotos = await apiClient.getTrendingPhotos();

      setState(prev => ({
        ...prev,
        trendingPhotos,
        isLoading: false,
      }));

      return trendingPhotos;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load trending photos',
      }));
      throw error;
    }
  }, []);

  const downloadPhoto = useCallback(async (photo: UnsplashPhoto) => {
    try {
      // Track download with Unsplash API
      await apiClient.downloadPhoto(photo.id);
      
      // Create download link for user
      const link = document.createElement('a');
      link.href = photo.urls.full;
      link.download = `${photo.id}-${photo.user.username}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to download photo',
      }));
      throw error;
    }
  }, []);

  const addPhotoToCanvas = useCallback(async (photo: UnsplashPhoto, canvasPosition?: { x: number; y: number }) => {
    try {
      // Track download for Unsplash
      await apiClient.downloadPhoto(photo.id);

      // Return photo data for canvas integration
      return {
        id: photo.id,
        type: 'image',
        src: photo.urls.regular,
        width: photo.width,
        height: photo.height,
        alt: photo.alt_description || photo.description || 'Unsplash photo',
        attribution: {
          photographer: photo.user.name,
          photographerUrl: `https://unsplash.com/@${photo.user.username}`,
          source: 'Unsplash',
          sourceUrl: `https://unsplash.com/photos/${photo.id}`,
        },
        position: canvasPosition || { x: 0, y: 0 },
      };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to add photo to canvas',
      }));
      throw error;
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      photos: [],
      searchQuery: '',
      pagination: {
        total: 0,
        totalPages: 0,
        page: 1,
        perPage: 20,
        hasMore: false,
      },
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Predefined search functions
  const searchByCategory = useCallback(async (category: string) => {
    return await searchPhotos({ 
      query: category, 
      per_page: 20,
      order_by: 'popular' 
    });
  }, [searchPhotos]);

  const searchByColor = useCallback(async (color: string, query = '') => {
    return await searchPhotos({ 
      query: query || color, 
      color: color as any,
      per_page: 20 
    });
  }, [searchPhotos]);

  const searchByOrientation = useCallback(async (orientation: 'landscape' | 'portrait' | 'squarish', query = '') => {
    return await searchPhotos({ 
      query: query || orientation, 
      orientation,
      per_page: 20 
    });
  }, [searchPhotos]);

  return {
    ...state,
    actions: {
      searchPhotos,
      loadMorePhotos,
      loadTrendingPhotos,
      downloadPhoto,
      addPhotoToCanvas,
      clearSearch,
      clearError,
      searchByCategory,
      searchByColor,
      searchByOrientation,
    },
  };
};

export default usePhotos;