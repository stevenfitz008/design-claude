import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, InputGroup, MenuItem, Spinner } from '@blueprintjs/core';
import { Select, ItemRenderer } from '@blueprintjs/select';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { usePanelStore } from '@/stores/panelStore';
import { useCanvasStore } from '@/stores/canvasStore';

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  width: number;
  height: number;
  user: {
    id: string;
    name: string;
    username: string;
  };
  likes: number;
  downloads: number;
}

const PanelContainer = styled.div<{ theme: any }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SearchSection = styled.div<{ theme: any }>`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  .search-input {
    margin-bottom: 12px;
  }
  
  .filters {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .filter-label {
    font-size: 12px;
    color: ${props => props.theme.colors.textSecondary};
    margin-right: 4px;
  }
`;

const PhotosGrid = styled.div<{ theme: any }>`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.bg};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
  }
`;

const MasonryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  
  @supports (grid-template-rows: masonry) {
    grid-template-rows: masonry;
  }
`;

const PhotoCard = styled.div<{ theme: any; aspectRatio: number }>`
  background: ${props => props.theme.colors.cardBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  break-inside: avoid;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    .photo-overlay {
      opacity: 1;
    }
  }
  
  .photo-container {
    position: relative;
    width: 100%;
    aspect-ratio: ${props => props.aspectRatio};
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    
    .photo-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8));
      opacity: 0;
      transition: opacity 0.2s ease;
      display: flex;
      align-items: flex-end;
      padding: 12px;
      
      .photo-info {
        color: white;
        font-size: 11px;
        
        .photo-author {
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .photo-dimensions {
          opacity: 0.8;
        }
      }
    }
  }
`;

const LoadingState = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  gap: 8px;
`;

const LoadMoreButton = styled(Button)<{ theme: any }>`
  margin: 16px auto;
  display: block;
`;

const categories = [
  { value: 'all', label: 'All Photos' },
  { value: 'nature', label: 'Nature' },
  { value: 'people', label: 'People' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'food', label: 'Food' },
  { value: 'travel', label: 'Travel' },
  { value: 'architecture', label: 'Architecture' },
];

const orientations = [
  { value: 'all', label: 'Any Orientation' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'squarish', label: 'Square' },
];

const CategorySelect = Select.ofType<{ value: string; label: string }>();
const OrientationSelect = Select.ofType<{ value: string; label: string }>();

const renderOption: ItemRenderer<{ value: string; label: string }> = (
  option,
  { handleClick, modifiers }
) => {
  return (
    <MenuItem
      active={modifiers.active}
      key={option.value}
      onClick={handleClick}
      text={option.label}
    />
  );
};

// Mock Unsplash data (in real app, this would come from Unsplash API)
const mockPhotos: UnsplashPhoto[] = [
  {
    id: 'photo_1',
    description: 'Beautiful landscape',
    alt_description: 'Mountain landscape at sunset',
    urls: {
      raw: '/api/placeholder/400/300',
      full: '/api/placeholder/400/300', 
      regular: '/api/placeholder/400/300',
      small: '/api/placeholder/200/150',
      thumb: '/api/placeholder/200/150',
    },
    width: 4000,
    height: 3000,
    user: {
      id: 'user_1',
      name: 'John Photographer',
      username: 'johnphoto',
    },
    likes: 156,
    downloads: 1247,
  },
  {
    id: 'photo_2',
    description: 'City architecture',
    alt_description: 'Modern glass building',
    urls: {
      raw: '/api/placeholder/300/400',
      full: '/api/placeholder/300/400',
      regular: '/api/placeholder/300/400', 
      small: '/api/placeholder/150/200',
      thumb: '/api/placeholder/150/200',
    },
    width: 3000,
    height: 4000,
    user: {
      id: 'user_2',
      name: 'Architecture Pro',
      username: 'archpro',
    },
    likes: 89,
    downloads: 567,
  },
  {
    id: 'photo_3',
    description: 'Technology workspace',
    alt_description: 'Laptop and coffee on desk',
    urls: {
      raw: '/api/placeholder/500/300',
      full: '/api/placeholder/500/300',
      regular: '/api/placeholder/500/300',
      small: '/api/placeholder/250/150', 
      thumb: '/api/placeholder/250/150',
    },
    width: 5000,
    height: 3000,
    user: {
      id: 'user_3',
      name: 'Tech Shots',
      username: 'techshots',
    },
    likes: 234,
    downloads: 891,
  },
];

export const PhotosPanel: React.FC = () => {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = usePanelStore();
  const { addElement } = useCanvasStore();
  
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedOrientation, setSelectedOrientation] = useState(orientations[0]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Simulate API loading
  const loadPhotos = useCallback(async (reset = false) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, just cycle through mock photos with some variations
    const newPhotos = mockPhotos.map((photo, index) => ({
      ...photo,
      id: `${photo.id}_${page}_${index}`,
    }));
    
    if (reset) {
      setPhotos(newPhotos);
    } else {
      setPhotos(prev => [...prev, ...newPhotos]);
    }
    
    setLoading(false);
    setHasMore(page < 3); // Simulate 3 pages max
  }, [page]);

  useEffect(() => {
    loadPhotos(true);
  }, [searchQuery, selectedCategory, selectedOrientation]);

  const handlePhotoClick = useCallback((photo: UnsplashPhoto) => {
    // Calculate appropriate size for canvas (max 400px width)
    const maxWidth = 400;
    const aspectRatio = photo.height / photo.width;
    const width = Math.min(photo.width, maxWidth);
    const height = width * aspectRatio;
    
    const element = {
      id: `photo_${photo.id}_${Date.now()}`,
      type: 'image' as const,
      x: 100,
      y: 100,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      src: photo.urls.regular,
      originalWidth: photo.width,
      originalHeight: photo.height,
      fit: 'cover' as const,
      alt: photo.alt_description || photo.description || `Photo by ${photo.user.name}`,
    };
    
    addElement(element);
  }, [addElement]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadPhotos(false);
    }
  };

  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (photo.description?.toLowerCase().includes(query)) ||
          (photo.alt_description?.toLowerCase().includes(query)) ||
          photo.user.name.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [photos, searchQuery]);

  return (
    <PanelContainer theme={theme}>
      <SearchSection theme={theme}>
        <InputGroup
          className="search-input"
          leftIcon="search"
          placeholder="Search photos..."
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
        />
        
        <div className="filters">
          <span className="filter-label">Category:</span>
          <CategorySelect
            items={categories}
            itemRenderer={renderOption}
            onItemSelect={(category) => {
              setSelectedCategory(category);
              setPage(1);
            }}
            filterable={false}
          >
            <Button
              text={selectedCategory.label}
              rightIcon="caret-down"
              minimal
              small
            />
          </CategorySelect>
          
          <OrientationSelect
            items={orientations}
            itemRenderer={renderOption}
            onItemSelect={(orientation) => {
              setSelectedOrientation(orientation);
              setPage(1);
            }}
            filterable={false}
          >
            <Button
              text={selectedOrientation.label}
              rightIcon="caret-down"
              minimal
              small
            />
          </OrientationSelect>
        </div>
      </SearchSection>

      <PhotosGrid theme={theme} data-testid="photos-grid">
        {filteredPhotos.length === 0 && !loading ? (
          <LoadingState theme={theme}>
            No photos found
          </LoadingState>
        ) : (
          <>
            <MasonryGrid>
              {filteredPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  theme={theme}
                  aspectRatio={photo.height / photo.width}
                  onClick={() => handlePhotoClick(photo)}
                  data-testid={`photo-${photo.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Add photo by ${photo.user.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePhotoClick(photo);
                    }
                  }}
                >
                  <div className="photo-container">
                    <img 
                      src={photo.urls.small}
                      alt={photo.alt_description || photo.description || 'Unsplash photo'}
                      loading="lazy"
                    />
                    <div className="photo-overlay">
                      <div className="photo-info">
                        <div className="photo-author">
                          Photo by {photo.user.name}
                        </div>
                        <div className="photo-dimensions">
                          {photo.width} × {photo.height}
                        </div>
                      </div>
                    </div>
                  </div>
                </PhotoCard>
              ))}
            </MasonryGrid>
            
            {loading && (
              <LoadingState theme={theme} data-testid="loading-photos">
                <Spinner size={20} />
                Loading photos...
              </LoadingState>
            )}
            
            {!loading && hasMore && filteredPhotos.length > 0 && (
              <LoadMoreButton theme={theme} onClick={loadMore}>
                Load More Photos
              </LoadMoreButton>
            )}
          </>
        )}
      </PhotosGrid>
    </PanelContainer>
  );
};

PhotosPanel.displayName = 'PhotosPanel';