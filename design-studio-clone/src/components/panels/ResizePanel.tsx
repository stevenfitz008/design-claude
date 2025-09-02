import React, { useState, useEffect } from 'react';
import { Button, ButtonGroup, FormGroup, NumericInput, Divider, Switch } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

// Common canvas sizes
const PRESET_SIZES = [
  // Social Media
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'Social Media' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'Social Media' },
  { name: 'Facebook Post', width: 1200, height: 630, category: 'Social Media' },
  { name: 'Facebook Cover', width: 1200, height: 315, category: 'Social Media' },
  { name: 'Twitter Post', width: 1200, height: 675, category: 'Social Media' },
  { name: 'Twitter Header', width: 1500, height: 500, category: 'Social Media' },
  { name: 'LinkedIn Post', width: 1200, height: 627, category: 'Social Media' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, category: 'Social Media' },

  // Print
  { name: 'A4', width: 2480, height: 3508, category: 'Print' },
  { name: 'A3', width: 3508, height: 4961, category: 'Print' },
  { name: 'Letter', width: 2550, height: 3300, category: 'Print' },
  { name: 'Business Card', width: 1050, height: 600, category: 'Print' },
  { name: 'Poster (18x24)', width: 1800, height: 2400, category: 'Print' },

  // Web
  { name: 'Desktop (1920x1080)', width: 1920, height: 1080, category: 'Web' },
  { name: 'Desktop (1440x900)', width: 1440, height: 900, category: 'Web' },
  { name: 'Tablet (768x1024)', width: 768, height: 1024, category: 'Web' },
  { name: 'Mobile (375x667)', width: 375, height: 667, category: 'Web' },
  { name: 'Banner (728x90)', width: 728, height: 90, category: 'Web' },

  // Video
  { name: 'HD (1920x1080)', width: 1920, height: 1080, category: 'Video' },
  { name: '4K (3840x2160)', width: 3840, height: 2160, category: 'Video' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Video' },

  // Square
  { name: 'Square (1000x1000)', width: 1000, height: 1000, category: 'Square' },
  { name: 'Square (500x500)', width: 500, height: 500, category: 'Square' }
];

// Group presets by category
const PRESET_CATEGORIES = Array.from(new Set(PRESET_SIZES.map(preset => preset.category)));

export const ResizePanel: React.FC = () => {
  const { theme } = useTheme();
  const { canvasSize, setCanvasSize } = useCanvasStore();
  
  const [customWidth, setCustomWidth] = useState(canvasSize.width);
  const [customHeight, setCustomHeight] = useState(canvasSize.height);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Social Media');
  
  // Calculate aspect ratio
  const aspectRatio = canvasSize.width / canvasSize.height;

  // Update custom values when canvas size changes
  useEffect(() => {
    setCustomWidth(canvasSize.width);
    setCustomHeight(canvasSize.height);
  }, [canvasSize.width, canvasSize.height]);

  const handleWidthChange = (width: number) => {
    setCustomWidth(width);
    if (maintainAspectRatio) {
      const newHeight = Math.round(width / aspectRatio);
      setCustomHeight(newHeight);
    }
  };

  const handleHeightChange = (height: number) => {
    setCustomHeight(height);
    if (maintainAspectRatio) {
      const newWidth = Math.round(height * aspectRatio);
      setCustomWidth(newWidth);
    }
  };

  const applyCustomSize = () => {
    setCanvasSize({ width: customWidth, height: customHeight });
  };

  const applyPresetSize = (preset: any) => {
    setCanvasSize({ width: preset.width, height: preset.height });
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
  };

  const swapDimensions = () => {
    const newWidth = customHeight;
    const newHeight = customWidth;
    setCustomWidth(newWidth);
    setCustomHeight(newHeight);
    setCanvasSize({ width: newWidth, height: newHeight });
  };

  const resetToDefault = () => {
    const defaultSize = { width: 1200, height: 800 };
    setCanvasSize(defaultSize);
    setCustomWidth(defaultSize.width);
    setCustomHeight(defaultSize.height);
  };

  // Get current canvas orientation
  const isLandscape = canvasSize.width > canvasSize.height;
  const isSquare = canvasSize.width === canvasSize.height;
  const orientation = isSquare ? 'square' : isLandscape ? 'landscape' : 'portrait';

  // Filter presets by selected category
  const filteredPresets = PRESET_SIZES.filter(preset => preset.category === selectedCategory);

  // Format file size estimation (rough estimate based on canvas size)
  const estimateFileSize = (width: number, height: number): string => {
    const pixels = width * height;
    const bytesPerPixel = 4; // RGBA
    const bytes = pixels * bytesPerPixel;
    
    if (bytes < 1024 * 1024) {
      return `~${Math.round(bytes / 1024)}KB`;
    } else {
      return `~${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Current Canvas Info */}
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
          Current Canvas
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: theme.colors?.cardBg || '#394b59',
          padding: '12px',
          borderRadius: '6px',
          border: `1px solid ${theme.colors?.border || '#495563'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.colors?.textPrimary || '#f5f8fa'
            }}>
              {canvasSize.width} × {canvasSize.height}
            </span>
            <span style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              backgroundColor: theme.colors?.bg || '#30404d',
              padding: '2px 6px',
              borderRadius: '3px',
              textTransform: 'capitalize'
            }}>
              {orientation}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: theme.colors?.textSecondary || '#a7b6c2'
          }}>
            <span>Ratio: {(canvasSize.width / canvasSize.height).toFixed(2)}</span>
            <span>{estimateFileSize(canvasSize.width, canvasSize.height)}</span>
          </div>
        </div>
      </div>

      {/* Custom Size */}
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
          Custom Size
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Width and Height */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end' }}>
            <FormGroup label="Width">
              <NumericInput
                value={customWidth}
                onValueChange={handleWidthChange}
                min={100}
                max={10000}
                stepSize={10}
                fill
              />
            </FormGroup>
            
            <Button
              icon="swap-horizontal"
              minimal
              onClick={swapDimensions}
              title="Swap width and height"
              style={{ marginBottom: '0px' }}
            />
            
            <FormGroup label="Height">
              <NumericInput
                value={customHeight}
                onValueChange={handleHeightChange}
                min={100}
                max={10000}
                stepSize={10}
                fill
              />
            </FormGroup>
          </div>

          {/* Aspect Ratio Lock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Switch
              checked={maintainAspectRatio}
              onChange={(e) => setMaintainAspectRatio((e.target as HTMLInputElement).checked)}
              label="Lock aspect ratio"
              style={{ margin: 0 }}
            />
          </div>

          {/* Apply Button */}
          <Button
            onClick={applyCustomSize}
            disabled={customWidth === canvasSize.width && customHeight === canvasSize.height}
            fill
            intent="primary"
          >
            Apply Size
          </Button>
        </div>
      </div>

      {/* Preset Sizes */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 16px 0 16px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: theme.colors?.textPrimary || '#f5f8fa',
            marginBottom: '12px'
          }}>
            Preset Sizes
          </div>

          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {PRESET_CATEGORIES.map(category => (
              <Button
                key={category}
                text={category}
                small
                minimal
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  whiteSpace: 'nowrap',
                  minWidth: 'auto'
                }}
              />
            ))}
          </div>
        </div>

        {/* Presets List */}
        <div style={{
          flex: 1,
          padding: '0 16px 16px 16px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredPresets.map((preset, index) => {
              const isCurrent = preset.width === canvasSize.width && preset.height === canvasSize.height;
              
              return (
                <div
                  key={`${preset.category}-${index}`}
                  onClick={() => applyPresetSize(preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isCurrent ? (theme.colors?.primary || '#48aff0') + '20' : 'transparent',
                    border: isCurrent ? `1px solid ${theme.colors?.primary || '#48aff0'}` : '1px solid transparent',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = theme.colors?.cardBg || '#394b59';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: theme.colors?.textPrimary || '#f5f8fa',
                      marginBottom: '2px'
                    }}>
                      {preset.name}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: theme.colors?.textSecondary || '#a7b6c2'
                    }}>
                      {preset.width} × {preset.height} • {estimateFileSize(preset.width, preset.height)}
                    </div>
                  </div>
                  
                  {/* Aspect ratio indicator */}
                  <div style={{
                    width: '24px',
                    height: '18px',
                    backgroundColor: theme.colors?.textSecondary || '#a7b6c2',
                    borderRadius: '2px',
                    opacity: 0.6,
                    transform: preset.width > preset.height ? 'none' : 'rotate(90deg)'
                  }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={resetToDefault}
            icon="reset"
            fill
            small
          >
            Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
};

ResizePanel.displayName = 'ResizePanel';