import React, { useState, useEffect, useRef } from 'react';
import { observer } from "mobx-react-lite";
import { Spinner } from '@blueprintjs/core';
import { pexelsService } from '../../services/pexelsService';
import type { PexelsVideo } from '../../types/videos';

// Simple video interface for the component
interface SimpleVideo {
  id: number;
  image: string; // thumbnail
  preview_url: string;
  duration: number;
  width: number;
  height: number;
  user: { name: string };
  aspect_ratio: number;
  file_size_mb: number;
  tags?: string[];
}
const fetchVideos = async (endpoint: 'search' | 'trending', params?: any, isLoadMore = false, page = 1): Promise<{videos: SimpleVideo[], hasMore: boolean}> => {
  try {
    let videos: PexelsVideo[] = [];
    
    if (endpoint === 'search') {
      const response = await pexelsService.searchVideos({ 
        query: params?.query || 'nature',
        page: page,
        per_page: 20,
        ...params 
      });
      videos = response.videos || [];
    } else {
      videos = await pexelsService.getTrendingVideos({ 
        page: page,
        per_page: 20 
      });
    }

    const simpleVideos: SimpleVideo[] = videos.map(video => ({
      id: video.id,
      image: video.image,
      preview_url: video.preview_url,
      duration: video.duration,
      width: video.width,
      height: video.height,
      user: { name: video.user.name },
      aspect_ratio: video.aspect_ratio,
      file_size_mb: video.file_size_mb,
      tags: video.tags
    }));

    return {
      videos: simpleVideos,
      hasMore: simpleVideos.length >= 20
    };
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    
    // For testing with mock data when API fails
    if (isLoadMore) {
      const additionalVideos = mockVideos.map((video, index) => ({
        ...video,
        id: video.id + (page * 1000) + index,
        user: { name: `${video.user.name} (Page ${page})` }
      }));
      return {
        videos: additionalVideos,
        hasMore: true
      };
    }
    return {
      videos: mockVideos,
      hasMore: true
    };
  }
};

const searchVideos = async (query: string, page = 1): Promise<{videos: SimpleVideo[], hasMore: boolean}> => {
  if (!query.trim()) return {videos: [], hasMore: false};
  return fetchVideos('search', { query }, page > 1, page);
};

const getTrendingVideos = async (page = 1): Promise<{videos: SimpleVideo[], hasMore: boolean}> => {
  return fetchVideos('trending', undefined, page > 1, page);
};

// Mock data for testing
const mockVideos: SimpleVideo[] = [
  {
    id: 1,
    image: 'https://images.pexels.com/videos/1448735/free-video-1448735.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    preview_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 15.5,
    width: 1920,
    height: 1080,
    user: { name: 'Kelly Lacy' },
    aspect_ratio: 1.78,
    file_size_mb: 12.5,
    tags: ['ocean', 'waves']
  },
  {
    id: 2,
    image: 'https://images.pexels.com/videos/1409899/free-video-1409899.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    preview_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 8.2,
    width: 1920,
    height: 1080,
    user: { name: 'Taryn Elliott' },
    aspect_ratio: 1.78,
    file_size_mb: 8.3,
    tags: ['forest', 'nature']
  },
  {
    id: 3,
    image: 'https://images.pexels.com/videos/1448735/free-video-1448735.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    preview_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 22.8,
    width: 1920,
    height: 1080,
    user: { name: 'Mikhail Nilov' },
    aspect_ratio: 1.78,
    file_size_mb: 18.7,
    tags: ['city', 'urban']
  },
  {
    id: 4,
    image: 'https://images.pexels.com/videos/1409899/free-video-1409899.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    preview_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 12.1,
    width: 1080,
    height: 1920,
    user: { name: 'Pavel Danilyuk' },
    aspect_ratio: 0.56,
    file_size_mb: 15.2,
    tags: ['portrait', 'mobile']
  },
  {
    id: 5,
    image: 'https://images.pexels.com/videos/1448735/free-video-1448735.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    preview_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 5.4,
    width: 1920,
    height: 1080,
    user: { name: 'Tom Fisk' },
    aspect_ratio: 1.78,
    file_size_mb: 6.8,
    tags: ['sunset', 'landscape']
  }
];

// Format duration for display
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes}:00`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
  }
};

// Format file size for display
const formatFileSize = (sizeMB: number): string => {
  if (sizeMB < 1) {
    return `${Math.round(sizeMB * 1024)}KB`;
  } else if (sizeMB < 1024) {
    return `${Math.round(sizeMB)}MB`;
  } else {
    return `${Math.round(sizeMB / 1024 * 10) / 10}GB`;
  }
};

// Get aspect ratio display string
const getAspectRatioString = (ratio: number): string => {
  if (ratio > 1.7) return '16:9';
  if (ratio > 1.3) return '4:3';
  if (ratio < 0.8) return '9:16';
  return '1:1';
};

export const VideosPanelNew: React.FC = observer(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<SimpleVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hoveredVideoId, setHoveredVideoId] = useState<number | null>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

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
        const { videos: results, hasMore: moreResults } = await searchVideos(query, currentPage);

        if (isLoadMore) {
          setVideos(prev => {
            const existingIds = new Set(prev.map(video => video.id));
            const newVideos = results.filter(video => !existingIds.has(video.id));
            return [...prev, ...newVideos];
          });
          setPage(currentPage);
        } else {
          setVideos(results.length > 0 ? results : mockVideos);
        }
        setHasMore(moreResults);
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
      const { videos: results, hasMore: more } = await getTrendingVideos(currentPage);
      
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
      setHasMore(more);
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

  // Cleanup video refs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.pause();
          video.src = '';
        }
      });
      videoRefs.current = {};
    };
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      const sentinel = document.querySelector('#videos-scroll-sentinel');

      if (sentinel) {
        observer = new IntersectionObserver(
          (entries) => {
            const target = entries[0];

            if (target.isIntersecting && !loadingMore && !loading && hasMore) {
              console.log('🚀 Videos infinite scroll triggered, hasMore:', hasMore);
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
        console.log('📍 Observing videos sentinel');
        observer.observe(sentinel);
      } else {
        console.log('❌ Missing videos sentinel element');
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [searchQuery, hasMore, loadingMore, loading, page, videos.length]);

  const handleVideoClick = (video: SimpleVideo) => {
    console.log('Video selected:', video);
  };

  const handleDragStart = (e: React.DragEvent, video: SimpleVideo) => {
    console.log('🚀 Drag start for video:', video.id);
    const dragData = {
      type: 'video',
      src: video.preview_url,
      thumbnail: video.image,
      duration: video.duration,
      width: video.width,
      height: video.height,
      aspect_ratio: video.aspect_ratio,
      file_size_mb: video.file_size_mb,
      user: video.user.name,
      tags: video.tags
    };
    console.log('📦 Video drag data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    // Also set text data as fallback
    e.dataTransfer.setData('text/plain', video.preview_url);
  };

  const handleVideoMouseEnter = async (video: SimpleVideo) => {
    setHoveredVideoId(video.id);
    const videoElement = videoRefs.current[video.id];
    if (videoElement && video.preview_url) {
      try {
        videoElement.currentTime = 0; // Start from beginning
        await videoElement.play();
      } catch (error) {
        console.warn('Failed to play video preview:', error);
      }
    }
  };

  const handleVideoMouseLeave = (video: SimpleVideo) => {
    setHoveredVideoId(null);
    const videoElement = videoRefs.current[video.id];
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0; // Reset to first frame
    }
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
            🎬
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
          top: '76px', // Account for search bar
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
              const aspectRatio = video.aspect_ratio;
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
                  handleVideoMouseEnter(video);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#495563';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  handleVideoMouseLeave(video);
                }}
              >
                {/* Video element for preview (shown on hover) */}
                {video.preview_url && (
                  <video
                    ref={(el) => {
                      if (el) {
                        videoRefs.current[video.id] = el;
                      }
                    }}
                    src={video.preview_url}
                    poster={video.image}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: hoveredVideoId === video.id ? 'block' : 'none',
                      pointerEvents: 'none'
                    }}
                    onLoadedMetadata={(e) => {
                      // Ensure video shows first frame when loaded
                      const videoEl = e.target as HTMLVideoElement;
                      videoEl.currentTime = 0;
                    }}
                  />
                )}
                
                {/* Thumbnail image (shown when not hovered) */}
                <img
                  src={video.image}
                  alt={`Video by ${video.user.name}`}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: hoveredVideoId === video.id ? 'none' : 'block',
                    pointerEvents: 'none'
                  }}
                  onLoad={(e) => {
                    // Adjust parent container height based on actual video dimensions
                    const img = e.target as HTMLImageElement;
                    const container = img.parentElement as HTMLElement;
                    const aspectRatio = video.aspect_ratio;
                    let spans;
                    if (aspectRatio > 1.3) spans = 6; // Landscape
                    else if (aspectRatio < 0.8) spans = 10; // Portrait
                    else spans = 8; // Square
                    container.style.gridRowEnd = `span ${spans}`;
                  }}
                />
                
                {/* Play Button Overlay - hidden when video is playing */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '50%',
                  display: hoveredVideoId === video.id ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  pointerEvents: 'none',
                  opacity: hoveredVideoId === video.id ? 0 : 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  ▶
                </div>

                {/* Duration Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '500',
                  pointerEvents: 'none'
                }}>
                  {formatDuration(video.duration)}
                </div>

                {/* Video Info Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                  padding: '20px 8px 8px',
                  color: 'white'
                }}>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    lineHeight: '1.2',
                    marginBottom: '2px'
                  }}>
                    Video by <span style={{ fontWeight: '500' }}>{video.user.name}</span> on Pexels
                  </div>
                  <div style={{
                    fontSize: '9px',
                    opacity: 0.7,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{getAspectRatioString(video.aspect_ratio)}</span>
                    <span>{formatFileSize(video.file_size_mb)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Infinite scroll sentinel */}
          {videos.length > 0 && (
            <div 
              id="videos-scroll-sentinel" 
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
              {!hasMore && videos.length > 5 && (
                <div style={{ color: '#8a9ba8', fontSize: '12px' }}>No more videos to load</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

VideosPanelNew.displayName = 'VideosPanelNew';