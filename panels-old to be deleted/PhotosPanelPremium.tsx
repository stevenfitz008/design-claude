import React, { useState, useEffect } from 'react';
import { Button, InputGroup, Spinner, Tab, Tabs } from '@blueprintjs/core';
import { styled } from 'goober';
import { unsplashService, UnsplashPhoto, UnsplashSearchParams } from '../../services/unsplashService';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

const PanelContainer = styled('div')`
  height: 100%;
  width: 350px;
  max-width: 350px;
  min-width: 350px;
  box-sizing: border-box;
  background: #2f343c;
  color: #f5f8fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SearchContainer = styled('div')`
  padding: 16px;
  border-bottom: 1px solid #495563;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
`;

const SearchInput = styled(InputGroup)`
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  
  .bp4-input-group {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .bp4-input {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    background: #1c2127;
    border: 1px solid #495563;
    color: #f5f8fa;
    transition: none !important;
    
    &:focus {
      border-color: #48aff0;
      box-shadow: 0 0 0 1px #48aff0 !important;
      transform: none !important;
    }
    
    &::placeholder {
      color: #8a9ba8;
    }
  }
`;

const TabsContainer = styled('div')`
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex: 1;
  overflow: hidden;
  
  .bp4-tabs {
    height: 100%;
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .bp4-tab-list {
    background: #2f343c;
    border-bottom: 1px solid #495563;
    padding: 0 16px;
    margin: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .bp4-tab {
    color: #8a9ba8;
    font-size: 14px;
    font-weight: 500;
    padding: 12px 16px;
    border-radius: 0;
    
    &[aria-selected="true"] {
      color: #48aff0;
      border-bottom: 2px solid #48aff0;
      background: transparent;
    }
    
    &:hover {
      color: #bfccd6;
      background: rgba(72, 175, 240, 0.1);
    }
  }

  .bp4-tab-panel {
    flex: 1;
    width: 100%;
    max-width: 100%;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;
  }
`;

const PhotoGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  contain: layout style;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #2f343c;
  }

  &::-webkit-scrollbar-thumb {
    background: #495563;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #5c6b77;
  }
`;

const PhotoCard = styled('div')`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #1c2127;
  border: 1px solid #495563;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: #48aff0;
  }

  &:active {
    border-color: #3590d0;
  }
`;

const PhotoImage = styled('img')`
  width: 100%;
  height: auto;
  aspect-ratio: 4/3;
  object-fit: cover;
  object-position: center;
  display: block;
  min-height: 120px;
`;

const PhotoOverlay = styled('div')`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 8px;
  color: white;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${PhotoCard}:hover & {
    opacity: 1;
  }
`;

const LoadingIndicator = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #8a9ba8;
  font-size: 14px;
  gap: 10px;

  .bp4-spinner {
    .bp4-spinner-svg-container {
      .bp4-spinner-track {
        stroke: #495563;
      }
      .bp4-spinner-head {
        stroke: #48aff0;
      }
    }
  }
`;

const EmptyState = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8a9ba8;
  text-align: center;
  padding: 40px 20px;
`;

// Generate more photos for infinite scroll
const generateMorePhotos = async (page: number, existingPhotos: UnsplashPhoto[], searchQuery?: string): Promise<UnsplashPhoto[]> => {
  try {
    const params: UnsplashSearchParams = {
      page,
      per_page: 20,
      query: searchQuery || 'design',
      order_by: 'relevant'
    };

    if (searchQuery) {
      const response = await unsplashService.searchPhotos(params);
      return response.results;
    } else {
      const photos = await unsplashService.getRandomPhotos({ per_page: 20, page });
      return Array.isArray(photos) ? photos : [];
    }
  } catch (error) {
    console.error('Failed to load more photos:', error);
    return [];
  }
};

export const PhotosPanelPremium: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize infinite scroll for search results
  const { 
    items: photos, 
    loading, 
    hasMore, 
    loadingRef,
    reset
  } = useInfiniteScroll({
    initialItems: [],
    itemsPerPage: 20,
    generateItems: (page, existing) => generateMorePhotos(page, existing, searchQuery),
    hasMore: true
  });

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      reset();
      return;
    }

    setIsSearching(true);
    try {
      const response = await unsplashService.searchPhotos({
        query: query.trim(),
        per_page: 20,
        page: 1,
        order_by: 'relevant'
      });
      setSearchResults(response.results);
      reset(); // Reset infinite scroll with new search
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Load initial random photos
  useEffect(() => {
    const loadInitialPhotos = async () => {
      try {
        const randomPhotos = await unsplashService.getRandomPhotos({ per_page: 20, page: 1 });
        if (Array.isArray(randomPhotos)) {
          // Initialize with random photos if no search query
          if (!searchQuery) {
            reset();
          }
        }
      } catch (error) {
        console.error('Failed to load initial photos:', error);
      }
    };

    loadInitialPhotos();
  }, []);

  // Handle photo click (add to canvas)
  const handlePhotoClick = (photo: UnsplashPhoto) => {
    console.log('Photo selected:', photo);
    // TODO: Integrate with canvas store to add image
    // This would typically call a canvas action to add the image
  };

  const displayPhotos = searchQuery ? searchResults : photos;

  const renderSearchTab = () => (
    <div style={{ 
      height: '100%', 
      width: '100%',
      maxWidth: '100%',
      display: 'flex', 
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <SearchContainer>
        <SearchInput
          leftIcon="search"
          placeholder="Search Unsplash photos..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setSearchQuery(value);
            handleSearch(value);
          }}
          rightElement={
            isSearching ? (
              <Spinner size={16} />
            ) : searchQuery ? (
              <Button
                icon="cross"
                minimal
                small
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  reset();
                }}
              />
            ) : null
          }
        />
      </SearchContainer>

      <PhotoGrid>
        {displayPhotos.length === 0 && !loading ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                📷
              </div>
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                {searchQuery ? 'No photos found' : 'Search for photos'}
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.4, maxWidth: '250px' }}>
                {searchQuery 
                  ? `Try different keywords for "${searchQuery}"`
                  : 'Enter a search term to find photos from Unsplash'
                }
              </div>
            </EmptyState>
          </div>
        ) : (
          displayPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              onClick={() => handlePhotoClick(photo)}
            >
              <PhotoImage
                src={photo.urls.small}
                alt={photo.alt_description || photo.description || 'Unsplash photo'}
                loading="lazy"
              />
              <PhotoOverlay>
                by {photo.user.name}
              </PhotoOverlay>
            </PhotoCard>
          ))
        )}
        {hasMore && displayPhotos.length > 0 && (
          <div
            ref={loadingRef}
            style={{ gridColumn: '1 / -1' }}
          >
            {loading && (
              <LoadingIndicator>
                <Spinner size={20} />
                Loading more photos...
              </LoadingIndicator>
            )}
          </div>
        )}
      </PhotoGrid>
    </div>
  );

  const renderTrendingTab = () => (
    <div style={{ 
      height: '100%', 
      width: '100%',
      maxWidth: '100%',
      display: 'flex', 
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <PhotoGrid>
        {photos.slice(0, 10).map((photo) => (
          <PhotoCard
            key={photo.id}
            onClick={() => handlePhotoClick(photo)}
          >
            <PhotoImage
              src={photo.urls.small}
              alt={photo.alt_description || photo.description || 'Trending photo'}
              loading="lazy"
            />
            <PhotoOverlay>
              by {photo.user.name}
            </PhotoOverlay>
          </PhotoCard>
        ))}
      </PhotoGrid>
    </div>
  );

  return (
    <PanelContainer>
      <TabsContainer>
        <Tabs
          id="photos-panel-tabs"
          selectedTabId={activeTab}
          onChange={setActiveTab}
          animate={false}
        >
          <Tab
            id="search"
            title="Search"
            panel={renderSearchTab()}
          />
          <Tab
            id="trending"
            title="Trending"
            panel={renderTrendingTab()}
          />
        </Tabs>
      </TabsContainer>
    </PanelContainer>
  );
};

PhotosPanelPremium.displayName = 'PhotosPanelPremium';