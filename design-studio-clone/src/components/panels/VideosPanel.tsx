import React, { useState, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Spinner } from '@blueprintjs/core';
import { pexelsService } from '../../services/pexelsService';
import type { PexelsVideo } from '../../types/videos';

// we need observer to update component automatically on any store changes
export const VideosPanel: React.FC = observer(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
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
        const response = await pexelsService.searchVideos({
          query: query,
          page: currentPage,
          per_page: 20
        });

        if (isLoadMore) {
          setVideos(prev => {
            const existingIds = new Set(prev.map(video => video.id));
            const newVideos = response.videos.filter(video => !existingIds.has(video.id));
            return [...prev, ...newVideos];
          });
          setPage(currentPage);
        } else {
          setVideos(response.videos.length > 0 ? response.videos : mockVideos);
        }
        setHasMore(response.videos.length >= 20);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search videos');
        if (!isLoadMore) {
          setVideos(mockVideos);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    } else {
      // Show trending videos when no search query
      loadTrendingVideos();
    }
  };

  const loadTrendingVideos = async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;

    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const results = await pexelsService.getTrendingVideos({
        page: currentPage,
        per_page: 20
      });
      
      if (isLoadMore) {
        setVideos(prev => {
          const existingIds = new Set(prev.map(video => video.id));
          const newVideos = results.filter(video => !existingIds.has(video.id));
          return [...prev, ...newVideos];
        });
        setPage(currentPage);
      } else {
        setVideos(results.length > 0 ? results : mockVideos);
        setPage(1);
      }
      setHasMore(results.length >= 20);
    } catch (err) {
      console.error('Load trending error:', err);
      if (!isLoadMore) {
        setVideos(mockVideos);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load trending videos on component mount
  useEffect(() => {
    loadTrendingVideos();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      const sentinel = document.querySelector('#video-scroll-sentinel');

      if (sentinel) {
        observer = new IntersectionObserver(
          (entries) => {
            const target = entries[0];

            if (target.isIntersecting && !loadingMore && !loading && hasMore) {
              console.log('🚀 Video infinite scroll triggered, hasMore:', hasMore);
              if (searchQuery.trim()) {
                handleSearch(searchQuery, true);
              } else {
                loadTrendingVideos(true);
              }
            }
          },
          {
            threshold: 0.1,
            rootMargin: '100px'
          }
        );
        console.log('📍 Observing video sentinel');
        observer.observe(sentinel);
      } else {
        console.log('❌ Missing video sentinel element');
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [searchQuery, hasMore, loadingMore, loading, page, videos.length]);

  const handleVideoClick = (video: PexelsVideo) => {
    console.log('Video selected:', video);
  };

  const handleDragStart = (e: React.DragEvent, video: PexelsVideo) => {
    console.log('🚀 Drag start for video:', video.id);
    const dragData = {
      type: 'video',
      src: video.video_files[0]?.link || video.preview_url,
      thumbnail: video.image,
      duration: video.duration,
      user: video.user.name,
      width: video.width,
      height: video.height,
      download_url: video.download_url,
      video_files: video.video_files
    };
    console.log('📦 Video drag data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    // Also set text data as fallback
    e.dataTransfer.setData('text/plain', video.preview_url);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDimensions = (video: PexelsVideo): string => {
    return `${video.width}×${video.height}`;
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
            placeholder="Search videos..."
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
          Videos by <span style={{ color: '#48aff0', fontWeight: '500' }}>Pexels</span>
        </div>
      </div>
      

      {/* Videos Grid */}
      <div 
        id="videos-scroll-container"
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
          {videos.map((video, index) => {
            // Calculate dynamic height based on video aspect ratio
            const getGridRowSpan = () => {
              const aspectRatio = video.aspect_ratio || (video.width / video.height);
              if (aspectRatio > 1.3) return 6; // Landscape - shorter
              if (aspectRatio < 0.8) return 10; // Portrait - taller  
              return 8; // Square/default
            };

            return (
              <div
                key={video.id}
                draggable={true}
                onClick={() => handleVideoClick(video)}
                onDragStart={(e) => handleDragStart(e, video)}
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
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#495563';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <img
                  src={video.image}
                  alt={`Video by ${video.user.name}`}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                />

                {/* Play Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease'
                }}>
                  <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: '12px solid white',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    marginLeft: '3px'
                  }} />
                </div>

                {/* Duration Badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {formatDuration(video.duration)}
                </div>

                {/* Video Info Overlay */}
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
                    lineHeight: '1.2',
                    marginBottom: '2px'
                  }}>
                    <div style={{ fontWeight: '500' }}>
                      {formatDimensions(video)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.8,
                    lineHeight: '1.2'
                  }}>
                    Video by <span style={{ fontWeight: '500' }}>{video.user.name}</span> on Pexels
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Infinite scroll sentinel */}
          {videos.length > 0 && (
            <div 
              id="video-scroll-sentinel" 
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
              {!hasMore && videos.length > 10 && (
                <div style={{ color: '#8a9ba8', fontSize: '12px' }}>No more videos to load</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

VideosPanel.displayName = 'VideosPanel';

// Mock videos for development/fallback
const mockVideos: PexelsVideo[] = [
  {
    id: 1,
    width: 1920,
    height: 1080,
    duration: 15,
    image: 'https://images.pexels.com/videos/1526909/free-video-1526909.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://www.pexels.com/video/1526909/',
    user: {
      id: 1,
      name: 'Pixabay',
      url: 'https://www.pexels.com/@pixabay'
    },
    video_files: [
      {
        id: 1,
        quality: 'hd',
        file_type: 'video/mp4',
        width: 1920,
        height: 1080,
        link: 'https://player.vimeo.com/external/291648067.hd.mp4',
        size: 25000000
      }
    ],
    aspect_ratio: 1.78,
    file_size_mb: 25,
    preview_url: 'https://player.vimeo.com/external/291648067.hd.mp4',
    download_url: 'https://player.vimeo.com/external/291648067.hd.mp4'
  },
  {
    id: 2,
    width: 1280,
    height: 720,
    duration: 8,
    image: 'https://images.pexels.com/videos/1851190/free-video-1851190.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://www.pexels.com/video/1851190/',
    user: {
      id: 2,
      name: 'Kelly Lacy',
      url: 'https://www.pexels.com/@kelly-lacy-1179532'
    },
    video_files: [
      {
        id: 2,
        quality: 'hd',
        file_type: 'video/mp4',
        width: 1280,
        height: 720,
        link: 'https://player.vimeo.com/external/293125340.hd.mp4',
        size: 15000000
      }
    ],
    aspect_ratio: 1.78,
    file_size_mb: 15,
    preview_url: 'https://player.vimeo.com/external/293125340.hd.mp4',
    download_url: 'https://player.vimeo.com/external/293125340.hd.mp4'
  },
  {
    id: 3,
    width: 1080,
    height: 1920,
    duration: 12,
    image: 'https://images.pexels.com/videos/3298863/free-video-3298863.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://www.pexels.com/video/3298863/',
    user: {
      id: 3,
      name: 'Taryn Elliott',
      url: 'https://www.pexels.com/@taryn-elliott'
    },
    video_files: [
      {
        id: 3,
        quality: 'hd',
        file_type: 'video/mp4',
        width: 1080,
        height: 1920,
        link: 'https://player.vimeo.com/external/380233894.hd.mp4',
        size: 20000000
      }
    ],
    aspect_ratio: 0.56,
    file_size_mb: 20,
    preview_url: 'https://player.vimeo.com/external/380233894.hd.mp4',
    download_url: 'https://player.vimeo.com/external/380233894.hd.mp4'
  },
  {
    id: 4,
    width: 1920,
    height: 1080,
    duration: 20,
    image: 'https://images.pexels.com/videos/852421/free-video-852421.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://www.pexels.com/video/852421/',
    user: {
      id: 4,
      name: 'Life of Pix',
      url: 'https://www.pexels.com/@life-of-pix'
    },
    video_files: [
      {
        id: 4,
        quality: 'hd',
        file_type: 'video/mp4',
        width: 1920,
        height: 1080,
        link: 'https://player.vimeo.com/external/233397823.hd.mp4',
        size: 30000000
      }
    ],
    aspect_ratio: 1.78,
    file_size_mb: 30,
    preview_url: 'https://player.vimeo.com/external/233397823.hd.mp4',
    download_url: 'https://player.vimeo.com/external/233397823.hd.mp4'
  }
];