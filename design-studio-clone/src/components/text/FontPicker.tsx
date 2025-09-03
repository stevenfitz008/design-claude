import React, { useState, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
// we need observer to update component automatically on any store changes
import { HTMLSelect, InputGroup, Button, Popover, Menu, MenuItem, Spinner } from '@blueprintjs/core';
import { styled } from 'goober';
import { POPULAR_GOOGLE_FONTS, googleFontsService, GoogleFont } from '@/services/googleFonts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const FontPickerContainer = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FontPreviewContainer = styled('div')`
  border: 1px solid #495563;
  border-radius: 4px;
  background: #2f343c;
  max-height: 300px;
  overflow-y: auto;

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
`;

const FontItem = styled('div')<{ isSelected: boolean; isLoaded: boolean }>`
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #495563;
  transition: all 0.15s ease;
  background: ${props => props.isSelected ? '#48aff0' : 'transparent'};
  opacity: ${props => props.isLoaded ? 1 : 0.6};
  
  &:hover {
    background: ${props => props.isSelected ? '#48aff0' : '#3a4249'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const FontName = styled('div')<{ fontFamily: string; isLoaded: boolean }>`
  font-family: ${props => props.isLoaded ? `"${props.fontFamily}", Arial, sans-serif` : 'Arial, sans-serif'};
  font-size: 16px;
  font-weight: 400;
  color: #f5f8fa;
  margin-bottom: 4px;
`;

const FontInfo = styled('div')`
  font-size: 12px;
  color: #8a9ba8;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FontCategory = styled('span')`
  text-transform: capitalize;
  opacity: 0.8;
`;

const LoadingIndicator = styled('span')`
  font-size: 10px;
  color: #48aff0;
`;

const ScrollLoadingIndicator = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #8a9ba8;
  font-size: 14px;
  gap: 8px;

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

// Extended font generator for infinite scrolling
const generateMoreFonts = (page: number, existingFonts: GoogleFont[], allFonts: GoogleFont[]): GoogleFont[] => {
  const startIndex = (page - 1) * 20;
  const endIndex = startIndex + 20;
  return allFonts.slice(startIndex, endIndex);
};

const SearchInput = styled(InputGroup)`
  .bp4-input {
    background: #2f343c;
    border: 1px solid #495563;
    color: #f5f8fa;
    
    &:focus {
      border-color: #48aff0;
      box-shadow: 0 0 0 1px #48aff0;
    }
    
    &::placeholder {
      color: #8a9ba8;
    }
  }
`;

const CategoryFilter = styled('div')`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const CategoryButton = styled(Button)<{ isActive: boolean }>`
  font-size: 11px;
  min-height: 24px;
  background: ${props => props.isActive ? '#48aff0' : 'transparent'};
  color: ${props => props.isActive ? '#ffffff' : '#8a9ba8'};
  border: 1px solid ${props => props.isActive ? '#48aff0' : '#495563'};
  
  &:hover {
    background: ${props => props.isActive ? '#48aff0' : '#3a4249'};
    color: #ffffff;
  }
`;

interface FontPickerProps {
  selectedFont?: string;
  onFontSelect: (fontFamily: string) => void;
  showPreview?: boolean;
  maxHeight?: number;
}

export const FontPicker: React.FC<FontPickerProps> = observer(({
  selectedFont = 'Inter',
  onFontSelect,
  showPreview = true,
  maxHeight = 300
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loadedFonts, setLoadedFonts] = useState(new Set<string>());
  const [loadingFonts, setLoadingFonts] = useState(new Set<string>());

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'display', label: 'Display' },
    { value: 'handwriting', label: 'Script' },
    { value: 'monospace', label: 'Mono' }
  ];

  // Filter fonts based on search and category
  const allFilteredFonts = useMemo(() => {
    return POPULAR_GOOGLE_FONTS.filter(font => {
      const matchesSearch = font.family.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || font.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Initialize infinite scroll for fonts
  const { 
    items: filteredFonts, 
    loading: fontsLoading, 
    hasMore, 
    loadingRef: fontsLoadingRef,
    reset 
  } = useInfiniteScroll({
    initialItems: allFilteredFonts.slice(0, 20),
    itemsPerPage: 20,
    generateItems: (page, existing) => generateMoreFonts(page, existing, allFilteredFonts),
    hasMore: allFilteredFonts.length > 20
  });

  // Reset infinite scroll when filters change
  useEffect(() => {
    reset();
  }, [allFilteredFonts, reset]);

  // Load font preview
  const loadFontPreview = async (fontFamily: string) => {
    if (loadedFonts.has(fontFamily) || loadingFonts.has(fontFamily)) {
      return;
    }

    setLoadingFonts(prev => new Set(prev).add(fontFamily));

    try {
      await googleFontsService.loadFont(fontFamily, ['400']);
      setLoadedFonts(prev => new Set(prev).add(fontFamily));
    } catch (error) {
      console.warn(`Failed to load font preview for ${fontFamily}:`, error);
    } finally {
      setLoadingFonts(prev => {
        const newSet = new Set(prev);
        newSet.delete(fontFamily);
        return newSet;
      });
    }
  };

  // Load visible fonts for preview
  useEffect(() => {
    if (!showPreview) return;

    const visibleFonts = filteredFonts.slice(0, 10); // Load first 10 visible fonts
    visibleFonts.forEach(font => {
      loadFontPreview(font.family);
    });
  }, [filteredFonts, showPreview]);

  // Handle font selection
  const handleFontSelect = async (fontFamily: string) => {
    // Ensure font is loaded before selecting
    if (!loadedFonts.has(fontFamily)) {
      await loadFontPreview(fontFamily);
    }
    onFontSelect(fontFamily);
  };

  if (!showPreview) {
    // Simple dropdown mode
    return (
      <HTMLSelect
        value={selectedFont}
        onChange={(e) => onFontSelect(e.target.value)}
        fill
      >
        {POPULAR_GOOGLE_FONTS.map(font => (
          <option key={font.family} value={font.family}>
            {font.family}
          </option>
        ))}
      </HTMLSelect>
    );
  }

  return (
    <FontPickerContainer>
      {/* Search */}
      <SearchInput
        leftIcon="search"
        placeholder="Search fonts..."
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        rightElement={
          searchQuery && (
            <Button
              icon="cross"
              minimal
              small
              onClick={() => setSearchQuery('')}
            />
          )
        }
      />

      {/* Category Filter */}
      <CategoryFilter>
        {categories.map(category => (
          <CategoryButton
            key={category.value}
            isActive={selectedCategory === category.value}
            onClick={() => setSelectedCategory(category.value)}
            small
            minimal
          >
            {category.label}
          </CategoryButton>
        ))}
      </CategoryFilter>

      {/* Font List */}
      <FontPreviewContainer style={{ maxHeight }}>
        {filteredFonts.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#8a9ba8',
            fontSize: '14px'
          }}>
            No fonts found matching your criteria
          </div>
        ) : (
          <>
            {filteredFonts.map(font => {
              const isSelected = font.family === selectedFont;
              const isLoaded = loadedFonts.has(font.family);
              const isLoading = loadingFonts.has(font.family);

              return (
                <FontItem
                  key={font.family}
                  isSelected={isSelected}
                  isLoaded={isLoaded}
                  onClick={() => handleFontSelect(font.family)}
                  onMouseEnter={() => loadFontPreview(font.family)}
                >
                  <FontName
                    fontFamily={font.family}
                    isLoaded={isLoaded}
                  >
                    {font.family}
                  </FontName>
                  <FontInfo>
                    <FontCategory>{font.category}</FontCategory>
                    {isLoading && <LoadingIndicator>Loading...</LoadingIndicator>}
                  </FontInfo>
                </FontItem>
              );
            })}
            {hasMore && (
              <div ref={fontsLoadingRef}>
                {fontsLoading && (
                  <ScrollLoadingIndicator>
                    <Spinner size={20} />
                    Loading more fonts...
                  </ScrollLoadingIndicator>
                )}
              </div>
            )}
          </>
        )}
      </FontPreviewContainer>
    </FontPickerContainer>
  );
});

FontPicker.displayName = 'FontPicker';