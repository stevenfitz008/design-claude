import React, { useMemo } from 'react';
import { Button, ButtonGroup, Icon, Switch } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';
import { getGlobalIconStyle, getCleanIconContainerStyle, getDragHandleDotStyle } from '@/utils/themeUtils';

// Element type icons matching the screenshot
const ELEMENT_ICONS: Record<string, string> = {
  text: 'font',
  image: 'media',
  shape: 'shapes',
  video: 'video',
  audio: 'volume-up',
  background: 'layers',
  icon: 'symbol-square' // For SVG icons
};

// Get element display type for the first column
const getElementDisplayType = (element: CanvasElement): string => {
  switch (element.type) {
    case 'text':
      return 'Text';
    case 'image':
      return 'Image';
    case 'shape':
      if ((element as any).iconName) {
        return 'SVG'; // Icon elements are displayed as SVG
      }
      return 'SVG'; // Shapes are also SVG
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'background':
      return 'Background';
    default:
      return 'Element';
  }
};

// Get element display name/ID for the second column
const getElementDisplayName = (element: CanvasElement): string => {
  switch (element.type) {
    case 'text':
      const textContent = (element as any).text || 'Text Element';
      // Truncate long text content
      return textContent.length > 20 ? textContent.substring(0, 17) + '...' : textContent;
    case 'image':
      // Return a shortened element ID like in the screenshot
      return `#${element.id.substring(element.id.length - 8)}`;
    case 'shape':
      if ((element as any).iconName) {
        return `#${element.id.substring(element.id.length - 8)}`;
      }
      return `#${element.id.substring(element.id.length - 8)}`;
    case 'video':
      return (element as any).title || `#${element.id.substring(element.id.length - 8)}`;
    case 'audio':
      return (element as any).fileName || `#${element.id.substring(element.id.length - 8)}`;
    case 'background':
      return `#${element.id.substring(element.id.length - 8)}`;
    default:
      return `#${element.id.substring(element.id.length - 8)}`;
  }
};

// Get element description/subtitle
const getElementDescription = (element: CanvasElement): string => {
  switch (element.type) {
    case 'text':
      const textElement = element as any;
      return `${textElement.fontFamily?.split(',')[0] || 'Sans-serif'} ${textElement.fontSize || 16}px`;
    case 'image':
      return `${Math.round(element.width)} × ${Math.round(element.height)}`;
    case 'shape':
      const shapeElement = element as any;
      if (shapeElement.icon) {
        return 'Icon';
      }
      return `${Math.round(element.width)} × ${Math.round(element.height)}`;
    case 'video':
      const videoElement = element as any;
      return videoElement.duration ? `${videoElement.duration}s` : 'Video';
    case 'audio':
      return 'Audio';
    default:
      return '';
  }
};

export const LayersPanel: React.FC = () => {
  const { theme } = useTheme();
  const { 
    elements, 
    selection, 
    selectElement, 
    selectElements,
    clearSelection,
    updateElement,
    deleteElement,
    duplicateElement,
    moveToFront,
    moveToBack,
    moveForward,
    moveBackward
  } = useCanvasStore();

  // Sort elements by zIndex (top to bottom in panel), with background elements always last
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => {
      // Background elements always go to the bottom
      if (a.type === 'background' && b.type !== 'background') return 1;
      if (b.type === 'background' && a.type !== 'background') return -1;

      // Regular sorting by zIndex (descending - higher zIndex appears first/top)
      return b.zIndex - a.zIndex;
    });
  }, [elements]);

  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;
    selectElement(elementId, isMultiSelect);
  };

  const handleVisibilityToggle = (elementId: string, visible: boolean) => {
    updateElement(elementId, { visible });
  };

  const handleLockToggle = (elementId: string, locked: boolean) => {
    updateElement(elementId, { locked });
  };

  const handleDuplicate = (elementId: string) => {
    duplicateElement(elementId);
  };

  const handleDelete = (elementId: string) => {
    deleteElement(elementId);
  };

  const selectedCount = selection.length;
  const hasSelection = selectedCount > 0;

  return (
    <div
      className="layers-panel"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: theme.colors?.textPrimary || '#f5f8fa',
          marginBottom: '12px'
        }}>
          Layers ({elements.length})
          {hasSelection && (
            <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: '8px' }}>
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Layer Controls */}
        {hasSelection && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <ButtonGroup minimal size="small">
              <Button
                icon="chevron-up"
                onClick={() => selection.forEach(id => moveToFront(id))}
                title="Bring to front"
              />
              <Button
                icon="arrow-up"
                onClick={() => selection.forEach(id => moveForward(id))}
                title="Move forward"
              />
              <Button
                icon="arrow-down"
                onClick={() => selection.forEach(id => moveBackward(id))}
                title="Move backward"
              />
              <Button
                icon="chevron-down"
                onClick={() => selection.forEach(id => moveToBack(id))}
                title="Send to back"
              />
            </ButtonGroup>
            
            <ButtonGroup minimal size="small">
              <Button
                icon="duplicate"
                onClick={() => selection.forEach(id => duplicateElement(id))}
                title="Duplicate"
              />
              <Button
                icon="trash"
                intent="danger"
                onClick={() => selection.forEach(id => deleteElement(id))}
                title="Delete"
              />
            </ButtonGroup>
          </div>
        )}
      </div>

      {/* Layers List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {sortedElements.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '150px',
            color: theme.colors?.textSecondary || '#a7b6c2',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            <div>
              <Icon icon="layers" size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div>No elements in canvas</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Add text, shapes, or images to see them here
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {sortedElements.map((element, index) => {
              const isSelected = selection.includes(element.id);
              const displayName = getElementDisplayName(element);
              const description = getElementDescription(element);
              
              return (
                <div
                  key={element.id}
                  onClick={(e) => handleElementClick(element.id, e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? (theme.colors?.primary || '#48aff0') + '15' : 'transparent',
                    border: isSelected ? `1px solid ${theme.colors?.primary || '#48aff0'}40` : '1px solid transparent',
                    transition: 'all 0.1s ease',
                    marginBottom: '1px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = (theme.colors?.cardBg || '#394b59') + '40';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Drag Handle */}
                  <div style={{
                    width: '16px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px',
                    flexShrink: 0,
                    cursor: 'grab'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <div style={getDragHandleDotStyle(theme)} />
                      <div style={getDragHandleDotStyle(theme)} />
                      <div style={getDragHandleDotStyle(theme)} />
                    </div>
                  </div>

                  {/* Element Icon */}
                  <div style={getCleanIconContainerStyle(20, 12)}>
                    <Icon
                      icon={ELEMENT_ICONS[element.type] || 'document'}
                      size={16}
                      style={getGlobalIconStyle(theme, 'secondary')}
                    />
                  </div>

                  {/* Element Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: theme.colors?.textPrimary || '#f5f8fa',
                      marginBottom: '1px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {getElementDisplayType(element)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme.colors?.textSecondary || '#a7b6c2',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'monospace'
                    }}>
                      {displayName}
                    </div>
                  </div>

                  {/* Layer Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                    {/* Visibility Toggle */}
                    <Button
                      icon={element.visible ? 'eye-open' : 'eye-off'}
                      minimal
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVisibilityToggle(element.id, !element.visible);
                      }}
                      style={{ 
                        opacity: element.visible ? 1 : 0.5,
                        minWidth: '20px',
                        minHeight: '20px'
                      }}
                      title={element.visible ? 'Hide element' : 'Show element'}
                    />

                    {/* Lock Toggle */}
                    <Button
                      icon={element.locked ? 'lock' : 'unlock'}
                      minimal
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockToggle(element.id, !element.locked);
                      }}
                      style={{ 
                        opacity: element.locked ? 1 : 0.5,
                        minWidth: '20px',
                        minHeight: '20px'
                      }}
                      title={element.locked ? 'Unlock element' : 'Lock element'}
                    />

                    {/* Delete Button */}
                    <Button
                      icon="trash"
                      minimal
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(element.id);
                      }}
                      style={{
                        minWidth: '20px',
                        minHeight: '20px',
                        color: theme.colors?.textSecondary || '#a7b6c2'
                      }}
                      title="Delete element"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={clearSelection}
            disabled={!hasSelection}
            fill
            size="small"
          >
            Clear Selection
          </Button>
        </div>
        
        {/* Layer Statistics */}
        <div style={{
          marginTop: '12px',
          fontSize: '10px',
          color: theme.colors?.textSecondary || '#a7b6c2',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>
            Visible: {elements.filter(el => el.visible).length}
          </span>
          <span>
            Locked: {elements.filter(el => el.locked).length}
          </span>
          <span>
            Total: {elements.length}
          </span>
        </div>
      </div>
    </div>
  );
};

LayersPanel.displayName = 'LayersPanel';