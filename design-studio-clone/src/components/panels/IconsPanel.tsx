import React, { useState, useMemo } from 'react';
import { Button } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { usePanelStore } from '@/stores/panelStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { IconRenderer } from '@/components/common/IconRenderer';

// Icon categories with popular icons for each category
const ICON_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'business', label: 'Business' },
  { value: 'communication', label: 'Communication' },
  { value: 'media', label: 'Media' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'social', label: 'Social' },
  { value: 'technology', label: 'Technology' },
  { value: 'weather', label: 'Weather' },
  { value: 'editing', label: 'Editing' }
];

// Comprehensive icon data with 100+ icons organized by category
const MOCK_ICONS = [
  // Business Icons
  { id: 'chart', name: 'Chart', icon: 'chart', category: 'business', tags: ['graph', 'data', 'analytics'] },
  { id: 'dollar', name: 'Dollar', icon: 'dollar', category: 'business', tags: ['money', 'price', 'cost'] },
  { id: 'office', name: 'Office', icon: 'office', category: 'business', tags: ['building', 'work'] },
  { id: 'briefcase', name: 'Briefcase', icon: 'briefcase', category: 'business', tags: ['work', 'job'] },
  { id: 'trending-up', name: 'Trending Up', icon: 'trending-up', category: 'business', tags: ['growth', 'analytics', 'increase'] },
  { id: 'trending-down', name: 'Trending Down', icon: 'trending-down', category: 'business', tags: ['decline', 'analytics', 'decrease'] },
  { id: 'bar-chart', name: 'Bar Chart', icon: 'bar-chart', category: 'business', tags: ['data', 'analytics', 'graph'] },
  { id: 'pie-chart', name: 'Pie Chart', icon: 'pie-chart', category: 'business', tags: ['data', 'analytics', 'statistics'] },
  { id: 'activity', name: 'Activity', icon: 'activity', category: 'business', tags: ['analytics', 'metrics', 'tracking'] },
  { id: 'calculator', name: 'Calculator', icon: 'calculator', category: 'business', tags: ['math', 'finance', 'calculate'] },
  { id: 'credit-card', name: 'Credit Card', icon: 'credit-card', category: 'business', tags: ['payment', 'finance', 'money'] },
  { id: 'percent', name: 'Percent', icon: 'percent', category: 'business', tags: ['percentage', 'math', 'statistics'] },
  
  // Communication Icons
  { id: 'envelope', name: 'Envelope', icon: 'envelope', category: 'communication', tags: ['email', 'mail', 'message'] },
  { id: 'phone', name: 'Phone', icon: 'phone', category: 'communication', tags: ['call', 'contact'] },
  { id: 'chat', name: 'Chat', icon: 'chat', category: 'communication', tags: ['message', 'talk'] },
  { id: 'comment', name: 'Comment', icon: 'comment', category: 'communication', tags: ['feedback', 'reply'] },
  { id: 'mail-open', name: 'Mail Open', icon: 'mail-open', category: 'communication', tags: ['email', 'message', 'read'] },
  { id: 'message-circle', name: 'Message Circle', icon: 'message-circle', category: 'communication', tags: ['chat', 'talk', 'bubble'] },
  { id: 'message-square', name: 'Message Square', icon: 'message-square', category: 'communication', tags: ['chat', 'talk', 'bubble'] },
  { id: 'phone-call', name: 'Phone Call', icon: 'phone-call', category: 'communication', tags: ['call', 'contact', 'dial'] },
  { id: 'voicemail', name: 'Voicemail', icon: 'voicemail', category: 'communication', tags: ['phone', 'message', 'audio'] },
  { id: 'headphones', name: 'Headphones', icon: 'headphones', category: 'communication', tags: ['audio', 'listen', 'sound'] },
  { id: 'mic', name: 'Microphone', icon: 'mic', category: 'communication', tags: ['audio', 'record', 'voice'] },
  { id: 'speaker', name: 'Speaker', icon: 'speaker', category: 'communication', tags: ['audio', 'sound', 'music'] },
  
  // Media Icons
  { id: 'camera', name: 'Camera', icon: 'camera', category: 'media', tags: ['photo', 'picture'] },
  { id: 'video', name: 'Video', icon: 'video', category: 'media', tags: ['movie', 'film'] },
  { id: 'music', name: 'Music', icon: 'music', category: 'media', tags: ['audio', 'sound'] },
  { id: 'play', name: 'Play', icon: 'play', category: 'media', tags: ['start', 'begin'] },
  { id: 'pause', name: 'Pause', icon: 'pause', category: 'media', tags: ['stop', 'halt'] },
  { id: 'stop', name: 'Stop', icon: 'stop', category: 'media', tags: ['end', 'halt'] },
  { id: 'skip-back', name: 'Skip Back', icon: 'skip-back', category: 'media', tags: ['previous', 'rewind'] },
  { id: 'skip-forward', name: 'Skip Forward', icon: 'skip-forward', category: 'media', tags: ['next', 'advance'] },
  { id: 'rewind', name: 'Rewind', icon: 'rewind', category: 'media', tags: ['back', 'reverse'] },
  { id: 'fast-forward', name: 'Fast Forward', icon: 'fast-forward', category: 'media', tags: ['forward', 'advance'] },
  { id: 'volume', name: 'Volume', icon: 'volume', category: 'media', tags: ['audio', 'sound', 'speaker'] },
  { id: 'volume-off', name: 'Volume Off', icon: 'volume-off', category: 'media', tags: ['mute', 'silent'] },
  { id: 'volume-low', name: 'Volume Low', icon: 'volume-low', category: 'media', tags: ['quiet', 'soft'] },
  { id: 'volume-high', name: 'Volume High', icon: 'volume-high', category: 'media', tags: ['loud', 'max'] },
  { id: 'radio', name: 'Radio', icon: 'radio', category: 'media', tags: ['broadcast', 'signal'] },
  { id: 'film', name: 'Film', icon: 'film', category: 'media', tags: ['movie', 'cinema'] },
  
  // Navigation Icons
  { id: 'arrow-up', name: 'Arrow Up', icon: 'arrow-up', category: 'navigation', tags: ['direction', 'move'] },
  { id: 'arrow-down', name: 'Arrow Down', icon: 'arrow-down', category: 'navigation', tags: ['direction', 'move'] },
  { id: 'arrow-left', name: 'Arrow Left', icon: 'arrow-left', category: 'navigation', tags: ['direction', 'back'] },
  { id: 'arrow-right', name: 'Arrow Right', icon: 'arrow-right', category: 'navigation', tags: ['direction', 'forward'] },
  { id: 'menu', name: 'Menu', icon: 'menu', category: 'navigation', tags: ['hamburger', 'list'] },
  { id: 'home', name: 'Home', icon: 'home', category: 'navigation', tags: ['house', 'main'] },
  { id: 'compass', name: 'Compass', icon: 'compass', category: 'navigation', tags: ['direction', 'location'] },
  { id: 'navigation', name: 'Navigation', icon: 'navigation', category: 'navigation', tags: ['direction', 'pointer'] },
  { id: 'map-pin', name: 'Map Pin', icon: 'map-pin', category: 'navigation', tags: ['location', 'marker'] },
  { id: 'map', name: 'Map', icon: 'map', category: 'navigation', tags: ['location', 'geography'] },
  { id: 'move', name: 'Move', icon: 'move', category: 'navigation', tags: ['drag', 'reposition'] },
  { id: 'corner-down-right', name: 'Corner Down Right', icon: 'corner-down-right', category: 'navigation', tags: ['turn', 'direction'] },
  { id: 'corner-up-left', name: 'Corner Up Left', icon: 'corner-up-left', category: 'navigation', tags: ['turn', 'direction'] },
  { id: 'crosshair', name: 'Crosshair', icon: 'crosshair', category: 'navigation', tags: ['target', 'aim'] },
  
  // Social Icons
  { id: 'heart', name: 'Heart', icon: 'heart', category: 'social', tags: ['like', 'love'] },
  { id: 'star', name: 'Star', icon: 'star', category: 'social', tags: ['favorite', 'rating'] },
  { id: 'thumbs-up', name: 'Thumbs Up', icon: 'thumbs-up', category: 'social', tags: ['like', 'approve'] },
  { id: 'share', name: 'Share', icon: 'share', category: 'social', tags: ['distribute', 'send'] },
  { id: 'bookmark', name: 'Bookmark', icon: 'bookmark', category: 'social', tags: ['save', 'favorite'] },
  { id: 'gift', name: 'Gift', icon: 'gift', category: 'social', tags: ['present', 'reward'] },
  { id: 'award', name: 'Award', icon: 'award', category: 'social', tags: ['achievement', 'prize'] },
  { id: 'trophy', name: 'Trophy', icon: 'trophy', category: 'social', tags: ['winner', 'achievement'] },
  { id: 'medal', name: 'Medal', icon: 'medal', category: 'social', tags: ['achievement', 'award'] },
  { id: 'flag', name: 'Flag', icon: 'flag', category: 'social', tags: ['marker', 'important'] },
  
  // Technology Icons
  { id: 'desktop', name: 'Desktop', icon: 'desktop', category: 'technology', tags: ['computer', 'screen'] },
  { id: 'mobile-phone', name: 'Mobile Phone', icon: 'mobile-phone', category: 'technology', tags: ['smartphone', 'device'] },
  { id: 'cloud', name: 'Cloud', icon: 'cloud', category: 'technology', tags: ['storage', 'online'] },
  { id: 'database', name: 'Database', icon: 'database', category: 'technology', tags: ['data', 'storage'] },
  { id: 'smartphone', name: 'Smartphone', icon: 'smartphone', category: 'technology', tags: ['mobile', 'device'] },
  { id: 'tablet', name: 'Tablet', icon: 'tablet', category: 'technology', tags: ['device', 'mobile'] },
  { id: 'laptop', name: 'Laptop', icon: 'laptop', category: 'technology', tags: ['computer', 'portable'] },
  { id: 'monitor', name: 'Monitor', icon: 'monitor', category: 'technology', tags: ['screen', 'display'] },
  { id: 'server', name: 'Server', icon: 'server', category: 'technology', tags: ['computer', 'hosting'] },
  { id: 'hard-drive', name: 'Hard Drive', icon: 'hard-drive', category: 'technology', tags: ['storage', 'disk'] },
  { id: 'cpu', name: 'CPU', icon: 'cpu', category: 'technology', tags: ['processor', 'chip'] },
  { id: 'wifi', name: 'WiFi', icon: 'wifi', category: 'technology', tags: ['internet', 'wireless'] },
  { id: 'bluetooth', name: 'Bluetooth', icon: 'bluetooth', category: 'technology', tags: ['wireless', 'connection'] },
  { id: 'battery', name: 'Battery', icon: 'battery', category: 'technology', tags: ['power', 'energy'] },
  { id: 'power', name: 'Power', icon: 'power', category: 'technology', tags: ['energy', 'electricity'] },
  
  // Weather Icons
  { id: 'cloud-snow', name: 'Snow', icon: 'cloud-snow', category: 'weather', tags: ['cold', 'winter'] },
  { id: 'flash', name: 'Lightning', icon: 'flash', category: 'weather', tags: ['storm', 'thunder'] },
  { id: 'sun', name: 'Sun', icon: 'sun', category: 'weather', tags: ['sunny', 'bright'] },
  { id: 'moon', name: 'Moon', icon: 'moon', category: 'weather', tags: ['night', 'dark'] },
  { id: 'sunrise', name: 'Sunrise', icon: 'sunrise', category: 'weather', tags: ['morning', 'dawn'] },
  { id: 'sunset', name: 'Sunset', icon: 'sunset', category: 'weather', tags: ['evening', 'dusk'] },
  { id: 'wind', name: 'Wind', icon: 'wind', category: 'weather', tags: ['breeze', 'air'] },
  { id: 'umbrella', name: 'Umbrella', icon: 'umbrella', category: 'weather', tags: ['rain', 'protection'] },
  { id: 'thermometer', name: 'Thermometer', icon: 'thermometer', category: 'weather', tags: ['temperature', 'heat'] },
  { id: 'droplet', name: 'Droplet', icon: 'droplet', category: 'weather', tags: ['water', 'rain'] },
  { id: 'leaf', name: 'Leaf', icon: 'leaf', category: 'weather', tags: ['nature', 'plant'] },
  
  // Editing Icons
  { id: 'edit', name: 'Edit', icon: 'edit', category: 'editing', tags: ['modify', 'change'] },
  { id: 'trash', name: 'Trash', icon: 'trash', category: 'editing', tags: ['delete', 'remove'] },
  { id: 'duplicate', name: 'Duplicate', icon: 'duplicate', category: 'editing', tags: ['copy', 'clone'] },
  { id: 'undo', name: 'Undo', icon: 'undo', category: 'editing', tags: ['revert', 'back'] },
  { id: 'redo', name: 'Redo', icon: 'redo', category: 'editing', tags: ['forward', 'repeat'] },
  { id: 'cut', name: 'Cut', icon: 'cut', category: 'editing', tags: ['scissors', 'remove'] },
  { id: 'copy', name: 'Copy', icon: 'copy', category: 'editing', tags: ['duplicate', 'clone'] },
  { id: 'paste', name: 'Paste', icon: 'paste', category: 'editing', tags: ['insert', 'clipboard'] },
  { id: 'scissors', name: 'Scissors', icon: 'scissors', category: 'editing', tags: ['cut', 'trim'] },
  { id: 'clipboard', name: 'Clipboard', icon: 'clipboard', category: 'editing', tags: ['copy', 'paste'] },
  { id: 'paperclip', name: 'Paperclip', icon: 'paperclip', category: 'editing', tags: ['attach', 'link'] },
  { id: 'link', name: 'Link', icon: 'link', category: 'editing', tags: ['connect', 'url'] },
  { id: 'unlink', name: 'Unlink', icon: 'unlink', category: 'editing', tags: ['disconnect', 'break'] },
  { id: 'layers', name: 'Layers', icon: 'layers', category: 'editing', tags: ['stack', 'organize'] },
  
  // Additional Icons
  { id: 'document', name: 'Document', icon: 'document', category: 'editing', tags: ['file', 'text'] },
  { id: 'folder', name: 'Folder', icon: 'folder', category: 'editing', tags: ['directory', 'organize'] },
  { id: 'folder-open', name: 'Folder Open', icon: 'folder-open', category: 'editing', tags: ['directory', 'access'] },
  { id: 'save', name: 'Save', icon: 'save', category: 'editing', tags: ['store', 'keep'] },
  { id: 'download', name: 'Download', icon: 'download', category: 'editing', tags: ['save', 'get'] },
  { id: 'upload', name: 'Upload', icon: 'upload', category: 'editing', tags: ['send', 'share'] },
  { id: 'print', name: 'Print', icon: 'print', category: 'editing', tags: ['output', 'paper'] },
  { id: 'user', name: 'User', icon: 'user', category: 'social', tags: ['person', 'account'] },
  { id: 'users', name: 'Users', icon: 'users', category: 'social', tags: ['people', 'group'] },
  { id: 'person', name: 'Person', icon: 'person', category: 'social', tags: ['user', 'individual'] },
  { id: 'account-circle', name: 'Account Circle', icon: 'account-circle', category: 'social', tags: ['user', 'profile'] },
  { id: 'settings', name: 'Settings', icon: 'settings', category: 'technology', tags: ['config', 'options'] },
  { id: 'cog', name: 'Cog', icon: 'cog', category: 'technology', tags: ['settings', 'gear'] },
  { id: 'lock', name: 'Lock', icon: 'lock', category: 'technology', tags: ['secure', 'private'] },
  { id: 'unlock', name: 'Unlock', icon: 'unlock', category: 'technology', tags: ['open', 'access'] },
  { id: 'key', name: 'Key', icon: 'key', category: 'technology', tags: ['access', 'security'] },
  { id: 'time', name: 'Time', icon: 'time', category: 'editing', tags: ['clock', 'schedule'] },
  { id: 'clock', name: 'Clock', icon: 'clock', category: 'editing', tags: ['time', 'schedule'] },
  { id: 'calendar', name: 'Calendar', icon: 'calendar', category: 'editing', tags: ['date', 'schedule'] },
  { id: 'date-range', name: 'Date Range', icon: 'date-range', category: 'editing', tags: ['calendar', 'period'] },
  { id: 'shopping-cart', name: 'Shopping Cart', icon: 'shopping-cart', category: 'business', tags: ['buy', 'purchase'] },
  { id: 'shopping-bag', name: 'Shopping Bag', icon: 'shopping-bag', category: 'business', tags: ['purchase', 'retail'] },
  { id: 'receipt', name: 'Receipt', icon: 'receipt', category: 'business', tags: ['bill', 'invoice'] },
  { id: 'location', name: 'Location', icon: 'location', category: 'navigation', tags: ['place', 'position'] },
  { id: 'globe', name: 'Globe', icon: 'globe', category: 'navigation', tags: ['world', 'earth'] },
  { id: 'health', name: 'Health', icon: 'health', category: 'social', tags: ['medical', 'wellness'] },
  { id: 'heart-pulse', name: 'Heart Pulse', icon: 'heart-pulse', category: 'social', tags: ['health', 'medical'] },
  { id: 'plus-circle', name: 'Plus Circle', icon: 'plus-circle', category: 'editing', tags: ['add', 'create'] },
  { id: 'minus-circle', name: 'Minus Circle', icon: 'minus-circle', category: 'editing', tags: ['remove', 'subtract'] },
  { id: 'search', name: 'Search', icon: 'search', category: 'navigation', tags: ['find', 'look'] },
  { id: 'zoom-in', name: 'Zoom In', icon: 'zoom-in', category: 'navigation', tags: ['magnify', 'enlarge'] },
  { id: 'zoom-out', name: 'Zoom Out', icon: 'zoom-out', category: 'navigation', tags: ['reduce', 'shrink'] },
  { id: 'filter', name: 'Filter', icon: 'filter', category: 'navigation', tags: ['sort', 'organize'] },
  { id: 'info', name: 'Info', icon: 'info', category: 'navigation', tags: ['information', 'help'] },
  { id: 'warning', name: 'Warning', icon: 'warning', category: 'navigation', tags: ['alert', 'caution'] },
  { id: 'error', name: 'Error', icon: 'error', category: 'navigation', tags: ['problem', 'issue'] },
  { id: 'check-circle', name: 'Check Circle', icon: 'check-circle', category: 'navigation', tags: ['success', 'done'] },
  { id: 'x-circle', name: 'X Circle', icon: 'x-circle', category: 'navigation', tags: ['close', 'cancel'] },
  { id: 'car', name: 'Car', icon: 'car', category: 'navigation', tags: ['vehicle', 'transport'] },
  { id: 'plane', name: 'Plane', icon: 'plane', category: 'navigation', tags: ['aircraft', 'travel'] },
  { id: 'train', name: 'Train', icon: 'train', category: 'navigation', tags: ['railway', 'transport'] },
  { id: 'truck', name: 'Truck', icon: 'truck', category: 'navigation', tags: ['vehicle', 'delivery'] },
  { id: 'ship', name: 'Ship', icon: 'ship', category: 'navigation', tags: ['boat', 'sea'] },
  { id: 'bike', name: 'Bike', icon: 'bike', category: 'navigation', tags: ['bicycle', 'transport'] },
  { id: 'helicopter', name: 'Helicopter', icon: 'helicopter', category: 'navigation', tags: ['aircraft', 'fly'] }
];


export const IconsPanel: React.FC = () => {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = usePanelStore();
  const { addElement } = useCanvasStore();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredIcons = useMemo(() => {
    return MOCK_ICONS.filter(icon => {
      // Category filter
      if (selectedCategory !== 'all' && icon.category !== selectedCategory) {
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
      type: 'icon' as const,
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
      iconName: icon.icon,
      iconSet: 'blueprint',
      fill: '#000000',
      stroke: 'transparent',
      strokeWidth: 0
    };
    
    addElement(element);
  };

  return (
    <div 
      className="icons-panel-container"
      style={{
        height: '100%',
        width: '100%',
        background: '#2f343c',
        color: '#f5f8fa',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        .icons-panel-container .bp4-icon {
          color: #ffffff !important;
          fill: #ffffff !important;
        }
        .icons-panel-container .bp4-icon:hover {
          color: #48aff0 !important;
          fill: #48aff0 !important;
        }
      `}</style>
      {/* Search Bar */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #495563'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            color: '#8a9ba8',
            fontSize: '16px',
            flexShrink: 0,
            paddingLeft: '2px'
          }}>
            🔍
          </div>
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>
        
        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '2px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {ICON_CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: selectedCategory === category.value ? '#48aff0' : 'transparent',
                color: selectedCategory === category.value ? 'white' : '#a7b6c2',
                border: selectedCategory === category.value ? '1px solid #48aff0' : '1px solid #495563',
                borderRadius: '16px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.value) {
                  e.currentTarget.style.backgroundColor = 'rgba(72, 175, 240, 0.1)';
                  e.currentTarget.style.borderColor = '#48aff0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#495563';
                }
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Icons Grid with Enhanced Scrolling */}
      <div 
        style={{
          position: 'absolute',
          top: '120px', // Account for search bar and tabs
          bottom: '0px',
          left: '0px',
          right: '0px',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          boxSizing: 'border-box'
        }}
      >
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
            gap: '8px'
          }}>
            {filteredIcons.map((icon) => (
              <div
                key={icon.id}
                onClick={() => handleIconClick(icon)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title={`${icon.name} - ${icon.category}`}
                role="button"
                tabIndex={0}
                aria-label={`Add ${icon.name} icon`}
              >
                <IconRenderer 
                  iconName={icon.icon} 
                  size={28}
                  style={{
                    transition: 'all 0.2s ease-out',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'scale(1.2)';
                    target.style.filter = 'drop-shadow(0 2px 8px rgba(72, 175, 240, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'scale(1)';
                    target.style.filter = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

IconsPanel.displayName = 'IconsPanel';