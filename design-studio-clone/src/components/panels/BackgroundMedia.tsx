import React, { useState, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Spinner } from '@blueprintjs/core';
import { mediaService, type Photo } from '../../services/mediaService';

interface SimpleBackground {
  id: string;
  urls: { small: string; regular: string };
  user: { name: string };
  alt_description?: string;
  description?: string;
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  width?: number;
  height?: number;
  download_url?: string;
}

// Convert Unsplash photo to SimpleBackground format
const convertPhotoToBackground = (photo: Photo): SimpleBackground => ({
  id: photo.id,
  urls: { 
    small: photo.urls.small || photo.urls.thumb,
    regular: photo.urls.regular
  },
  user: { name: photo.user.name },
  alt_description: photo.alt_description,
  description: photo.description,
  type: 'image',
  width: photo.width,
  height: photo.height,
  download_url: photo.download_url
});

const fetchBackgrounds = async (endpoint: string, isLoadMore = false, page = 1): Promise<{backgrounds: SimpleBackground[], hasMore: boolean}> => {
  try {
    console.log('🎨 fetchBackgrounds called:', { endpoint, isLoadMore, page });
    
    // Use real Unsplash API through mediaService
    const photos = await mediaService.getTrendingPhotos({ per_page: 20, page });
    const backgrounds = photos.map(convertPhotoToBackground);
    
    return {
      backgrounds,
      hasMore: photos.length === 20 // Assume more available if we got a full page
    };
  } catch (error) {
    console.error('Failed to fetch backgrounds from API:', error);
    // Fallback to mock data on API failure
    const fallbackBackgrounds = isLoadMore ? 
      mockBackgrounds.map((bg, index) => ({
        ...bg,
        id: `${bg.id}_page${page}_${index}`,
        user: { name: `${bg.user.name} (Page ${page})` }
      })) : mockBackgrounds;
    
    return {
      backgrounds: fallbackBackgrounds,
      hasMore: true
    };
  }
};

const searchBackgrounds = async (query: string, page = 1): Promise<{backgrounds: SimpleBackground[], hasMore: boolean}> => {
  if (!query.trim()) return {backgrounds: [], hasMore: false};
  
  try {
    console.log('🔍 searchBackgrounds called:', { query, page });
    
    // Use real Unsplash API search through mediaService
    const searchResult = await mediaService.searchPhotos({ 
      query, 
      page, 
      per_page: 20 
    });
    
    const backgrounds = searchResult.results.map(convertPhotoToBackground);
    
    return {
      backgrounds,
      hasMore: page < searchResult.total_pages
    };
  } catch (error) {
    console.error('Failed to search backgrounds:', error);
    // Fallback to mock search results
    const filteredMock = mockBackgrounds.filter(bg => 
      bg.alt_description?.toLowerCase().includes(query.toLowerCase()) ||
      bg.description?.toLowerCase().includes(query.toLowerCase())
    );
    return {
      backgrounds: filteredMock,
      hasMore: false
    };
  }
};

const getTrendingBackgrounds = async (page = 1): Promise<{backgrounds: SimpleBackground[], hasMore: boolean}> => {
  try {
    console.log('🔍 getTrendingBackgrounds called with background filter:', { page });
    
    // Search specifically for "background" images to get appropriate content
    const searchResult = await mediaService.searchPhotos({ 
      query: 'background', 
      page, 
      per_page: 20 
    });
    
    const backgrounds = searchResult.results.map(convertPhotoToBackground);
    
    return {
      backgrounds,
      hasMore: page < searchResult.total_pages
    };
  } catch (error) {
    console.error('Failed to get background images:', error);
    // Fallback to fetchBackgrounds (which will use mock data on API failure)
    return fetchBackgrounds(`/backgrounds/trending?per_page=20&page=${page}`, page > 1, page);
  }
};

// Mock backgrounds data
const mockBackgrounds = [
  {
    id: '1',
    urls: { 
      small: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
      regular: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800'
    },
    user: { name: 'Gradients Co' },
    alt_description: 'Blue purple gradient',
    type: 'gradient' as const
  },
  {
    id: '2', 
    urls: { 
      small: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
      regular: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800'
    },
    user: { name: 'Color Studio' },
    alt_description: 'Solid coral background',
    type: 'solid' as const
  },
  {
    id: '3',
    urls: { 
      small: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=400',
      regular: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=800'
    },
    user: { name: 'Pattern Lab' },
    alt_description: 'Geometric pattern',
    type: 'pattern' as const
  },
  {
    id: '4',
    urls: { 
      small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    },
    user: { name: 'Nature Pics' },
    alt_description: 'Mountain landscape',
    type: 'image' as const
  },
  {
    id: '5',
    urls: { 
      small: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400',
      regular: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800'
    },
    user: { name: 'Gradient Pro' },
    alt_description: 'Pink orange gradient',
    type: 'gradient' as const
  },
  {
    id: '6',
    urls: { 
      small: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400',
      regular: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=800'
    },
    user: { name: 'Solid Colors' },
    alt_description: 'Deep blue background',
    type: 'solid' as const
  },
  {
    id: '7',
    urls: { 
      small: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
      regular: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'
    },
    user: { name: 'Abstract Art' },
    alt_description: 'Abstract pattern',
    type: 'pattern' as const
  },
  {
    id: '8',
    urls: { 
      small: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      regular: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
    },
    user: { name: 'Forest Studio' },
    alt_description: 'Forest background',
    type: 'image' as const
  },
  {
    id: '9',
    urls: { 
      small: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      regular: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800'
    },
    user: { name: 'Color Wave' },
    alt_description: 'Green blue gradient',
    type: 'gradient' as const
  },
  {
    id: '10',
    urls: { 
      small: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
      regular: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800'
    },
    user: { name: 'Minimalist' },
    alt_description: 'Clean white background',
    type: 'solid' as const
  }
];

// we need observer to update component automatically on any store changes
export const BackgroundMediaPanel: React.FC = observer(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [backgrounds, setBackgrounds] = useState<SimpleBackground[]>([]);
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
        const { backgrounds: results, hasMore: moreResults } = await searchBackgrounds(query, currentPage);

        if (isLoadMore) {
          setBackgrounds(prev => {
            const existingIds = new Set(prev.map(bg => bg.id));
            const newBackgrounds = results.filter(bg => !existingIds.has(bg.id));
            return [...prev, ...newBackgrounds];
          });
          setPage(currentPage);
        } else {
          setBackgrounds(results.length > 0 ? results : mockBackgrounds);
        }
        setHasMore(moreResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search backgrounds');
        if (!isLoadMore) {
          setBackgrounds(mockBackgrounds);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    } else {
      // Show trending backgrounds when no search query
      loadTrendingBackgrounds();
    }
  };

  const loadTrendingBackgrounds = async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;

    console.log('🎨 loadTrendingBackgrounds called:', { isLoadMore, currentPage: isLoadMore ? page + 1 : 1 });
    
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      console.log('🔄 Calling getTrendingBackgrounds with page:', currentPage);
      const { backgrounds: results, hasMore: more } = await getTrendingBackgrounds(currentPage);
      console.log('✅ getTrendingBackgrounds result:', { resultsCount: results.length, hasMore: more });
      
      if (isLoadMore) {
        setBackgrounds(prev => {
          const existingIds = new Set(prev.map(bg => bg.id));
          const newBackgrounds = results.filter(bg => !existingIds.has(bg.id));
          return [...prev, ...newBackgrounds];
        });
        setPage(currentPage);
      } else {
        setBackgrounds(results.length > 0 ? results : mockBackgrounds);
        setPage(1);
      }
      setHasMore(more);
    } catch (err) {
      console.error('Load trending error:', err);
      if (!isLoadMore) {
        setBackgrounds(mockBackgrounds);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load trending backgrounds on component mount
  useEffect(() => {
    console.log('🚀 BackgroundMediaPanel mounted, loading trending backgrounds...');
    loadTrendingBackgrounds();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      const sentinel = document.querySelector('#background-scroll-sentinel');

      if (sentinel) {
        observer = new IntersectionObserver(
          (entries) => {
            const target = entries[0];

            if (target.isIntersecting && !loadingMore && !loading && hasMore) {
              console.log('🚀 Background infinite scroll triggered, hasMore:', hasMore);
              if (searchQuery.trim()) {
                handleSearch(searchQuery, true);
              } else {
                loadTrendingBackgrounds(true);
              }
            }
          },
          {
            threshold: 0.1,
            rootMargin: '100px'
          }
        );
        console.log('📍 Observing background sentinel');
        observer.observe(sentinel);
      } else {
        console.log('❌ Missing background sentinel element');
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [searchQuery, hasMore, loadingMore, loading, page, backgrounds.length]);

  const handleBackgroundClick = (background: any) => {
    console.log('Background selected:', background);
  };

  const handleDragStart = (e: React.DragEvent, background: any) => {
    console.log('🚀 Drag start for background:', background.id);
    const dragData = {
      type: 'background',
      src: background.urls.regular || background.urls.small,
      alt: background.alt_description || background.description || 'Background',
      user: background.user.name,
      backgroundType: background.type,
      download_url: background.download_url
    };
    console.log('📦 Background drag data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    // Also set text data as fallback
    e.dataTransfer.setData('text/plain', background.urls.small);
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
            placeholder="Search backgrounds..."
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
      

      {/* Backgrounds Grid */}
      <div 
        id="backgrounds-scroll-container"
        style={{
          position: 'absolute',
          top: '76px', // Account for search bar only
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
          gridAutoRows: '10px',
          gap: '12px'
        }}>
          {backgrounds.map((background, index) => {
            // Calculate dynamic height based on background aspect ratio
            const getGridRowSpan = () => {
              if (background.width && background.height) {
                const aspectRatio = background.width / background.height;
                if (aspectRatio > 1.3) return 6; // Landscape - shorter
                if (aspectRatio < 0.8) return 10; // Portrait - taller  
                return 8; // Square/default
              }
              return 8; // Default
            };

            return (
              <div
                key={background.id}
                draggable={true}
                onClick={() => handleBackgroundClick(background)}
                onDragStart={(e) => handleDragStart(e, background)}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'grab',
                  background: '#1c2127',
                  border: '1px solid #495563',
                  transition: 'all 0.2s ease',
                  gridRowEnd: `span ${getGridRowSpan()}`,
                  userSelect: 'none'
                }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#48aff0';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                // Show overlay
                const overlay = e.currentTarget.querySelector('.background-overlay') as HTMLElement;
                if (overlay) overlay.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#495563';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                // Hide overlay
                const overlay = e.currentTarget.querySelector('.background-overlay') as HTMLElement;
                if (overlay) overlay.style.opacity = '0';
              }}
            >
                <img
                  src={background.urls.small}
                  alt={background.alt_description || background.description || 'Background'}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                  onLoad={(e) => {
                    // Adjust parent container height based on actual image dimensions
                    const img = e.target as HTMLImageElement;
                    const container = img.parentElement as HTMLElement;
                    if (img.naturalWidth && img.naturalHeight) {
                      const aspectRatio = img.naturalWidth / img.naturalHeight;
                      let spans;
                      if (aspectRatio > 1.3) spans = 6; // Landscape
                      else if (aspectRatio < 0.8) spans = 10; // Portrait
                      else spans = 8; // Square
                      container.style.gridRowEnd = `span ${spans}`;
                    }
                  }}
                />


              <div 
                className="background-overlay"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                  padding: '12px 8px 8px',
                  color: 'white',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  lineHeight: '1.2',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                }}>
                  {background.user.name}
                </div>
                <div style={{
                  fontSize: '9px',
                  opacity: 0.8,
                  marginTop: '2px',
                  lineHeight: '1.2'
                }}>
                  Unsplash
                </div>
              </div>
              </div>
            );
          })}
          
          {/* Infinite scroll sentinel */}
          {backgrounds.length > 0 && (
            <div 
              id="background-scroll-sentinel" 
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
              {!hasMore && backgrounds.length > 10 && (
                <div style={{ color: '#8a9ba8', fontSize: '12px' }}>No more backgrounds to load</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BackgroundMediaPanel.displayName = 'BackgroundMediaPanel';