import React, { useState, useMemo } from 'react';
import { Button, InputGroup, MenuItem, Card, Spinner } from '@blueprintjs/core';
import { Select, ItemRenderer } from '@blueprintjs/select';
import { useTheme } from '@/contexts/ThemeProvider';
import { usePanelStore } from '@/stores/panelStore';
import { useCanvasStore } from '@/stores/canvasStore';

// Video categories
const VIDEO_CATEGORIES = [
  { value: 'all', label: 'All Videos' },
  { value: 'nature', label: 'Nature' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'people', label: 'People' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'food', label: 'Food' },
  { value: 'travel', label: 'Travel' },
  { value: 'sports', label: 'Sports' }
];

// Mock video data (in a real app, this would come from a video API like Pexels, Pixabay, etc.)
const MOCK_VIDEOS = [
  // Nature
  { 
    id: 'nature_1', 
    title: 'Ocean Waves', 
    category: 'nature', 
    duration: 15,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjNDI5MEY1Ii8+CjxwYXRoIGQ9Ik0wIDgwUTUwIDYwIDEwMCA4MFQyMDAgNjBWMTIwSDBWODBaIiBmaWxsPSIjMUU3NkVGIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iI0ZERjRGRiIvPgo8L3N2Zz4=',
    tags: ['ocean', 'water', 'relaxing'],
    src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4' // Sample video URL
  },
  { 
    id: 'nature_2', 
    title: 'Forest Trees', 
    category: 'nature', 
    duration: 20,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMTZBMDg1Ii8+CjxyZWN0IHg9IjkwIiB5PSI4MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjOTJBM0FCIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSIzMCIgZmlsbD0iIzEwQjk4MSIvPgo8L3N2Zz4=',
    tags: ['forest', 'trees', 'nature'],
    src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },

  // Business
  { 
    id: 'business_1', 
    title: 'Office Meeting', 
    category: 'business', 
    duration: 25,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzM3NDE0OSIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjMwIiByPSIxMCIgZmlsbD0iIzQ4QUZGMCIvPgo8Y2lyY2xlIGN4PSIxMzAiIGN5PSIzMCIgcj0iMTAiIGZpbGw9IiM0OEFGRjAiLz4KPC9zdmc+',
    tags: ['office', 'meeting', 'professional'],
    src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4'
  },

  // Technology
  { 
    id: 'tech_1', 
    title: 'Code Animation', 
    category: 'technology', 
    duration: 12,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMUIyMDJEIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzI3MzAzRCIvPgo8cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0IiBmaWxsPSIjNDhBRkYwIi8+CjxyZWN0IHg9IjMwIiB5PSI0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQiIGZpbGw9IiNGRkVCM0IiLz4KPC9zdmc+',
    tags: ['code', 'programming', 'tech'],
    src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4'
  },

  // People
  { 
    id: 'people_1', 
    title: 'Team Collaboration', 
    category: 'people', 
    duration: 18,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkVGM0VBIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjRjU5RTBCIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjQwIiByPSIxNSIgZmlsbD0iI0Y1OUUwQiIvPgo8Y2lyY2xlIGN4PSIxNDAiIGN5PSI0MCIgcj0iMTUiIGZpbGw9IiNGNTlFMEIiLz4KPC9zdmc+',
    tags: ['team', 'collaboration', 'people'],
    src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4'
  },

  // Abstract
  { 
    id: 'abstract_1', 
    title: 'Geometric Motion', 
    category: 'abstract', 
    duration: 10,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMUYyOTM3Ii8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjRUIzOTgyIi8+CjxyZWN0IHg9IjEyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzRGNDZFNSIvPgo8L3N2Zz4=',
    tags: ['abstract', 'geometric', 'motion'],
    src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_3mb.mp4'
  },

  // Food
  { 
    id: 'food_1', 
    title: 'Cooking Process', 
    category: 'food', 
    duration: 30,
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkJFQ0I1Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjYwIiByPSIzMCIgZmlsbD0iI0VGNDQ0NCIvPgo8Y2lyY2xlIGN4PSI5MCIgY3k9IjUwIiByPSI4IiBmaWxsPSIjRjU5RTBCIi8+CjxjaXJjbGUgY3g9IjExMCIgY3k9IjcwIiByPSI2IiBmaWxsPSIjMTBCOTgxIi8+Cjwvc3ZnPg==',
    tags: ['cooking', 'food', 'kitchen'],
    src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1920x1080_1mb.mp4'
  }
];

const CategorySelect = Select.ofType<{ value: string; label: string }>();

const renderCategory: ItemRenderer<{ value: string; label: string }> = (
  category,
  { handleClick, modifiers }
) => {
  return (
    <MenuItem
      active={modifiers.active}
      key={category.value}
      onClick={handleClick}
      text={category.label}
    />
  );
};

export const VideosPanel: React.FC = () => {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = usePanelStore();
  const { addElement } = useCanvasStore();
  const [selectedCategory, setSelectedCategory] = useState(VIDEO_CATEGORIES[0]);
  const [loadingVideo, setLoadingVideo] = useState<string | null>(null);

  const filteredVideos = useMemo(() => {
    return MOCK_VIDEOS.filter(video => {
      // Category filter
      if (selectedCategory.value !== 'all' && video.category !== selectedCategory.value) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          video.title.toLowerCase().includes(query) ||
          video.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleVideoClick = async (video: any) => {
    setLoadingVideo(video.id);
    
    try {
      // In a real app, you might want to validate the video URL or fetch metadata
      const element = {
        id: `video_${video.id}_${Date.now()}`,
        type: 'video' as const,
        x: 100,
        y: 100,
        width: 320,
        height: 240,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        src: video.src,
        title: video.title,
        duration: video.duration,
        thumbnail: video.thumbnail,
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      };
      
      addElement(element);
    } catch (error) {
      console.error('Failed to add video:', error);
    } finally {
      setLoadingVideo(null);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Search and Filters */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <InputGroup
          leftIcon="search"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          rightElement={
            searchQuery ? (
              <Button
                icon="cross"
                minimal
                onClick={() => setSearchQuery('')}
              />
            ) : undefined
          }
          style={{ marginBottom: '12px' }}
        />
        
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: '12px',
            color: theme.colors?.textSecondary || '#a7b6c2',
            marginRight: '4px'
          }}>
            Category:
          </span>
          
          <CategorySelect
            items={VIDEO_CATEGORIES}
            itemRenderer={renderCategory}
            onItemSelect={(category) => setSelectedCategory(category)}
            filterable={false}
          >
            <Button
              text={selectedCategory.label}
              rightIcon="caret-down"
              minimal
              small
            />
          </CategorySelect>
        </div>
      </div>

      {/* Videos Grid */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}>
        {filteredVideos.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: theme.colors?.textSecondary || '#a7b6c2',
            fontSize: '14px'
          }}>
            No videos found
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                interactive
                onClick={() => handleVideoClick(video)}
                style={{
                  padding: '0',
                  cursor: loadingVideo === video.id ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: theme.colors?.cardBg || '#394b59',
                  border: `1px solid ${theme.colors?.border || '#495563'}`,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (loadingVideo !== video.id) {
                    e.currentTarget.style.borderColor = theme.colors?.primary || '#48aff0';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors?.border || '#495563';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Video Thumbnail */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100px',
                  overflow: 'hidden',
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: theme.colors?.bg || '#30404d'
                }}>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  
                  {/* Play Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    opacity: loadingVideo === video.id ? 1 : 0,
                    transition: 'opacity 0.2s ease'
                  }}>
                    {loadingVideo === video.id ? (
                      <Spinner size={20} />
                    ) : (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '0',
                          height: '0',
                          borderLeft: '6px solid #000',
                          borderTop: '4px solid transparent',
                          borderBottom: '4px solid transparent',
                          marginLeft: '1px'
                        }} />
                      </div>
                    )}
                  </div>
                  
                  {/* Duration Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px'
                  }}>
                    {formatDuration(video.duration)}
                  </div>
                </div>
                
                {/* Video Info */}
                <div style={{ padding: '12px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: theme.colors?.textPrimary || '#f5f8fa',
                    marginBottom: '4px',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {video.title}
                  </div>
                  
                  <div style={{
                    fontSize: '10px',
                    color: theme.colors?.textSecondary || '#a7b6c2',
                    textTransform: 'capitalize'
                  }}>
                    {video.category}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

VideosPanel.displayName = 'VideosPanel';