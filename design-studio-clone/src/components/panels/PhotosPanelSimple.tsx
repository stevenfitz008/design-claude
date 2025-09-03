import React, { useState, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { InputGroup, Spinner } from '@blueprintjs/core';

// Simple API service without complex type imports
const API_BASE_URL = 'http://127.0.0.1:3003/api/v1';

interface SimplePhoto {
  id: string;
  urls: { small: string };
  user: { name: string };
  alt_description?: string;
  description?: string;
}

const fetchPhotos = async (endpoint: string, isLoadMore = false, page = 1): Promise<{photos: SimplePhoto[], hasMore: boolean}> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const results = data.results || data || [];
    return {
      photos: results,
      hasMore: results.length >= 20
    };
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    // For endless scroll testing with mock data
    if (isLoadMore) {
      // Generate 20 additional mock photos with unique IDs for each load
      const additionalPhotos = mockPhotos.map((photo, index) => ({
        ...photo,
        id: `${photo.id}_page${page}_${index}`,
        user: { name: `${photo.user.name} (Page ${page})` }
      }));
      return {
        photos: additionalPhotos,
        hasMore: true // Always true for endless mock scroll
      };
    }
    return {
      photos: mockPhotos,
      hasMore: true // Enable endless scroll even with mock data
    };
  }
};

const searchPhotos = async (query: string, page = 1): Promise<{photos: SimplePhoto[], hasMore: boolean}> => {
  if (!query.trim()) return {photos: [], hasMore: false};
  return fetchPhotos(`/photos/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}`, page > 1, page);
};

const getTrendingPhotos = async (page = 1): Promise<{photos: SimplePhoto[], hasMore: boolean}> => {
  return fetchPhotos(`/photos/trending?per_page=20&page=${page}`, page > 1, page);
};

// Simple mock data for testing - expanded for infinite scroll testing
const mockPhotos = [
  {
    id: '1',
    urls: { small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
    user: { name: 'Nikita Pishchugin' },
    alt_description: 'Mountain landscape'
  },
  {
    id: '2', 
    urls: { small: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400' },
    user: { name: 'Jane Smith' },
    alt_description: 'Forest path'
  },
  {
    id: '3',
    urls: { small: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400' },
    user: { name: 'Bob Johnson' },
    alt_description: 'Lake view'
  },
  {
    id: '4',
    urls: { small: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400' },
    user: { name: 'Alice Brown' },
    alt_description: 'Ocean waves'
  },
  {
    id: '5',
    urls: { small: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400' },
    user: { name: 'Charlie Green' },
    alt_description: 'Sunset sky'
  },
  {
    id: '6',
    urls: { small: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400' },
    user: { name: 'Diana White' },
    alt_description: 'Desert landscape'
  },
  {
    id: '7',
    urls: { small: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400' },
    user: { name: 'Eve Black' },
    alt_description: 'Sunrise view'
  },
  {
    id: '8',
    urls: { small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
    user: { name: 'Frank Gray' },
    alt_description: 'Mountain peak'
  },
  {
    id: '9',
    urls: { small: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400' },
    user: { name: 'Grace Blue' },
    alt_description: 'Forest trail'
  },
  {
    id: '10',
    urls: { small: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400' },
    user: { name: 'Henry Red' },
    alt_description: 'Lake sunset'
  }
];

// we need observer to update component automatically on any store changes
export const PhotosPanelSimple: React.FC = observer(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState<SimplePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSearch = async (query: string, isLoadMore = false) => {
    if (!isLoadMore) {
      setSearchQuery(query);
      setPage(1);
    }

    if (query.trim()) {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const currentPage = isLoadMore ? page + 1 : 1;
        const { photos: results, hasMore: moreResults } = await searchPhotos(query, currentPage);

        if (isLoadMore) {
          setPhotos(prev => {
            const existingIds = new Set(prev.map(photo => photo.id));
            const newPhotos = results.filter(photo => !existingIds.has(photo.id));
            return [...prev, ...newPhotos];
          });
          setPage(currentPage);
        } else {
          setPhotos(results.length > 0 ? results : mockPhotos);
        }
        setHasMore(moreResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search photos');
        if (!isLoadMore) {
          setPhotos(mockPhotos);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    } else {
      // Show trending photos when no search query
      loadTrendingPhotos();
    }
  };

  const loadTrendingPhotos = async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;

    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const { photos: results, hasMore: more } = await getTrendingPhotos(currentPage);
      
      if (isLoadMore) {
        setPhotos(prev => {
          const existingIds = new Set(prev.map(photo => photo.id));
          const newPhotos = results.filter(photo => !existingIds.has(photo.id));
          return [...prev, ...newPhotos];
        });
        setPage(currentPage);
      } else {
        setPhotos(results.length > 0 ? results : mockPhotos);
        setPage(1);
      }
      setHasMore(more);
    } catch (err) {
      console.error('Load trending error:', err);
      if (!isLoadMore) {
        setPhotos(mockPhotos);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load trending photos on component mount
  useEffect(() => {
    loadTrendingPhotos();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      const sentinel = document.querySelector('#scroll-sentinel');

      if (sentinel) {
        observer = new IntersectionObserver(
          (entries) => {
            const target = entries[0];

            if (target.isIntersecting && !loadingMore && !loading && hasMore) {
              console.log('🚀 Infinite scroll triggered, hasMore:', hasMore);
              if (searchQuery.trim()) {
                handleSearch(searchQuery, true);
              } else {
                loadTrendingPhotos(true);
              }
            }
          },
          {
            threshold: 0.1,
            rootMargin: '100px'
          }
        );
        console.log('📍 Observing sentinel');
        observer.observe(sentinel);
      } else {
        console.log('❌ Missing sentinel element');
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [searchQuery, hasMore, loadingMore, loading, page, photos.length]);

  const handlePhotoClick = (photo: any) => {
    console.log('Photo selected:', photo);
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: '#2f343c',
      color: '#f5f8fa',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Search Bar */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #495563'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ 
            color: '#8a9ba8',
            fontSize: '16px',
            flexShrink: 0,
            paddingLeft: '2px'
          }}>
            🔍
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              handleSearch(value);
            }}
            style={{
              flex: 1,
              minHeight: '36px',
              backgroundColor: 'rgba(16, 22, 26, 0.3)',
              border: '1px solid #495563',
              borderRadius: '3px',
              padding: '8px 12px',
              color: '#f5f8fa',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#48aff0';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#495563';
            }}
          />
          {loading && (
            <div style={{ flexShrink: 0, paddingRight: '4px' }}>
              <Spinner size={16} />
            </div>
          )}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#8a9ba8',
          textAlign: 'center',
          marginTop: '8px'
        }}>
          Photos by <span style={{ color: '#48aff0', fontWeight: '500' }}>Unsplash</span>
        </div>
      </div>
      
      {/* Photos Grid */}
      <div 
        id="photos-scroll-container"
        style={{
          position: 'absolute',
          top: '76px', // Account for search bar only (reduced from 88px)
          bottom: '0px',
          left: '0px',
          right: '0px',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable={true}
              onClick={() => handlePhotoClick(photo)}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#1c2127',
                border: '1px solid #495563',
                transition: 'all 0.2s ease',
                aspectRatio: '3/4'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#48aff0';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#495563';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={photo.urls.small}
                alt={photo.alt_description || photo.description || 'Photo'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
                padding: '12px 8px 8px',
                color: 'white'
              }}>
                <div style={{
                  fontSize: '10px',
                  opacity: 0.9,
                  lineHeight: '1.2'
                }}>
                  Photo by <span style={{ fontWeight: '500' }}>{photo.user.name}</span> on Unsplash
                </div>
              </div>
            </div>
          ))}
          
          {/* Infinite scroll sentinel */}
          {photos.length > 0 && (
            <div 
              id="scroll-sentinel" 
              style={{ 
                height: '40px', 
                margin: '20px auto',
                gridColumn: '1 / -1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {loadingMore && <Spinner size={20} />}
              {!hasMore && photos.length > 10 && (
                <div style={{ color: '#8a9ba8', fontSize: '12px' }}>No more photos to load</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PhotosPanelSimple.displayName = 'PhotosPanelSimple';