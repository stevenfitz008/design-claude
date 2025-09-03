import React, { useState, useCallback } from 'react';
import { styled } from '@styles/goober-setup';
import { Icon, Button, Menu, MenuItem, Popover } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import type { PageCarouselProps, PageThumbnailProps } from '@/types/pages';

const CarouselContainer = styled.div<{ theme: any }>`
  position: fixed;
  bottom: 0;
  left: 72px; /* Account for left toolbar */
  right: 0;
  height: 90px;
  background-color: ${props => props.theme.colors.primaryBg};
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow-x: auto;
  padding: 4px 0;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const ThumbnailWrapper = styled.div<{ isActive: boolean; theme: any }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isActive ? props.theme.colors.accent : 'transparent'};
  
  &:hover {
    background: ${props => props.isActive ? props.theme.colors.accent : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-1px);
  }
`;

const ThumbnailImage = styled.div<{ isActive: boolean; theme: any }>`
  width: 48px;
  height: 36px;
  border-radius: 4px;
  background: ${props => props.theme.colors.canvasBg};
  border: 2px solid ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 2px;
  }
  
  /* Page number overlay when no thumbnail */
  &::before {
    content: attr(data-page-number);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    opacity: 0.7;
    z-index: 1;
  }
`;

const ThumbnailDuration = styled.div<{ theme: any }>`
  margin-top: 2px;
  font-size: 10px;
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
`;

const PageActions = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  display: flex;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${ThumbnailWrapper}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled(Button)<{ theme: any }>`
  min-width: 16px !important;
  min-height: 16px !important;
  padding: 2px !important;
  background: ${props => props.theme.colors.primaryBg} !important;
  border: 1px solid ${props => props.theme.colors.border} !important;
  
  .bp5-icon {
    width: 10px !important;
    height: 10px !important;
  }
`;

const AddPageButton = styled(Button)<{ theme: any }>`
  min-width: 60px;
  height: 60px;
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: 6px;
  background: transparent !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: rgba(255, 255, 255, 0.05) !important;
  }
  
  .bp5-button-text {
    font-size: 9px;
    font-weight: 500;
  }
`;

const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page,
  isActive,
  onClick,
  onDuplicate,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const handleClick = useCallback(() => {
    onClick(page.id);
  }, [page.id, onClick]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(page.id);
  }, [page.id, onDuplicate]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(page.id);
  }, [page.id, onDelete]);

  const contextMenu = (
    <Menu>
      <MenuItem
        icon="duplicate"
        text="Duplicate Page"
        onClick={handleDuplicate}
      />
      <MenuItem
        icon="trash"
        text="Delete Page"
        onClick={handleDelete}
        intent="danger"
      />
    </Menu>
  );

  return (
    <Popover
      content={contextMenu}
      position="top"
      disabled={!showActions}
    >
      <ThumbnailWrapper
        isActive={isActive}
        theme={theme}
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <ThumbnailImage
          isActive={isActive}
          theme={theme}
          data-page-number={page.order + 1}
        >
          {page.thumbnailUrl && (
            <img src={page.thumbnailUrl} alt={page.name} />
          )}
        </ThumbnailImage>
        
        <ThumbnailDuration theme={theme}>
          {page.duration.toFixed(1)}s
        </ThumbnailDuration>
        
        <PageActions>
          <ActionButton
            theme={theme}
            icon="duplicate"
            minimal
            small
            onClick={handleDuplicate}
            title="Duplicate page"
          />
          <ActionButton
            theme={theme}
            icon="trash"
            minimal
            small
            onClick={handleDelete}
            title="Delete page"
            style={{ marginLeft: 2 }}
          />
        </PageActions>
      </ThumbnailWrapper>
    </Popover>
  );
};

const PageCarousel: React.FC<PageCarouselProps> = ({
  pages,
  currentPageId,
  onPageSelect,
  onPageAdd,
  onPageDuplicate,
  onPageDelete,
  // onPageReorder, // TODO: Implement drag & drop reordering
  className,
}) => {
  const { theme } = useTheme();

  const handleAddPage = useCallback(() => {
    onPageAdd();
  }, [onPageAdd]);

  // Sort pages by order
  const sortedPages = [...pages].sort((a, b) => a.order - b.order);

  return (
    <CarouselContainer theme={theme} className={className}>
      <ThumbnailsContainer>
        {sortedPages.map((page) => (
          <PageThumbnail
            key={page.id}
            page={page}
            isActive={page.id === currentPageId}
            onClick={onPageSelect}
            onDuplicate={onPageDuplicate}
            onDelete={onPageDelete}
          />
        ))}
        
        <AddPageButton
          theme={theme}
          onClick={handleAddPage}
          title="Add new page"
          minimal
        >
          <Icon icon="plus" size={14} />
          <span>Add</span>
        </AddPageButton>
      </ThumbnailsContainer>
      
      {/* Future: Add playback controls here */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
        <Button
          icon="play"
          minimal
          title="Preview animation"
          disabled // Will be enabled when animation system is integrated
        />
        <Button
          icon="download"
          minimal
          title="Export design"
        />
      </div>
    </CarouselContainer>
  );
};

export { PageCarousel };
export type { PageCarouselProps, PageThumbnailProps };