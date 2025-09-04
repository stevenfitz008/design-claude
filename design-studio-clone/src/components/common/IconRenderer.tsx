import React from 'react';
import { Icon as BlueprintIcon } from '@blueprintjs/core';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  iconName: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
}

// CSS class for forcing white color on icons
const iconWhiteStyle = {
  color: '#f5f8fa',
  fill: '#f5f8fa',
  stroke: '#f5f8fa'
};

// Icon name mapping from our icon names to Lucide React names
const LUCIDE_ICON_MAP: Record<string, string> = {
  // Business Icons
  'bar-chart': 'BarChart3',
  'pie-chart': 'PieChart', 
  'activity': 'Activity',
  'trending-up': 'TrendingUp',
  'trending-down': 'TrendingDown',
  'percent': 'Percent',
  'calculator': 'Calculator',
  'credit-card': 'CreditCard',
  'shopping-cart': 'ShoppingCart',
  'shopping-bag': 'ShoppingBag',
  'receipt': 'Receipt',
  
  // Communication Icons
  'mail-open': 'MailOpen',
  'message-circle': 'MessageCircle',
  'message-square': 'MessageSquare',
  'phone-call': 'PhoneCall',
  'voicemail': 'Voicemail',
  'headphones': 'Headphones',
  'mic': 'Mic',
  'speaker': 'Volume2',
  
  // Media Icons
  'skip-back': 'SkipBack',
  'skip-forward': 'SkipForward',
  'rewind': 'Rewind',
  'fast-forward': 'FastForward',
  'volume': 'Volume2',
  'volume-off': 'VolumeX',
  'volume-low': 'Volume1',
  'volume-high': 'Volume2',
  'radio': 'Radio',
  'film': 'Film',
  
  // Navigation Icons
  'navigation': 'Navigation',
  'map-pin': 'MapPin',
  'corner-down-right': 'CornerDownRight',
  'corner-up-left': 'CornerUpLeft',
  'crosshair': 'Crosshair',
  'arrow-up': 'ArrowUp',
  'arrow-down': 'ArrowDown',
  'arrow-left': 'ArrowLeft', 
  'arrow-right': 'ArrowRight',
  'zoom-in': 'ZoomIn',
  'zoom-out': 'ZoomOut',
  
  // Social Icons
  'gift': 'Gift',
  'award': 'Award',
  'medal': 'Medal',
  'bookmark': 'Bookmark',
  'thumbs-up': 'ThumbsUp',
  
  // Technology Icons
  'smartphone': 'Smartphone',
  'tablet': 'Tablet',
  'laptop': 'Laptop',
  'monitor': 'Monitor',
  'hard-drive': 'HardDrive',
  'cpu': 'Cpu',
  'wifi': 'Wifi',
  'bluetooth': 'Bluetooth',
  'battery': 'Battery',
  'server': 'Server',
  'power': 'Power',
  
  // Weather Icons
  'cloud-snow': 'CloudSnow',
  'sun': 'Sun',
  'moon': 'Moon',
  'sunrise': 'Sunrise',
  'sunset': 'Sunset',
  'wind': 'Wind',
  'umbrella': 'Umbrella',
  'thermometer': 'Thermometer',
  'droplet': 'Droplet',
  'leaf': 'Leaf',
  
  // Editing Icons
  'copy': 'Copy',
  'paste': 'Clipboard',
  'scissors': 'Scissors',
  'paperclip': 'Paperclip',
  'link': 'Link',
  'unlink': 'Unlink',
  'layers': 'Layers',
  'folder': 'Folder',
  'folder-open': 'FolderOpen',
  'save': 'Save',
  'download': 'Download',
  'upload': 'Upload',
  'print': 'Printer',
  
  // User & Account Icons
  'users': 'Users',
  'account-circle': 'UserCircle',
  'person': 'User',
  
  // Time & Calendar Icons
  'clock': 'Clock',
  'date-range': 'CalendarDays',
  'time': 'Clock',
  
  // Status & Alert Icons
  'plus-circle': 'PlusCircle',
  'minus-circle': 'MinusCircle',
  'info': 'Info',
  'warning': 'AlertTriangle',
  'error': 'AlertCircle',
  'check-circle': 'CheckCircle',
  'x-circle': 'XCircle',
  
  // Transport Icons
  'car': 'Car',
  'plane': 'Plane',
  'train': 'Train',
  'truck': 'Truck',
  'ship': 'Ship',
  'bike': 'Bike',
  'helicopter': 'Plane', // Using Plane as fallback
  
  // Additional Icons
  'location': 'MapPin',
  'globe': 'Globe',
  'health': 'Activity',
  'heart-pulse': 'HeartHandshake'
};

// Blueprint.js icons that we want to keep using
const BLUEPRINT_ICONS = [
  'chart', 'dollar', 'office', 'briefcase', 'envelope', 'phone', 'chat', 'comment',
  'camera', 'video', 'music', 'play', 'pause', 'stop', 'menu', 'home', 'compass', 'map', 'move',
  'heart', 'star', 'share', 'flag', 'desktop', 'mobile-phone', 'cloud', 'database', 'flash',
  'edit', 'trash', 'duplicate', 'undo', 'redo', 'cut', 'clipboard', 'document', 'user',
  'settings', 'cog', 'lock', 'unlock', 'key', 'calendar', 'search', 'filter'
];

export const IconRenderer: React.FC<IconRendererProps> = ({
  iconName,
  size = 28,
  className = '',
  style = {},
  onMouseEnter,
  onMouseLeave
}) => {
  // Check if it's a Blueprint icon first
  if (BLUEPRINT_ICONS.includes(iconName)) {
    return (
      <BlueprintIcon
        icon={iconName as any}
        size={size}
        className={`${className} icon-white`}
        style={{
          ...iconWhiteStyle,
          ...style,
          transition: 'all 0.2s ease-out',
          cursor: 'pointer'
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  // Try to get Lucide icon
  const lucideIconName = LUCIDE_ICON_MAP[iconName];
  if (lucideIconName && LucideIcons[lucideIconName as keyof typeof LucideIcons]) {
    const LucideIcon = LucideIcons[lucideIconName as keyof typeof LucideIcons] as React.ComponentType<any>;
    return (
      <LucideIcon
        size={size}
        className={`${className} icon-white`}
        style={{
          ...iconWhiteStyle,
          ...style,
          transition: 'all 0.2s ease-out',
          cursor: 'pointer'
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  // Fallback to Blueprint icon (will show empty if doesn't exist)
  return (
    <BlueprintIcon
      icon={iconName as any}
      size={size}
      className={`${className} icon-white`}
      style={{
        ...iconWhiteStyle,
        ...style,
        transition: 'all 0.2s ease-out',
        cursor: 'pointer'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};

IconRenderer.displayName = 'IconRenderer';