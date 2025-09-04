import React, { useState, useMemo } from 'react';
import { Button, InputGroup, MenuItem, ButtonGroup, Icon } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { useTheme } from '@/contexts/ThemeProvider';
import { usePanelStore } from '@/stores/panelStore';
import { useCanvasStore } from '@/stores/canvasStore';

// Icon categories with popular icons for each category
const ICON_CATEGORIES = [
  { value: 'all', label: 'All Icons' },
  { value: 'business', label: 'Business' },
  { value: 'communication', label: 'Communication' },
  { value: 'media', label: 'Media' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'social', label: 'Social' },
  { value: 'technology', label: 'Technology' },
  { value: 'weather', label: 'Weather' },
  { value: 'editing', label: 'Editing' }
];

// Mock icon data using Blueprint.js icons
const MOCK_ICONS = [
  // Business
  { id: 'chart', name: 'Chart', icon: 'chart', category: 'business', tags: ['graph', 'data', 'analytics'] },
  { id: 'dollar', name: 'Dollar', icon: 'dollar', category: 'business', tags: ['money', 'price', 'cost'] },
  { id: 'office', name: 'Office', icon: 'office', category: 'business', tags: ['building', 'work'] },
  { id: 'briefcase', name: 'Briefcase', icon: 'briefcase', category: 'business', tags: ['work', 'job'] },
  
  // Communication
  { id: 'envelope', name: 'Envelope', icon: 'envelope', category: 'communication', tags: ['email', 'mail', 'message'] },
  { id: 'phone', name: 'Phone', icon: 'phone', category: 'communication', tags: ['call', 'contact'] },
  { id: 'chat', name: 'Chat', icon: 'chat', category: 'communication', tags: ['message', 'talk'] },
  { id: 'comment', name: 'Comment', icon: 'comment', category: 'communication', tags: ['feedback', 'reply'] },
  
  // Media
  { id: 'camera', name: 'Camera', icon: 'camera', category: 'media', tags: ['photo', 'picture'] },
  { id: 'video', name: 'Video', icon: 'video', category: 'media', tags: ['movie', 'film'] },
  { id: 'music', name: 'Music', icon: 'music', category: 'media', tags: ['audio', 'sound'] },
  { id: 'play', name: 'Play', icon: 'play', category: 'media', tags: ['start', 'begin'] },
  
  // Navigation
  { id: 'arrow-up', name: 'Arrow Up', icon: 'arrow-up', category: 'navigation', tags: ['direction', 'move'] },
  { id: 'arrow-down', name: 'Arrow Down', icon: 'arrow-down', category: 'navigation', tags: ['direction', 'move'] },
  { id: 'arrow-left', name: 'Arrow Left', icon: 'arrow-left', category: 'navigation', tags: ['direction', 'back'] },
  { id: 'arrow-right', name: 'Arrow Right', icon: 'arrow-right', category: 'navigation', tags: ['direction', 'forward'] },
  { id: 'menu', name: 'Menu', icon: 'menu', category: 'navigation', tags: ['hamburger', 'list'] },
  { id: 'home', name: 'Home', icon: 'home', category: 'navigation', tags: ['house', 'main'] },
  
  // Social
  { id: 'heart', name: 'Heart', icon: 'heart', category: 'social', tags: ['like', 'love'] },
  { id: 'star', name: 'Star', icon: 'star', category: 'social', tags: ['favorite', 'rating'] },
  { id: 'thumbs-up', name: 'Thumbs Up', icon: 'thumbs-up', category: 'social', tags: ['like', 'approve'] },
  { id: 'share', name: 'Share', icon: 'share', category: 'social', tags: ['distribute', 'send'] },
  
  // Technology
  { id: 'desktop', name: 'Desktop', icon: 'desktop', category: 'technology', tags: ['computer', 'screen'] },
  { id: 'mobile-phone', name: 'Mobile Phone', icon: 'mobile-phone', category: 'technology', tags: ['smartphone', 'device'] },
  { id: 'cloud', name: 'Cloud', icon: 'cloud', category: 'technology', tags: ['storage', 'online'] },
  { id: 'database', name: 'Database', icon: 'database', category: 'technology', tags: ['data', 'storage'] },
  
  // Weather
  { id: 'cloud-snow', name: 'Snow', icon: 'cloud-snow', category: 'weather', tags: ['cold', 'winter'] },
  { id: 'flash', name: 'Lightning', icon: 'flash', category: 'weather', tags: ['storm', 'thunder'] },
  
  // Editing
  { id: 'edit', name: 'Edit', icon: 'edit', category: 'editing', tags: ['modify', 'change'] },
  { id: 'trash', name: 'Trash', icon: 'trash', category: 'editing', tags: ['delete', 'remove'] },
  { id: 'duplicate', name: 'Duplicate', icon: 'duplicate', category: 'editing', tags: ['copy', 'clone'] },
  { id: 'undo', name: 'Undo', icon: 'undo', category: 'editing', tags: ['revert', 'back'] }
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

export const IconsPanel: React.FC = () => {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = usePanelStore();
  const { addElement } = useCanvasStore();
  const [selectedCategory, setSelectedCategory] = useState(ICON_CATEGORIES[0]);

  const filteredIcons = useMemo(() => {
    return MOCK_ICONS.filter(icon => {
      // Category filter
      if (selectedCategory.value !== 'all' && icon.category !== selectedCategory.value) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          icon.name.toLowerCase().includes(query) ||
          icon.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleIconClick = (icon: any) => {
    const element = {
      id: `icon_${icon.id}_${Date.now()}`,
      type: 'shape' as const,
      x: 100,
      y: 100,
      width: 48,
      height: 48,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      shapeType: 'icon',
      icon: icon.icon,
      fill: '#000000',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 0
    };
    
    addElement(element);
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
          placeholder="Search icons..."
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
            items={ICON_CATEGORIES}
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

      {/* Icons Grid */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}>
        {filteredIcons.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: theme.colors?.textSecondary || '#a7b6c2',
            fontSize: '14px'
          }}>
            No icons found
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '12px'
          }}>
            {filteredIcons.map((icon) => (
              <div
                key={icon.id}
                onClick={() => handleIconClick(icon)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.colors?.border || '#495563'}`,
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#48aff0';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  // Show overlay
                  const overlay = e.currentTarget.querySelector('.icon-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors?.border || '#495563';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  // Hide overlay
                  const overlay = e.currentTarget.querySelector('.icon-overlay') as HTMLElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
                title={`Add ${icon.name} icon`}
                role="button"
                tabIndex={0}
                aria-label={`Add ${icon.name} icon`}
              >
                <Icon 
                  icon={icon.icon as any} 
                  size={24}
                  style={{ marginBottom: '6px', color: theme.colors?.textPrimary || '#f5f8fa' }}
                />
                <span style={{
                  fontSize: '11px',
                  textAlign: 'center',
                  color: theme.colors?.textPrimary || '#f5f8fa',
                  lineHeight: '1.2'
                }}>
                  {icon.name}
                </span>

                {/* Hover Overlay */}
                <div 
                  className="icon-overlay"
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
                    {icon.name}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    opacity: 0.8,
                    marginTop: '2px',
                    lineHeight: '1.2',
                    textTransform: 'capitalize'
                  }}>
                    {icon.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

IconsPanel.displayName = 'IconsPanel';