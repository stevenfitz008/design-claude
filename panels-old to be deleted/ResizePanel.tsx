import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes  
import { Button, ButtonGroup, FormGroup, NumericInput, Divider, Switch, InputGroup, Tag, Popover, Intent, Spinner } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasResize } from '@/hooks/useCanvasResize';
// Custom debounce implementation to replace lodash-es dependency
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
import {
  searchPresets,
  getFavoritePresets,
  togglePresetFavorite,
  getRecentSizes,
  addRecentSize,
  getUsageStats,
  incrementPresetUsage,
  getMostUsedPresets,
  createPresetKey,
  estimateFileSize,
  getAspectRatioName,
  suggestSimilarPresets
} from '@/utils/presetUtils';
import '@/styles/resizePanel.css';

// Import icons from @meronex/icons for category tabs
import { 
  AiFillInstagram, AiOutlineFacebook, AiOutlineTwitter, 
  AiOutlineMobile, AiOutlinePrinter, AiOutlineDesktop, 
  AiOutlineVideoCamera, AiFillMobile
} from '@meronex/icons/ai';
import { 
  BilFacebook, BilInstagram, BilLinkedin, BilYoutube,
  BiGrid, BiMobileAlt
} from '@meronex/icons/bi';
import { FaPinterest, FaSnapchat, FaWhatsapp } from '@meronex/icons/fa';
import { SiTiktok } from '@meronex/icons/si';

// Enhanced preset sizes with comprehensive application types (2024 updated dimensions)
const PRESET_SIZES = [
  // Social Media - Updated for 2024 platform requirements
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'Social Media', platform: 'Instagram' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'Social Media', platform: 'Instagram' },
  { name: 'Instagram Reel', width: 1080, height: 1920, category: 'Social Media', platform: 'Instagram' },
  { name: 'Instagram Carousel', width: 1080, height: 1080, category: 'Social Media', platform: 'Instagram' },
  
  { name: 'Facebook Post', width: 1200, height: 630, category: 'Social Media', platform: 'Facebook' },
  { name: 'Facebook Story', width: 1080, height: 1920, category: 'Social Media', platform: 'Facebook' },
  { name: 'Facebook Cover', width: 1200, height: 315, category: 'Social Media', platform: 'Facebook' },
  { name: 'Facebook Event Cover', width: 1920, height: 1080, category: 'Social Media', platform: 'Facebook' },
  
  { name: 'Twitter Post', width: 1200, height: 675, category: 'Social Media', platform: 'Twitter' },
  { name: 'Twitter Header', width: 1500, height: 500, category: 'Social Media', platform: 'Twitter' },
  { name: 'Twitter Card', width: 1200, height: 628, category: 'Social Media', platform: 'Twitter' },
  
  { name: 'LinkedIn Post', width: 1200, height: 627, category: 'Social Media', platform: 'LinkedIn' },
  { name: 'LinkedIn Article', width: 1200, height: 627, category: 'Social Media', platform: 'LinkedIn' },
  { name: 'LinkedIn Cover', width: 1584, height: 396, category: 'Social Media', platform: 'LinkedIn' },
  { name: 'LinkedIn Company Cover', width: 1192, height: 220, category: 'Social Media', platform: 'LinkedIn' },
  
  { name: 'TikTok Video', width: 1080, height: 1920, category: 'Social Media', platform: 'TikTok' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Social Media', platform: 'YouTube' },
  { name: 'YouTube Banner', width: 2560, height: 1440, category: 'Social Media', platform: 'YouTube' },
  { name: 'YouTube Short', width: 1080, height: 1920, category: 'Social Media', platform: 'YouTube' },
  
  { name: 'Pinterest Pin', width: 1000, height: 1500, category: 'Social Media', platform: 'Pinterest' },
  { name: 'Pinterest Story Pin', width: 1080, height: 1920, category: 'Social Media', platform: 'Pinterest' },
  
  { name: 'Snapchat Ad', width: 1080, height: 1920, category: 'Social Media', platform: 'Snapchat' },
  { name: 'WhatsApp Status', width: 1080, height: 1920, category: 'Social Media', platform: 'WhatsApp' },

  // Print Materials - Professional printing dimensions
  { name: 'Business Card', width: 1050, height: 600, category: 'Print Materials', format: '3.5" × 2"' },
  { name: 'Business Card (EU)', width: 1063, height: 638, category: 'Print Materials', format: '85mm × 55mm' },
  { name: 'Postcard', width: 1800, height: 1200, category: 'Print Materials', format: '6" × 4"' },
  { name: 'Flyer (Letter)', width: 2550, height: 3300, category: 'Print Materials', format: '8.5" × 11"' },
  { name: 'Flyer (A4)', width: 2480, height: 3508, category: 'Print Materials', format: 'A4' },
  { name: 'Poster (11x17)', width: 3300, height: 5100, category: 'Print Materials', format: '11" × 17"' },
  { name: 'Poster (A3)', width: 3508, height: 4961, category: 'Print Materials', format: 'A3' },
  { name: 'Poster (18x24)', width: 5400, height: 7200, category: 'Print Materials', format: '18" × 24"' },
  { name: 'Brochure (Tri-fold)', width: 3300, height: 2550, category: 'Print Materials', format: '11" × 8.5"' },
  { name: 'Magazine Cover', width: 2550, height: 3300, category: 'Print Materials', format: '8.5" × 11"' },
  
  // Web Graphics - Updated for modern web standards
  { name: 'Web Banner (728x90)', width: 728, height: 90, category: 'Web Graphics', type: 'Leaderboard' },
  { name: 'Web Banner (300x250)', width: 300, height: 250, category: 'Web Graphics', type: 'Medium Rectangle' },
  { name: 'Web Banner (160x600)', width: 160, height: 600, category: 'Web Graphics', type: 'Skyscraper' },
  { name: 'Web Banner (320x50)', width: 320, height: 50, category: 'Web Graphics', type: 'Mobile Banner' },
  { name: 'Hero Image', width: 1920, height: 1080, category: 'Web Graphics', type: 'Hero Section' },
  { name: 'Blog Header', width: 1200, height: 600, category: 'Web Graphics', type: 'Featured Image' },
  { name: 'Email Header', width: 600, height: 200, category: 'Web Graphics', type: 'Email Template' },
  { name: 'Open Graph Image', width: 1200, height: 630, category: 'Web Graphics', type: 'Social Sharing' },
  { name: 'Favicon', width: 512, height: 512, category: 'Web Graphics', type: 'Icon' },
  
  // Video Content - Professional video formats
  { name: 'HD Video (16:9)', width: 1920, height: 1080, category: 'Video Content', format: '1080p' },
  { name: '4K Video (16:9)', width: 3840, height: 2160, category: 'Video Content', format: '4K UHD' },
  { name: 'Vertical Video (9:16)', width: 1080, height: 1920, category: 'Video Content', format: 'Mobile/Stories' },
  { name: 'Square Video (1:1)', width: 1080, height: 1080, category: 'Video Content', format: 'Social Square' },
  { name: 'Cinema (21:9)', width: 2560, height: 1080, category: 'Video Content', format: 'Ultrawide' },
  { name: 'YouTube End Screen', width: 1280, height: 720, category: 'Video Content', format: 'End Screen' },
  { name: 'Video Thumbnail', width: 1280, height: 720, category: 'Video Content', format: 'Preview' },
  
  // Marketing Materials - Campaign and presentation formats
  { name: 'Presentation Slide', width: 1920, height: 1080, category: 'Marketing Materials', format: '16:9' },
  { name: 'Presentation (4:3)', width: 1024, height: 768, category: 'Marketing Materials', format: '4:3' },
  { name: 'Infographic', width: 800, height: 2000, category: 'Marketing Materials', format: 'Vertical' },
  { name: 'Email Signature', width: 600, height: 200, category: 'Marketing Materials', format: 'Signature' },
  { name: 'Display Ad (Mobile)', width: 320, height: 480, category: 'Marketing Materials', format: 'Mobile Display' },
  { name: 'Display Ad (Desktop)', width: 970, height: 250, category: 'Marketing Materials', format: 'Billboard' },
  { name: 'Event Banner', width: 1920, height: 1080, category: 'Marketing Materials', format: 'Event' },
  { name: 'Zoom Background', width: 1920, height: 1080, category: 'Marketing Materials', format: 'Virtual Background' },
  
  // Device Mockups - Common screen sizes
  { name: 'iPhone 15 Pro', width: 1179, height: 2556, category: 'Device Mockups', device: 'Mobile' },
  { name: 'iPhone 15', width: 1179, height: 2556, category: 'Device Mockups', device: 'Mobile' },
  { name: 'Samsung Galaxy S24', width: 1080, height: 2340, category: 'Device Mockups', device: 'Mobile' },
  { name: 'iPad Pro 12.9"', width: 2048, height: 2732, category: 'Device Mockups', device: 'Tablet' },
  { name: 'iPad Air', width: 1640, height: 2360, category: 'Device Mockups', device: 'Tablet' },
  { name: 'MacBook Pro 14"', width: 3024, height: 1964, category: 'Device Mockups', device: 'Laptop' },
  { name: 'MacBook Air 13"', width: 2560, height: 1664, category: 'Device Mockups', device: 'Laptop' },
  { name: 'Desktop 4K', width: 3840, height: 2160, category: 'Device Mockups', device: 'Desktop' }
];

// Category configuration with icons and descriptions
const CATEGORY_CONFIG = {
  'Social Media': {
    icon: BilInstagram,
    description: 'Instagram, Facebook, Twitter, LinkedIn, TikTok, YouTube'
  },
  'Print Materials': {
    icon: AiOutlinePrinter,
    description: 'Business cards, flyers, posters, brochures'
  },
  'Web Graphics': {
    icon: AiOutlineDesktop,
    description: 'Banners, headers, blog images, email graphics'
  },
  'Video Content': {
    icon: AiOutlineVideoCamera,
    description: 'Video thumbnails, covers, presentations'
  },
  'Marketing Materials': {
    icon: BiGrid,
    description: 'Presentations, infographics, ads, campaigns'
  },
  'Device Mockups': {
    icon: BiMobileAlt,
    description: 'iPhone, iPad, MacBook, desktop screen sizes'
  }
};

// Group presets by platform/category
const PRESET_CATEGORIES = ['Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'TikTok', 'Pinterest'];

// Platform icons mapping
const PLATFORM_ICONS = {
  'Instagram': BilInstagram,
  'Facebook': BilFacebook,
  'YouTube': BilYoutube,
  'LinkedIn': BilLinkedin,
  'TikTok': SiTiktok,
  'Pinterest': FaPinterest
};

// Group presets by platform
const getPresetsByPlatform = (platform: string) => {
  return PRESET_SIZES.filter(preset => preset.platform === platform);
};

export const ResizePanel: React.FC = observer(() => {
  const { theme } = useTheme();
  const { canvasSize, setCanvasSize, pushHistory } = useCanvasStore();
  const { resizeWithTransition, isResizing, smartResize } = useCanvasResize();
  
  const [customWidth, setCustomWidth] = useState(canvasSize.width);
  const [customHeight, setCustomHeight] = useState(canvasSize.height);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Instagram');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritePresets, setFavoritePresets] = useState<Set<string>>(new Set());
  const [recentSizes, setRecentSizes] = useState<Array<{width: number, height: number, name: string, timestamp: number}>>([]);
  const [showCustomPresetDialog, setShowCustomPresetDialog] = useState(false);
  const [magicResizeEnabled, setMagicResizeEnabled] = useState(false);
  const [presetUsageStats, setPresetUsageStats] = useState<Map<string, number>>(new Map());
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  
  // Utility functions are now imported at the top

  // Calculate aspect ratio
  const aspectRatio = canvasSize.width / canvasSize.height;

  // Enhanced state management with localStorage persistence
  useEffect(() => {
    setCustomWidth(canvasSize.width);
    setCustomHeight(canvasSize.height);
  }, [canvasSize.width, canvasSize.height]);
  
  useEffect(() => {
    setFavoritePresets(getFavoritePresets());
    setRecentSizes(getRecentSizes());
    setPresetUsageStats(getUsageStats());
  }, []);

  // Enhanced debounced input handling (moved up to avoid hoisting issues)
  const debouncedWidthChange = useMemo(
    () => debounce((width: number) => {
      if (maintainAspectRatio) {
        const newHeight = Math.round(width / aspectRatio);
        setCustomHeight(newHeight);
      }
    }, 150),
    [aspectRatio, maintainAspectRatio]
  );

  const debouncedHeightChange = useMemo(
    () => debounce((height: number) => {
      if (maintainAspectRatio) {
        const newWidth = Math.round(height * aspectRatio);
        setCustomWidth(newWidth);
      }
    }, 150),
    [aspectRatio, maintainAspectRatio]
  );

  const handleWidthChange = useCallback((width: number) => {
    setCustomWidth(width);
    debouncedWidthChange(width);
  }, [debouncedWidthChange]);

  const handleHeightChange = useCallback((height: number) => {
    setCustomHeight(height);
    debouncedHeightChange(height);
  }, [debouncedHeightChange]);
  
  const toggleFavorite = useCallback((preset: any) => {
    const presetKey = createPresetKey(preset);
    setFavoritePresets(togglePresetFavorite(presetKey));
  }, []);

  const applyCustomSize = useCallback(async () => {
    const customSize = { width: customWidth, height: customHeight };
    
    // Add to recent sizes
    const recentSize = {
      width: customWidth,
      height: customHeight,
      name: `Custom ${customWidth}×${customHeight}`
    };
    setRecentSizes(addRecentSize(recentSize));
    
    // Apply resize with optional animation
    if (magicResizeEnabled) {
      await resizeWithTransition(customSize, { 
        animate: true, 
        duration: 400, 
        preserveElementPositions: true 
      });
    } else {
      setCanvasSize(customSize);
    }
  }, [customWidth, customHeight, magicResizeEnabled, resizeWithTransition, setCanvasSize]);

  const applyPresetSize = useCallback(async (preset: any) => {
    // Track usage
    const presetKey = createPresetKey(preset);
    incrementPresetUsage(presetKey);
    setPresetUsageStats(prev => new Map(prev.set(presetKey, (prev.get(presetKey) || 0) + 1)));
    
    // Add to recent sizes
    const recentSize = {
      width: preset.width,
      height: preset.height,
      name: preset.name
    };
    setRecentSizes(addRecentSize(recentSize));
    
    // Set selected preset
    setSelectedPreset(preset);
    
    // Apply resize with smooth transition
    if (magicResizeEnabled) {
      await resizeWithTransition(
        { width: preset.width, height: preset.height },
        { animate: true, duration: 400, preserveElementPositions: true }
      );
    } else {
      setCanvasSize({ width: preset.width, height: preset.height });
    }
    
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
  }, [magicResizeEnabled, resizeWithTransition, setCanvasSize]);

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

  // Enhanced preset filtering with search and favorites
  const filteredPresets = useMemo(() => {
    let presets = getPresetsByPlatform(selectedCategory);
    
    if (searchQuery.trim()) {
      presets = searchPresets(presets, searchQuery);
    }
    
    // Sort by favorites first, then by usage, then alphabetically
    return presets.sort((a, b) => {
      const aKey = createPresetKey(a);
      const bKey = createPresetKey(b);
      const aFavorite = favoritePresets.has(aKey) ? 1 : 0;
      const bFavorite = favoritePresets.has(bKey) ? 1 : 0;
      
      if (aFavorite !== bFavorite) {
        return bFavorite - aFavorite; // Favorites first
      }
      
      const aUsage = presetUsageStats.get(aKey) || 0;
      const bUsage = presetUsageStats.get(bKey) || 0;
      
      if (aUsage !== bUsage) {
        return bUsage - aUsage; // Most used first
      }
      
      return a.name.localeCompare(b.name); // Alphabetical
    });
  }, [selectedCategory, searchQuery, favoritePresets, presetUsageStats]);
  
  // Get current preset suggestions
  const currentPresetSuggestions = useMemo(() => {
    const currentPreset = {
      name: 'Current',
      width: canvasSize.width,
      height: canvasSize.height,
      category: 'Current'
    };
    return suggestSimilarPresets(currentPreset, PRESET_SIZES, 3);
  }, [canvasSize]);
  
  // Get most used presets
  const mostUsedPresets = useMemo(() => {
    return getMostUsedPresets(5).map(({ key }) => {
      return PRESET_SIZES.find(preset => createPresetKey(preset) === key);
    }).filter(Boolean);
  }, [presetUsageStats]);

  // Smart resize function
  const handleSmartResize = useCallback(async (targetSize: { width: number; height: number }) => {
    // Get container dimensions (this would normally come from a ref to the canvas container)
    const containerSize = { width: 1200, height: 800 }; // Default fallback
    
    await smartResize(targetSize, containerSize);
    setCustomWidth(targetSize.width);
    setCustomHeight(targetSize.height);
  }, [smartResize]);

  return (
    <div className={`resize-panel-container ${isResizing ? 'resize-panel-loading' : ''}`}>
      {/* Loading Indicator for Magic Resize */}
      {isResizing && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(47, 52, 60, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Spinner size={24} intent="primary" />
            <div style={{
              fontSize: '12px',
              color: theme.colors?.textPrimary || '#f5f8fa',
              fontWeight: 500
            }}>
              {magicResizeEnabled ? 'Magic Resize...' : 'Resizing Canvas...'}
            </div>
          </div>
        </div>
      )}
      
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '16px'
      }}>    
        
        {/* Magic Resize Toggle - More Compact */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '16px',
              color: '#f5f8fa',
              fontWeight: 400
            }}>
              Use magic resize
            </span>
            <Button
              icon="help"
              minimal
              small
              style={{
                color: '#a7b6c2',
                minWidth: '20px',
                width: '20px',
                height: '20px'
              }}
              title="Magic resize intelligently repositions elements when changing canvas size"
            />
          </div>
          
          {/* Custom Toggle */}
          <div
            onClick={() => setMagicResizeEnabled(!magicResizeEnabled)}
            style={{
              width: '44px',
              height: '24px',
              backgroundColor: magicResizeEnabled ? '#48aff0' : '#495563',
              borderRadius: '12px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: magicResizeEnabled ? '1px solid #48aff0' : '1px solid #495563'
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: magicResizeEnabled ? '22px' : '2px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            />
          </div>
        </div>
        {/* Custom Input Controls - More Compact */}
        <div style={{ marginBottom: '16px' }}>
          {/* Width */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              color: '#f5f8fa',
              marginBottom: '8px',
              fontWeight: 400
            }}>Width (px)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                min={100}
                max={10000}
                style={{
                  flex: 1,
                  height: '40px',
                  padding: '0 12px',
                  backgroundColor: '#2f343c',
                  border: '1px solid #495563',
                  borderRadius: '6px 0 0 6px',
                  color: '#f5f8fa',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #495563',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0',
                backgroundColor: '#394b59'
              }}>
                <button
                  onClick={() => handleWidthChange(customWidth + 10)}
                  style={{
                    width: '24px',
                    height: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#a7b6c2',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => handleWidthChange(customWidth - 10)}
                  style={{
                    width: '24px',
                    height: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderTop: '1px solid #495563',
                    color: '#a7b6c2',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          
          {/* Height */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              color: '#f5f8fa',
              marginBottom: '8px',
              fontWeight: 400
            }}>Height (px)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                min={100}
                max={10000}
                style={{
                  flex: 1,
                  height: '40px',
                  padding: '0 12px',
                  backgroundColor: '#2f343c',
                  border: '1px solid #495563',
                  borderRadius: '6px 0 0 6px',
                  color: '#f5f8fa',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #495563',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0',
                backgroundColor: '#394b59'
              }}>
                <button
                  onClick={() => handleHeightChange(customHeight + 10)}
                  style={{
                    width: '24px',
                    height: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#a7b6c2',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => handleHeightChange(customHeight - 10)}
                  style={{
                    width: '24px',
                    height: '20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderTop: '1px solid #495563',
                    color: '#a7b6c2',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          
          {/* Units Dropdown */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              color: '#f5f8fa',
              marginBottom: '8px',
              fontWeight: 400
            }}>Units</label>
            <div style={{
              height: '40px',
              padding: '0 12px',
              backgroundColor: '#2f343c',
              border: '1px solid #495563',
              borderRadius: '6px',
              color: '#f5f8fa',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'not-allowed',
              opacity: 0.8
            }}>
              <span>px</span>
              <span style={{ color: '#a7b6c2' }}>▼</span>
            </div>
          </div>
          
          {/* Large Blue Resize Button */}
          <button
            onClick={applyCustomSize}
            disabled={customWidth === canvasSize.width && customHeight === canvasSize.height || isResizing}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: '#48aff0',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 500,
              cursor: isResizing ? 'not-allowed' : 'pointer',
              opacity: (customWidth === canvasSize.width && customHeight === canvasSize.height) || isResizing ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isResizing ? 'Resizing...' : 'Resize'}
          </button>
        </div>

      
        {/* Platform Sections */}
        <div 
          className="resize-panel-scroll-y"
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '4px', // Account for scrollbar width
            marginRight: '-4px'  // Offset to maintain layout
          }}
        >
          {PRESET_CATEGORIES.map(platform => {
            const platformPresets = getPresetsByPlatform(platform);
            const IconComponent = PLATFORM_ICONS[platform];
            
            if (platformPresets.length === 0) return null;
            
            return (
              <div key={platform} style={{ marginBottom: '20px' }}>
                {/* Platform Header - More Compact */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#f5f8fa'
                }}>
                  {IconComponent && <IconComponent size={20} />}
                  <span>{platform}</span>
                </div>
                
                {/* Platform Presets Grid - More Compact */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  {platformPresets.map((preset, index) => {
                    const isSelected = selectedPreset?.name === preset.name;
                    const isCurrent = preset.width === canvasSize.width && preset.height === canvasSize.height;
                    
                    return (
                      <div
                        key={`${platform}-${index}`}
                        onClick={() => applyPresetSize(preset)}
                        style={{
                          padding: '12px 8px',
                          backgroundColor: isSelected || isCurrent ? 'transparent' : '#2f343c',
                          border: isSelected || isCurrent ? '2px solid #48aff0' : '1px solid #495563',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && !isCurrent) {
                            e.currentTarget.style.backgroundColor = '#394b59';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && !isCurrent) {
                            e.currentTarget.style.backgroundColor = '#2f343c';
                          }
                        }}
                      >
                        {/* Platform Icon - Smaller */}
                        {IconComponent && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '4px'
                          }}>
                            <IconComponent size={24} color={isSelected || isCurrent ? '#48aff0' : '#a7b6c2'} />
                          </div>
                        )}
                        
                        {/* Preset Name - More Compact */}
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: isSelected || isCurrent ? '#48aff0' : '#f5f8fa',
                          marginBottom: '2px',
                          lineHeight: '1.2',
                          textAlign: 'center'
                        }}>
                          {preset.name.replace(`${platform} `, '')}
                        </div>
                        
                        {/* Dimensions - Smaller */}
                        <div style={{
                          fontSize: '10px',
                          color: '#a7b6c2',
                          lineHeight: '1.2'
                        }}>
                          {preset.width}×{preset.height} px
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ResizePanel.displayName = 'ResizePanel';

export default ResizePanel;