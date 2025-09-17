
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes
import { Stage, Layer, Rect, Text, Image, Group, Circle, Ellipse, RegularPolygon, Star, Arrow, Line, Transformer } from 'react-konva';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasStore } from '@/stores/canvasStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMobileTouch } from '@/hooks/useMobileTouch';
import { TransformControls } from './TransformControls';
import { VisualFeedback } from './VisualFeedback';
// Temporarily simplified - complex selection tools disabled
// import { LassoSelection, useLassoSelection } from './LassoSelection';
// import { SelectionBox, useSelectionBox } from './SelectionBox';
// import { styled } from '@styles/goober-setup';
import type { CanvasElement, TextElement, ImageElement, ShapeElement, IconElement } from '@/types/canvas';

interface CanvasEngineProps {
  className?: string;
}

// Temporarily using inline styles to fix styled.div error
const CanvasContainer = React.forwardRef<HTMLDivElement, {
  className?: string;
  children: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}>(({ className, children, onDragOver, onDrop }, ref) => (
  <div
    ref={ref}
    className={className}
    onDragOver={onDragOver}
    onDrop={onDrop}
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: 0,
      margin: 0,
      overflow: 'hidden',
      cursor: 'default',
      transform: 'translateZ(0)',
      willChange: 'transform',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none'
    }}
  >
    {children}
  </div>
));

const GridBackground: React.FC<{ visible: boolean; size: number; zoom: number }> = ({ visible, size, zoom }) => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: visible ? 0.1 : 0,
    pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
    backgroundSize: `${size * zoom}px ${size * zoom}px`,
    transition: 'opacity 0.2s ease'
  }} />
);

// Konva element renderer components
const CanvasTextElement: React.FC<{ element: TextElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  const { updateElement, selectElement } = useCanvasStore();
  
  return (
    <Text
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity}
      visible={element.visible}
      text={element.text}
      fontSize={element.fontSize}
      fontFamily={element.fontFamily}
      fontStyle={element.fontStyle}
      fontWeight={element.fontWeight}
      fill={element.color}
      align={element.textAlign}
      verticalAlign={element.verticalAlign}
      lineHeight={element.lineHeight}
      letterSpacing={element.letterSpacing}
      textDecoration={element.textDecoration}
      wrap={element.wordWrap ? 'word' : 'none'}
      listening={!element.locked}
      draggable={!element.locked}
      stroke={isSelected ? '#48aff0' : undefined}
      strokeWidth={isSelected ? 1 : 0}
      onClick={(e) => {
        e.cancelBubble = true;
        const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
        selectElement(element.id, isMultiSelect);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        selectElement(element.id, false);
      }}
      onDragStart={() => {
        if (!isSelected) {
          selectElement(element.id, false);
        }
      }}
      onDragEnd={(e) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      perfectDrawEnabled={false} // Performance optimization
      shadowForStrokeEnabled={false} // Performance optimization
    />
  );
});

const CanvasImageElement: React.FC<{ element: ImageElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  const { updateElement } = useCanvasStore();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [filteredCanvas, setFilteredCanvas] = useState<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.crossOrigin = 'anonymous'; // Handle CORS
    img.src = element.src;
  }, [element.src]);

  // Apply filters to image
  useEffect(() => {
    if (!image || !element.filters) {
      setFilteredCanvas(null);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Build filter string
    const filters = element.filters;
    const filterParts = [];
    if (filters.brightness !== 100) filterParts.push(`brightness(${filters.brightness}%)`);
    if (filters.contrast !== 100) filterParts.push(`contrast(${filters.contrast}%)`);
    if (filters.saturation !== 100) filterParts.push(`saturate(${filters.saturation}%)`);
    if (filters.hue !== 0) filterParts.push(`hue-rotate(${filters.hue}deg)`);
    if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
    if (filters.sepia > 0) filterParts.push(`sepia(${filters.sepia}%)`);
    if (filters.grayscale > 0) filterParts.push(`grayscale(${filters.grayscale}%)`);

    ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';
    
    // Handle crop data
    const cropData = element.cropData;
    if (cropData) {
      ctx.drawImage(
        image,
        cropData.x, cropData.y, cropData.width, cropData.height,
        0, 0, canvas.width, canvas.height
      );
    } else {
      ctx.drawImage(image, 0, 0);
    }

    setFilteredCanvas(canvas);
  }, [image, element.filters, element.cropData]);
  
  if (!image) return null;

  // Use filtered canvas if available, otherwise use original image
  const imageToRender = filteredCanvas || image;
  
  return (
    <Image
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity}
      visible={element.visible}
      image={imageToRender}
      listening={!element.locked}
      draggable={!element.locked && isSelected}
      stroke={isSelected ? '#007bff' : undefined}
      strokeWidth={isSelected ? 2 : 0}
      onDragEnd={(e) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      perfectDrawEnabled={false} // Performance optimization
    />
  );
});

const CanvasIconElement: React.FC<{ element: IconElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  const { updateElement, selectElement } = useCanvasStore();
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // Load SVG icon based on iconName and iconSet
    const loadIcon = async () => {
      try {
        // This would typically fetch from an icon service or local icon library
        // For now, we'll create a simple SVG based on the icon name
        const svgContent = generateIconSVG(element.iconName, element.fill, element.stroke, element.strokeWidth);
        // Store SVG content if needed
        
        // Convert SVG to image for Konva
        const img = new window.Image();
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
          setImage(img);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } catch (error) {
        console.error('Failed to load icon:', error);
      }
    };

    loadIcon();
  }, [element.iconName, element.fill, element.stroke, element.strokeWidth]);

  if (!image) return null;

  return (
    <Image
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity}
      visible={element.visible}
      image={image}
      listening={!element.locked}
      draggable={!element.locked}
      stroke={isSelected ? '#48aff0' : undefined}
      strokeWidth={isSelected ? 2 : 0}
      shadowColor={isSelected ? '#48aff0' : undefined}
      shadowBlur={isSelected ? 8 : 0}
      shadowOpacity={isSelected ? 0.3 : 0}
      onClick={(e) => {
        e.cancelBubble = true;
        const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
        selectElement(element.id, isMultiSelect);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        selectElement(element.id, false);
      }}
      onDragStart={() => {
        if (!isSelected) {
          selectElement(element.id, false);
        }
      }}
      onDragEnd={(e) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage && !element.locked) {
          stage.container().style.cursor = 'pointer';
        }
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'default';
        }
      }}
      perfectDrawEnabled={false}
    />
  );
});

// Helper function to generate unique IDs
const generateId = (): string => {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to generate polygon points
const generatePolygonPoints = (sides: number, centerX: number, centerY: number, radius: number): number[] => {
  const points: number[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(x, y);
  }
  return points;
};

// Helper function to generate basic SVG icons
const generateIconSVG = (iconName: string, fill: string, stroke?: string, strokeWidth?: number): string => {
  const size = 24;
  const center = size / 2;
  const strokeProps = stroke ? `stroke="${stroke}" stroke-width="${strokeWidth || 2}"` : '';
  
  const icons: Record<string, string> = {
    // Business icons
    'chart': `<path d="M3 3v18h18M7 12l4-4 4 4 4-4" stroke="${fill}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    'dollar': `<line x1="12" y1="1" x2="12" y2="23" stroke="${fill}" stroke-width="2" stroke-linecap="round"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'office': `<rect x="2" y="3" width="20" height="18" fill="${fill}"/><rect x="8" y="6" width="2" height="2" fill="white"/><rect x="14" y="6" width="2" height="2" fill="white"/>`,
    'briefcase': `<rect x="2" y="7" width="20" height="14" rx="2" fill="${fill}"/><path d="m16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="white" stroke-width="2" fill="none"/>`,
    
    // Communication icons  
    'envelope': `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="${fill}"/><polyline points="22,6 12,13 2,6" stroke="white" stroke-width="2" fill="none"/>`,
    'phone': `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="${fill}"/>`,
    'chat': `<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" fill="${fill}"/>`,
    'comment': `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="${fill}"/>`,
    
    // Media icons
    'camera': `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" fill="${fill}"/><circle cx="12" cy="13" r="3" stroke="white" stroke-width="2" fill="none"/>`,
    'video': `<polygon points="23,7 16,12 23,17" fill="${fill}"/><rect x="1" y="5" width="15" height="14" rx="2" fill="${fill}"/>`,
    'music': `<path d="M9 18V5l12-2v13" stroke="${fill}" stroke-width="2" fill="none"/><circle cx="6" cy="18" r="3" fill="${fill}"/><circle cx="18" cy="16" r="3" fill="${fill}"/>`,
    'play': `<polygon points="5,3 19,12 5,21" fill="${fill}"/>`,
    
    // Navigation icons
    'arrow-up': `<path d="m18 15-6-6-6 6" stroke="${fill}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    'arrow-down': `<path d="m6 9 6 6 6-6" stroke="${fill}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    'arrow-left': `<path d="m15 18-6-6 6-6" stroke="${fill}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    'arrow-right': `<path d="m9 18 6-6-6-6" stroke="${fill}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    'menu': `<line x1="4" y1="6" x2="20" y2="6" stroke="${fill}" stroke-width="2"/><line x1="4" y1="12" x2="20" y2="12" stroke="${fill}" stroke-width="2"/><line x1="4" y1="18" x2="20" y2="18" stroke="${fill}" stroke-width="2"/>`,
    'home': `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="${fill}"/><polyline points="9,22 9,12 15,12 15,22" stroke="white" stroke-width="2" fill="none"/>`,
    
    // Social icons
    'heart': `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="${fill}"/>`,
    'star': `<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="${fill}"/>`,
    'thumbs-up': `<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" fill="${fill}"/>`,
    'share': `<circle cx="18" cy="5" r="3" fill="${fill}"/><circle cx="6" cy="12" r="3" fill="${fill}"/><circle cx="18" cy="19" r="3" fill="${fill}"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="${fill}"/>`,
    
    // Technology icons
    'desktop': `<rect width="20" height="14" x="2" y="3" rx="2" fill="${fill}"/><line x1="8" y1="21" x2="16" y2="21" stroke="${fill}" stroke-width="2"/><line x1="12" y1="17" x2="12" y2="21" stroke="${fill}" stroke-width="2"/>`,
    'mobile-phone': `<rect width="14" height="20" x="5" y="2" rx="2" fill="${fill}"/><path d="M12 18h.01" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    'cloud': `<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${fill}"/>`,
    'database': `<ellipse cx="12" cy="5" rx="9" ry="3" fill="${fill}"/><path d="m3 5 0 14c0 3 4 3 9 3s9 0 9-3V5" stroke="white" stroke-width="2" fill="none"/>`,
    
    // Weather icons
    'cloud-snow': `<path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" stroke="${fill}" stroke-width="2" fill="none"/><path d="M8 16h.01M12 18h.01M16 16h.01" stroke="${fill}" stroke-width="2" stroke-linecap="round"/>`,
    'flash': `<polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="${fill}"/>`,
    
    // Editing icons  
    'edit': `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="${fill}" stroke-width="2" fill="none"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z" fill="${fill}"/>`,
    'trash': `<path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="${fill}" stroke-width="2" fill="none"/><line x1="10" y1="11" x2="10" y2="17" stroke="${fill}" stroke-width="2"/><line x1="14" y1="11" x2="14" y2="17" stroke="${fill}" stroke-width="2"/>`,
    'duplicate': `<rect width="13" height="13" x="9" y="9" rx="2" stroke="${fill}" stroke-width="2" fill="none"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'undo': `<path d="M3 7v6h6" stroke="${fill}" stroke-width="2" fill="none"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'redo': `<path d="M21 7v6h-6" stroke="${fill}" stroke-width="2" fill="none"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'cut': `<circle cx="6" cy="6" r="3" fill="${fill}"/><circle cx="18" cy="18" r="3" fill="${fill}"/><line x1="10" y1="10" x2="14" y2="14" stroke="${fill}" stroke-width="2"/>`,
    'copy': `<rect width="14" height="14" x="8" y="8" rx="2" fill="${fill}"/><path d="m4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2" stroke="white" stroke-width="2" fill="none"/>`,
    'paste': `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" fill="none" stroke="${fill}" stroke-width="2"/><rect width="8" height="4" x="8" y="2" rx="1" fill="${fill}"/>`,
    
    // File & Document icons
    'document': `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="${fill}"/><polyline points="14,2 14,8 20,8" fill="none" stroke="white" stroke-width="2"/>`,
    'folder': `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="${fill}"/>`,
    'folder-open': `<path d="M12 3l7 7-7 7-7-7z" fill="${fill}"/><path d="M2 7L9 14 2 21" fill="none" stroke="white" stroke-width="2"/>`,
    'save': `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="${fill}"/><polyline points="17,21 17,13 7,13 17,21" fill="none" stroke="white" stroke-width="2"/>`,
    'download': `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'upload': `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'print': `<polyline points="6,9 6,2 18,2 18,9" stroke="${fill}" stroke-width="2" fill="none"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" fill="${fill}"/><rect width="12" height="8" x="6" y="14" fill="white"/>`,
    
    // User & People icons
    'user': `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="${fill}" stroke-width="2" fill="none"/><circle cx="12" cy="7" r="4" fill="${fill}"/>`,
    'users': `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="${fill}" stroke-width="2" fill="none"/><circle cx="9" cy="7" r="4" fill="${fill}"/>`,
    'person': `<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="${fill}"/>`,
    'account-circle': `<circle cx="12" cy="12" r="10" fill="${fill}"/><circle cx="12" cy="8" r="3" fill="white"/><path d="M6.62 18.91C8.24 17.31 10.95 16 12 16s3.76 1.31 5.38 2.91" stroke="white" stroke-width="2" fill="none"/>`,
    
    // Settings & System icons
    'settings': `<circle cx="12" cy="12" r="3" fill="${fill}"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" fill="${fill}"/>`,
    'cog': `<circle cx="12" cy="12" r="3" fill="${fill}"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="${fill}" stroke-width="2"/>`,
    'lock': `<rect width="18" height="11" x="3" y="11" rx="2" fill="${fill}"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" stroke-width="2" fill="none"/>`,
    'unlock': `<rect width="18" height="11" x="3" y="11" rx="2" fill="${fill}"/><path d="M7 11V7a5 5 0 0 1 9.9-.8" stroke="white" stroke-width="2" fill="none"/>`,
    'key': `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5 0 0l7.5 15.5 5.5-7.5z" fill="${fill}"/>`,
    
    // Time & Calendar icons
    'time': `<circle cx="12" cy="12" r="10" fill="${fill}"/><polyline points="12,6 12,12 16,14" stroke="white" stroke-width="2" fill="none"/>`,
    'clock': `<circle cx="12" cy="12" r="10" stroke="${fill}" stroke-width="2" fill="none"/><polyline points="12,6 12,12 16,14" stroke="${fill}" stroke-width="2"/>`,
    'calendar': `<rect width="18" height="18" x="3" y="4" rx="2" fill="${fill}"/><line x1="16" y1="2" x2="16" y2="6" stroke="white" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="white" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="white" stroke-width="2"/>`,
    'date-range': `<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm-5 16H7v-8h7v8z" fill="${fill}"/>`,
    
    // Shopping & Commerce icons
    'shopping-cart': `<circle cx="9" cy="21" r="1" fill="${fill}"/><circle cx="20" cy="21" r="1" fill="${fill}"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'shopping-bag': `<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="${fill}"/><line x1="3" y1="6" x2="21" y2="6" stroke="white" stroke-width="2"/><path d="M16 10a4 4 0 0 1-8 0" stroke="white" stroke-width="2" fill="none"/>`,
    'credit-card': `<rect width="20" height="14" x="2" y="5" rx="2" fill="${fill}"/><line x1="2" y1="10" x2="22" y2="10" stroke="white" stroke-width="2"/>`,
    'receipt': `<path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2z" fill="${fill}"/><path d="M16 8h-6M16 12h-6M16 16h-6" stroke="white" stroke-width="2"/>`,
    
    // Location & Map icons
    'location': `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${fill}"/><circle cx="12" cy="10" r="3" fill="white"/>`,
    'map': `<polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2 1,6" fill="${fill}"/><line x1="8" y1="2" x2="8" y2="18" stroke="white" stroke-width="2"/><line x1="16" y1="6" x2="16" y2="22" stroke="white" stroke-width="2"/>`,
    'compass': `<circle cx="12" cy="12" r="10" fill="${fill}"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" fill="white"/>`,
    'globe': `<circle cx="12" cy="12" r="10" stroke="${fill}" stroke-width="2" fill="none"/><line x1="2" y1="12" x2="22" y2="12" stroke="${fill}" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="${fill}" stroke-width="2" fill="none"/>`,
    
    // Health & Medical icons  
    'health': `<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'heart-pulse': `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" fill="${fill}"/><path d="M3.22 12H9.5l.5-3 2 9 1.5-6H22" stroke="white" stroke-width="2" fill="none"/>`,
    'plus-circle': `<circle cx="12" cy="12" r="10" fill="${fill}"/><line x1="12" y1="8" x2="12" y2="16" stroke="white" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2"/>`,
    'minus-circle': `<circle cx="12" cy="12" r="10" fill="${fill}"/><line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2"/>`,
    
    // Search & Filter icons
    'search': `<circle cx="11" cy="11" r="8" stroke="${fill}" stroke-width="2" fill="none"/><path d="M21 21l-4.35-4.35" stroke="${fill}" stroke-width="2"/>`,
    'zoom-in': `<circle cx="11" cy="11" r="8" stroke="${fill}" stroke-width="2" fill="none"/><line x1="11" y1="8" x2="11" y2="14" stroke="${fill}" stroke-width="2"/><line x1="8" y1="11" x2="14" y2="11" stroke="${fill}" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="${fill}" stroke-width="2"/>`,
    'zoom-out': `<circle cx="11" cy="11" r="8" stroke="${fill}" stroke-width="2" fill="none"/><line x1="8" y1="11" x2="14" y2="11" stroke="${fill}" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="${fill}" stroke-width="2"/>`,
    'filter': `<polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" fill="${fill}"/>`,
    
    // Alert & Status icons
    'info': `<circle cx="12" cy="12" r="10" fill="${fill}"/><line x1="12" y1="16" x2="12" y2="12" stroke="white" stroke-width="2"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="white" stroke-width="2"/>`,
    'warning': `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="${fill}"/><line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="white" stroke-width="2"/>`,
    'error': `<circle cx="12" cy="12" r="10" fill="${fill}"/><line x1="15" y1="9" x2="9" y2="15" stroke="white" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="white" stroke-width="2"/>`,
    'check-circle': `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" fill="${fill}"/><polyline points="22,4 12,14.01 9,11.01" stroke="white" stroke-width="2" fill="none"/>`,
    'x-circle': `<circle cx="12" cy="12" r="10" fill="${fill}"/><line x1="15" y1="9" x2="9" y2="15" stroke="white" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="white" stroke-width="2"/>`,
    
    // Transport icons
    'car': `<path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17H3v-6l2-5h9l4 5v6h-2" fill="${fill}"/>`,
    'plane': `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 2-3.5 3.5L11 16l-7.8 1.8c-.5.1-.9.6-.9 1.1V20c0 .6.4 1 1 1h1.1c.5 0 1-.4 1.1-.9L17.8 19.2z" fill="${fill}"/>`,
    'train': `<rect width="16" height="6" x="4" y="3" rx="2" fill="${fill}"/><path d="M4 11V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke="${fill}" stroke-width="2" fill="none"/><path d="M22 17.5c0 .83-.67 1.5-1.5 1.5S19 18.33 19 17.5 19.67 16 20.5 16s1.5.67 1.5 1.5zM22 17.5H2" stroke="${fill}" stroke-width="2" fill="none"/><path d="M5 17.5c0 .83-.67 1.5-1.5 1.5S2 18.33 2 17.5 2.67 16 3.5 16 5 16.67 5 17.5z" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'truck': `<rect width="16" height="13" x="1" y="6" rx="2" fill="${fill}"/><path d="M16 8h5l-5-5v5M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="white"/>`,
    'ship': `<path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 4 0 2.4 2.4 0 0 0 4 0 2.4 2.4 0 0 1 4 0 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1" stroke="${fill}" stroke-width="2" fill="none"/><path d="M6 7.5L18 3l-8.5 13.5L6 7.5z" fill="${fill}"/><path d="M6 10.5v-3h12v3" stroke="white" stroke-width="2" fill="none"/>`,
    'bike': `<circle cx="18.5" cy="17.5" r="3.5" stroke="${fill}" stroke-width="2" fill="none"/><circle cx="5.5" cy="17.5" r="3.5" stroke="${fill}" stroke-width="2" fill="none"/><path d="m15 6-3 3 3 3" stroke="${fill}" stroke-width="2" fill="none"/><path d="M9 12h4.5l2-3 1.5 0" stroke="${fill}" stroke-width="2" fill="none"/><path d="M17 5h-2l-2 2" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'helicopter': `<path d="M3 10v1c0 6 2 11 3 11h8.5c1 0 3-5 3-11v-1H3z" fill="${fill}"/><path d="M12 5V2h1m0 0h6v1H13v2" stroke="${fill}" stroke-width="2" fill="none"/><path d="M10 5h6l6 4-6 1" stroke="${fill}" stroke-width="2" fill="none"/><path d="M15 17h3" stroke="white" stroke-width="2" fill="none"/>`,
    
    // Additional Business icons
    'trending-up': `<polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="${fill}" stroke-width="2" fill="none"/><polyline points="16,7 22,7 22,13" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'trending-down': `<polyline points="22,17 13.5,8.5 8.5,13.5 2,7" stroke="${fill}" stroke-width="2" fill="none"/><polyline points="16,17 22,17 22,11" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'bar-chart': `<line x1="18" y1="20" x2="18" y2="10" stroke="${fill}" stroke-width="2"/><line x1="12" y1="20" x2="12" y2="4" stroke="${fill}" stroke-width="2"/><line x1="6" y1="20" x2="6" y2="14" stroke="${fill}" stroke-width="2"/>`,
    'pie-chart': `<path d="M21.21 15.89A10 10 0 1 1 8 2.83" stroke="${fill}" stroke-width="2" fill="none"/><path d="M22 12A10 10 0 0 0 12 2v10z" fill="${fill}"/>`,
    'activity': `<polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'percent': `<line x1="19" y1="5" x2="5" y2="19" stroke="${fill}" stroke-width="2"/><circle cx="6.5" cy="6.5" r="2.5" fill="${fill}"/><circle cx="17.5" cy="17.5" r="2.5" fill="${fill}"/>`,
    
    // Additional Communication icons
    'mail-open': `<path d="M21 12v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5" stroke="${fill}" stroke-width="2" fill="none"/><path d="M3 7l9 6 9-6H3z" fill="${fill}"/>`,
    'message-circle': `<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" fill="${fill}"/>`,
    'message-square': `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="${fill}"/>`,
    'phone-call': `<path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94" stroke="${fill}" stroke-width="2" fill="none"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="${fill}"/>`,
    'voicemail': `<circle cx="5.5" cy="11.5" r="4.5" stroke="${fill}" stroke-width="2" fill="none"/><circle cx="18.5" cy="11.5" r="4.5" stroke="${fill}" stroke-width="2" fill="none"/><line x1="10" y1="11.5" x2="14" y2="11.5" stroke="${fill}" stroke-width="2"/>`,
    'headphones': `<path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="${fill}" stroke-width="2" fill="none"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="${fill}"/>`,
    'mic': `<path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill="${fill}"/><path d="M19 10v2a7 7 0 0 1-14 0v-2m7 9v4m-4 0h8" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'speaker': `<rect x="4" y="2" width="16" height="20" rx="2" fill="${fill}"/><circle cx="12" cy="14" r="4" stroke="white" stroke-width="2" fill="none"/><line x1="12" y1="6" x2="12.01" y2="6" stroke="white" stroke-width="2"/>`,
    
    // Additional Media icons
    'pause': `<rect x="6" y="4" width="4" height="16" fill="${fill}"/><rect x="14" y="4" width="4" height="16" fill="${fill}"/>`,
    'stop': `<rect x="5" y="5" width="14" height="14" fill="${fill}"/>`,
    'skip-back': `<polygon points="19,20 9,12 19,4 19,20" fill="${fill}"/><line x1="5" y1="19" x2="5" y2="5" stroke="${fill}" stroke-width="2"/>`,
    'skip-forward': `<polygon points="5,4 15,12 5,20 5,4" fill="${fill}"/><line x1="19" y1="5" x2="19" y2="19" stroke="${fill}" stroke-width="2"/>`,
    'rewind': `<polygon points="11,19 2,12 11,5 11,19" fill="${fill}"/><polygon points="22,19 13,12 22,5 22,19" fill="${fill}"/>`,
    'fast-forward': `<polygon points="13,19 22,12 13,5 13,19" fill="${fill}"/><polygon points="2,19 11,12 2,5 2,19" fill="${fill}"/>`,
    'volume': `<polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" fill="${fill}"/>`,
    'volume-off': `<polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" fill="${fill}"/><line x1="23" y1="9" x2="17" y2="15" stroke="${fill}" stroke-width="2"/><line x1="17" y1="9" x2="23" y2="15" stroke="${fill}" stroke-width="2"/>`,
    'volume-low': `<polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" fill="${fill}"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'volume-high': `<polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" fill="${fill}"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'radio': `<circle cx="12" cy="12" r="2" fill="${fill}"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M20.07 3.93a10 10 0 0 1 0 16.14M3.93 20.07a10 10 0 0 1 0-16.14" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'film': `<rect x="2" y="3" width="20" height="18" rx="2" fill="${fill}"/><line x1="7" y1="3" x2="7" y2="21" stroke="white" stroke-width="2"/><line x1="17" y1="3" x2="17" y2="21" stroke="white" stroke-width="2"/><line x1="2" y1="9" x2="7" y2="9" stroke="white" stroke-width="2"/><line x1="2" y1="15" x2="7" y2="15" stroke="white" stroke-width="2"/>`,
    
    // Additional Navigation icons
    'navigation': `<polygon points="3,11 22,2 13,21 11,13 3,11" fill="${fill}"/>`,
    'map-pin': `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${fill}"/><circle cx="12" cy="10" r="3" stroke="white" stroke-width="2" fill="none"/>`,
    'map': `<polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round"/>`,
    'move': `<polyline points="5,9 2,12 5,15" stroke="${fill}" stroke-width="2" fill="none"/><polyline points="9,5 12,2 15,5" stroke="${fill}" stroke-width="2" fill="none"/><polyline points="15,19 12,22 9,19" stroke="${fill}" stroke-width="2" fill="none"/><polyline points="19,9 22,12 19,15" stroke="${fill}" stroke-width="2" fill="none"/><line x1="2" y1="12" x2="22" y2="12" stroke="${fill}" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="22" stroke="${fill}" stroke-width="2"/>`,
    'corner-down-right': `<polyline points="15,10 20,15 15,20" stroke="${fill}" stroke-width="2" fill="none"/><path d="M4 4v7a4 4 0 0 0 4 4h12" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'corner-up-left': `<polyline points="9,14 4,9 9,4" stroke="${fill}" stroke-width="2" fill="none"/><path d="M20 20v-7a4 4 0 0 0-4-4H4" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'crosshair': `<circle cx="12" cy="12" r="10" stroke="${fill}" stroke-width="2" fill="none"/><line x1="22" y1="12" x2="18" y2="12" stroke="${fill}" stroke-width="2"/><line x1="6" y1="12" x2="2" y2="12" stroke="${fill}" stroke-width="2"/><line x1="12" y1="6" x2="12" y2="2" stroke="${fill}" stroke-width="2"/><line x1="12" y1="22" x2="12" y2="18" stroke="${fill}" stroke-width="2"/>`,
    
    // Additional Social icons  
    'bookmark': `<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="${fill}"/>`,
    'gift': `<polyline points="20,12 20,22 4,22 4,12" stroke="${fill}" stroke-width="2" fill="none"/><rect x="2" y="7" width="20" height="5" fill="${fill}"/><line x1="12" y1="22" x2="12" y2="7" stroke="white" stroke-width="2"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke="${fill}" stroke-width="2" fill="none"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'award': `<circle cx="12" cy="8" r="7" fill="${fill}"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'trophy': `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="${fill}" stroke-width="2" fill="none"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="${fill}" stroke-width="2" fill="none"/><path d="M4 22h16" stroke="${fill}" stroke-width="2" fill="none"/><path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34" stroke="${fill}" stroke-width="2" fill="none"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" fill="${fill}"/>`,
    'medal': `<circle cx="12" cy="8" r="6" fill="${fill}"/><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47L12 18l-4.182 3.886a.5.5 0 0 1-.81-.47L8.523 12.89" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'flag': `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="${fill}"/><line x1="4" y1="22" x2="4" y2="15" stroke="${fill}" stroke-width="2"/>`,
    
    // Additional Technology icons
    'smartphone': `<rect x="5" y="2" width="14" height="20" rx="2" fill="${fill}"/><line x1="12" y1="18" x2="12" y2="18" stroke="white" stroke-width="2"/>`,
    'tablet': `<rect x="4" y="2" width="16" height="20" rx="2" fill="${fill}"/><line x1="12" y1="18" x2="12" y2="18" stroke="white" stroke-width="2"/>`,
    'laptop': `<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" fill="${fill}"/>`,
    'monitor': `<rect width="20" height="14" x="2" y="3" rx="2" fill="${fill}"/><line x1="8" y1="21" x2="16" y2="21" stroke="${fill}" stroke-width="2"/><line x1="12" y1="17" x2="12" y2="21" stroke="${fill}" stroke-width="2"/>`,
    'server': `<rect x="2" y="2" width="20" height="8" rx="2" ry="2" fill="${fill}"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2" fill="${fill}"/><line x1="6" y1="6" x2="6.01" y2="6" stroke="white" stroke-width="2"/><line x1="6" y1="18" x2="6.01" y2="18" stroke="white" stroke-width="2"/>`,
    'hard-drive': `<line x1="22" y1="12" x2="2" y2="12" stroke="${fill}" stroke-width="2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" fill="${fill}"/><line x1="6" y1="16" x2="6.01" y2="16" stroke="white" stroke-width="2"/><line x1="10" y1="16" x2="10.01" y2="16" stroke="white" stroke-width="2"/>`,
    'cpu': `<rect x="4" y="4" width="16" height="16" rx="2" fill="${fill}"/><rect x="9" y="9" width="6" height="6" stroke="white" stroke-width="2" fill="none"/><line x1="9" y1="1" x2="9" y2="4" stroke="${fill}" stroke-width="2"/><line x1="15" y1="1" x2="15" y2="4" stroke="${fill}" stroke-width="2"/><line x1="9" y1="20" x2="9" y2="23" stroke="${fill}" stroke-width="2"/><line x1="15" y1="20" x2="15" y2="23" stroke="${fill}" stroke-width="2"/>`,
    'wifi': `<path d="M1.42 9a16 16 0 0 1 21.16 0M5 12.55a11 11 0 0 1 14.08 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'bluetooth': `<path d="m6.5 6.5 11 11L12 23l-5.5-5.5 11-11L12 1l5.5 5.5-11 11" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'battery': `<rect x="1" y="6" width="18" height="12" rx="2" ry="2" fill="${fill}"/><line x1="23" y1="13" x2="23" y2="11" stroke="${fill}" stroke-width="2"/>`,
    'power': `<path d="M18.36 6.64a9 9 0 1 1-12.73 0" stroke="${fill}" stroke-width="2" fill="none"/><line x1="12" y1="2" x2="12" y2="12" stroke="${fill}" stroke-width="2"/>`,
    
    // Weather & Nature icons
    'sun': `<circle cx="12" cy="12" r="5" fill="${fill}"/><line x1="12" y1="1" x2="12" y2="3" stroke="${fill}" stroke-width="2"/><line x1="12" y1="21" x2="12" y2="23" stroke="${fill}" stroke-width="2"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="${fill}" stroke-width="2"/>`,
    'moon': `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="${fill}"/>`,
    'sunrise': `<path d="M17 18a5 5 0 0 0-10 0" stroke="${fill}" stroke-width="2" fill="none"/><line x1="12" y1="2" x2="12" y2="9" stroke="${fill}" stroke-width="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64" stroke="${fill}" stroke-width="2"/><line x1="1" y1="18" x2="3" y2="18" stroke="${fill}" stroke-width="2"/>`,
    'sunset': `<path d="M17 18a5 5 0 0 0-10 0" stroke="${fill}" stroke-width="2" fill="none"/><line x1="12" y1="9" x2="12" y2="2" stroke="${fill}" stroke-width="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64" stroke="${fill}" stroke-width="2"/>`,
    'wind': `<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" stroke="${fill}" stroke-width="2" fill="none"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2" stroke="${fill}" stroke-width="2" fill="none"/><path d="M14.6 20.6A2 2 0 1 0 16 17H2" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'umbrella': `<path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'thermometer': `<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" fill="${fill}"/><circle cx="12" cy="17" r="1" fill="white"/>`,
    'droplet': `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="${fill}"/>`,
    'leaf': `<path d="M17 8c0-3.87-3.13-7-7-7S3 4.13 3 8a7.001 7.001 0 0 0 11.95 4.95c.38-.39.74-.81 1.05-1.26.98-1.49 1-3.42 1-3.69z" fill="${fill}"/><path d="M8.5 8c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1z" fill="white"/>`,
    
    // Additional Editing icons
    'scissors': `<circle cx="6" cy="6" r="3" stroke="${fill}" stroke-width="2" fill="none"/><circle cx="6" cy="18" r="3" stroke="${fill}" stroke-width="2" fill="none"/><line x1="20" y1="4" x2="8.12" y2="15.88" stroke="${fill}" stroke-width="2"/><line x1="14.47" y1="14.48" x2="20" y2="20" stroke="${fill}" stroke-width="2"/>`,
    'clipboard': `<rect x="8" y="2" width="8" height="4" rx="1" ry="1" fill="${fill}"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'paperclip': `<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'link': `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="${fill}" stroke-width="2" fill="none"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'unlink': `<path d="M18.84 12.25 21 10a5 5 0 0 0-7.07-7.07L12 4.91" stroke="${fill}" stroke-width="2" fill="none"/><path d="M5.17 11.75 3 14a5 5 0 0 0 7.07 7.07L12 19.09M15 9l-6 6m4-7 2-2m-8 10 2-2" stroke="${fill}" stroke-width="2" fill="none"/>`,
    'layers': `<polygon points="12,2 2,7 12,12 22,7" fill="${fill}"/><polyline points="2,17 12,22 22,17" stroke="${fill}" stroke-width="2" fill="none"/><polyline points="2,12 12,17 22,12" stroke="${fill}" stroke-width="2" fill="none"/>`,
    // Fallback shapes
    'circle': `<circle cx="${center}" cy="${center}" r="${center - 2}" fill="${fill}" ${strokeProps}/>`,
    'square': `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" fill="${fill}" ${strokeProps}/>`,
    'triangle': `<path d="M12 2 L22 20 L2 20 Z" fill="${fill}" ${strokeProps}/>`
  };
  
  const iconPath = icons[iconName] || icons.circle;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${iconPath}</svg>`;
};

const CanvasShapeElement: React.FC<{ element: ShapeElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  const { updateElement, selectElement } = useCanvasStore();
  
  // Common properties for all shapes
  const commonProps = {
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    scaleX: element.scaleX,
    scaleY: element.scaleY,
    opacity: element.opacity,
    visible: element.visible,
    fill: element.fill,
    stroke: element.stroke || (isSelected ? '#48aff0' : undefined),
    strokeWidth: element.strokeWidth || (isSelected ? 2 : 0),
    dash: element.strokeDashArray,
    listening: !element.locked,
    draggable: !element.locked,
    onClick: (e: any) => {
      e.cancelBubble = true;
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
      selectElement(element.id, isMultiSelect);
    },
    onTap: (e: any) => {
      e.cancelBubble = true;
      selectElement(element.id, false);
    },
    onDragStart: () => {
      if (!isSelected) {
        selectElement(element.id, false);
      }
    },
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    onDragEnd: (e: any) => {
      updateElement(element.id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    },
  };

  // Render appropriate Konva shape based on shapeType
  switch (element.shapeType) {
    case 'rectangle':
      return (
        <Rect
          {...commonProps}
          width={element.width}
          height={element.height}
          cornerRadius={element.cornerRadius || 0}
        />
      );

    case 'circle':
      return (
        <Circle
          {...commonProps}
          radius={Math.min(element.width, element.height) / 2}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
        />
      );

    case 'ellipse':
      return (
        <Ellipse
          {...commonProps}
          radiusX={element.width / 2}
          radiusY={element.height / 2}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
        />
      );

    case 'triangle':
      return (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={Math.min(element.width, element.height) / 2}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
        />
      );

    case 'polygon':
      return (
        <RegularPolygon
          {...commonProps}
          sides={element.sides || 6}
          radius={Math.min(element.width, element.height) / 2}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
        />
      );

    case 'star':
      return (
        <Star
          {...commonProps}
          numPoints={element.sides || 5}
          innerRadius={(Math.min(element.width, element.height) / 2) * (element.innerRadius || 0.5)}
          outerRadius={Math.min(element.width, element.height) / 2}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
        />
      );

    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          points={[0, element.height / 2, element.width, element.height / 2]}
          pointerLength={element.width * 0.2}
          pointerWidth={element.height * 0.5}
        />
      );

    case 'line':
      return (
        <Line
          {...commonProps}
          points={[0, 0, element.width, element.height]}
          stroke={element.stroke || element.fill}
          strokeWidth={element.strokeWidth || 2}
        />
      );

    case 'path':
      // Custom path shape - would need path data in element
      const pathData = (element as any).pathData || '';
      if (pathData) {
        return (
          <Line
            {...commonProps}
            points={[0, 0, element.width, element.height]}
            stroke={element.stroke || element.fill}
            strokeWidth={element.strokeWidth || 2}
            closed={(element as any).closePath || false}
          />
        );
      }
      return null;

    case 'diamond':
      const centerX = element.width / 2;
      const centerY = element.height / 2;
      return (
        <Line
          {...commonProps}
          points={[
            centerX, 0,              // top
            element.width, centerY,  // right
            centerX, element.height, // bottom
            0, centerY               // left
          ]}
          closed={true}
          stroke={element.stroke || element.fill}
          strokeWidth={element.strokeWidth || 0}
          fill={element.fill}
        />
      );

    case 'hexagon':
      const hex = generatePolygonPoints(6, element.width / 2, element.height / 2, Math.min(element.width, element.height) / 2);
      return (
        <Line
          {...commonProps}
          points={[element.width/2, 0, element.width, element.height/3, element.width, element.height*2/3, element.width/2, element.height, 0, element.height*2/3, 0, element.height/3]}
          closed={true}
          stroke={element.stroke || element.fill}
          strokeWidth={element.strokeWidth || 0}
          fill={element.fill}
        />
      );

    case 'octagon':
      const oct = generatePolygonPoints(8, element.width / 2, element.height / 2, Math.min(element.width, element.height) / 2);
      return (
        <Line
          {...commonProps}
          points={[element.width/3, 0, element.width*2/3, 0, element.width, element.width/3, element.width, element.height*2/3, element.width*2/3, element.height, element.width/3, element.height, 0, element.height*2/3, 0, element.width/3]}
          closed={true}
          stroke={element.stroke || element.fill}
          strokeWidth={element.strokeWidth || 0}
          fill={element.fill}
        />
      );

    default:
      // Fallback to rectangle for unknown shape types
      return (
        <Rect
          {...commonProps}
          width={element.width}
          height={element.height}
          cornerRadius={element.cornerRadius || 0}
        />
      );
  }
});

// Main element renderer
const CanvasElementRenderer: React.FC<{ element: CanvasElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  switch (element.type) {
    case 'text':
      return <CanvasTextElement element={element as TextElement} isSelected={isSelected} />;
    case 'image':
      return <CanvasImageElement element={element as ImageElement} isSelected={isSelected} />;
    case 'shape':
      return <CanvasShapeElement element={element as ShapeElement} isSelected={isSelected} />;
    case 'icon':
      return <CanvasIconElement element={element as IconElement} isSelected={isSelected} />;
    default:
      return null;
  }
});

const CanvasEngine: React.FC<CanvasEngineProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // const [currentTool, setCurrentTool] = useState<'select' | 'lasso' | 'box'>('select');
  
  // Enable keyboard shortcuts for canvas interactions
  useKeyboardShortcuts({ enabled: true });
  
  // Enable mobile touch support
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleTap
  } = useMobileTouch();
  
  const {
    stageRef,
    layerRef,
    handleStageClick,
    handleStageMouseDown,
    handleWheel,
    fitStageIntoParentContainer,
    zoomToFit,
  } = useCanvas();
  
  const { 
    elements, 
    selection, 
    zoom, 
    pan, 
    canvasSize, 
    backgroundColor,
    showGrid,
    gridSize,
    isSelected,
    getSelectionBounds,
    transformElements,
    addElement,
    setCanvasSize,
    fitCanvasToContainer // Add this for autofit functionality
  } = useCanvasStore();

  // Selection tools - temporarily simplified
  // const { isLassoActive, startLassoSelection, handleSelectionComplete: handleLassoComplete } = useLassoSelection();
  // const { isBoxActive, startBoxSelection, handleSelectionComplete: handleBoxComplete } = useSelectionBox();
  const isLassoActive = false;
  const isBoxActive = false;
  const handleLassoComplete = () => {};
  const handleBoxComplete = () => {};

  // Memoized sorted elements for performance
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => a.zIndex - b.zIndex);
  }, [elements]);

  // Calculate optimal canvas size for auto-fit behavior
  const calculateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Account for padding and bottom controls
      const availableWidth = width - 80; // 40px padding on each side
      const availableHeight = height - 120; // Account for bottom zoom controls
      
      // Use 85% of available space for comfortable viewing
      const usableWidth = availableWidth * 0.85;
      const usableHeight = availableHeight * 0.85;
      
      // Maintain a good aspect ratio (16:10 for design work)
      const aspectRatio = 16 / 10;
      let canvasWidth, canvasHeight;
      
      if (usableWidth / usableHeight > aspectRatio) {
        // Height is the limiting factor
        canvasHeight = Math.max(400, usableHeight);
        canvasWidth = canvasHeight * aspectRatio;
      } else {
        // Width is the limiting factor  
        canvasWidth = Math.max(600, usableWidth);
        canvasHeight = canvasWidth / aspectRatio;
      }
      
      // Ensure minimum sizes
      canvasWidth = Math.max(600, Math.min(canvasWidth, 1400));
      canvasHeight = Math.max(400, Math.min(canvasHeight, 1000));
      
      const newCanvasSize = {
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight)
      };
      
      // Update if size changed significantly
      if (Math.abs(newCanvasSize.width - canvasSize.width) > 20 || 
          Math.abs(newCanvasSize.height - canvasSize.height) > 20) {
        console.log('📐 Auto-fit canvas size:', newCanvasSize, `from container: ${width}x${height}`);
        setCanvasSize(newCanvasSize);
      }
    }
  }, [canvasSize, setCanvasSize]);

  // Handle container resize with improved auto-fit
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      
      // Update stage size first
      fitStageIntoParentContainer();
      
      // Then calculate optimal canvas size
      calculateCanvasSize();
      
      // Auto-fit with slight delay to ensure everything is updated
      setTimeout(() => {
        zoomToFit();
      }, 100);
    }
  }, [fitStageIntoParentContainer, calculateCanvasSize, zoomToFit]);

  useEffect(() => {
    // Only handle initial sizing, let MainCanvas handle resize events
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      fitStageIntoParentContainer();
    }
  }, []); // Remove handleResize dependency to prevent automatic resizing

  // Update dimensions when container size changes (browser resize, parent changes)
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const currentDims = { width, height };

        // Only update if dimensions actually changed
        setDimensions(prev => {
          if (prev.width !== currentDims.width || prev.height !== currentDims.height) {
            console.log(`📐 Canvas dimensions updated: ${prev.width}x${prev.height} → ${currentDims.width}x${currentDims.height}`);
            return currentDims;
          }
          return prev;
        });

        fitStageIntoParentContainer();
      }
    };

    // Listen for canvas resize events from parent
    const handleCanvasResize = () => {
      requestAnimationFrame(updateDimensions);
    };

    // Set up ResizeObserver for direct container size monitoring
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            handleCanvasResize();
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize as fallback
    window.addEventListener('resize', handleCanvasResize);
    window.addEventListener('canvas-container-resized', handleCanvasResize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleCanvasResize);
      window.removeEventListener('canvas-container-resized', handleCanvasResize);
    };
  }, [fitStageIntoParentContainer]);

  // Recalculate when canvas size changes in store
  useEffect(() => {
    if (containerRef.current) {
      fitStageIntoParentContainer();
    }
  }, [canvasSize, fitStageIntoParentContainer]);

  // Responsive sizing utility for elements based on canvas scale and zoom
  const getResponsiveElementSize = useCallback((elementType: 'image' | 'text' | 'shape') => {
    // Base element sizes (what we want at 1:1 scale and 100% zoom)
    const BASE_SIZES = {
      image: { width: 200, height: 200 },
      text: { width: 200, height: 50 },
      shape: { width: 100, height: 100 }
    };

    // Check if there are existing elements to determine current scaling context
    const currentElements = useCanvasStore.getState().elements;
    const existingElements = currentElements.filter(el => el.type === elementType);

    if (existingElements.length > 0) {
      // Use existing elements as reference for current scale
      const referenceElement = existingElements[0];
      const baseSize = BASE_SIZES[elementType];

      // Calculate current scale based on first existing element vs its base size
      const currentScaleX = referenceElement.width / baseSize.width;
      const currentScaleY = referenceElement.height / baseSize.height;
      const currentScale = Math.min(currentScaleX, currentScaleY);

      // Apply zoom adjustment - smaller zoom means we want proportionally larger elements
      const zoomAdjustment = 1 / zoom;
      const finalScale = currentScale * zoomAdjustment;

      const responsiveSize = {
        width: Math.round(baseSize.width * finalScale),
        height: Math.round(baseSize.height * finalScale)
      };

      console.log(`📏 Responsive ${elementType} (existing ref): currentScale(${currentScale.toFixed(2)}) zoom(${zoom.toFixed(2)}) → ${responsiveSize.width}x${responsiveSize.height}`);
      return responsiveSize;
    } else {
      // Fallback to canvas-based calculation for first element of this type
      const STANDARD_CANVAS = { width: 800, height: 500 };
      const scaleX = canvasSize.width / STANDARD_CANVAS.width;
      const scaleY = canvasSize.height / STANDARD_CANVAS.height;
      const scaleFactor = Math.min(scaleX, scaleY);

      const zoomAdjustment = 1 / zoom;
      const finalScale = scaleFactor * zoomAdjustment;

      const baseSize = BASE_SIZES[elementType];
      const responsiveSize = {
        width: Math.round(baseSize.width * finalScale),
        height: Math.round(baseSize.height * finalScale)
      };

      console.log(`📏 Responsive ${elementType} (canvas ref): canvas(${canvasSize.width}x${canvasSize.height}) scale(${scaleFactor.toFixed(2)}) zoom(${zoom.toFixed(2)}) → ${responsiveSize.width}x${responsiveSize.height}`);
      return responsiveSize;
    }
  }, [canvasSize, zoom]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    console.log('🎯 Drag over canvas');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    console.log('🎯 Drop on canvas!', e.dataTransfer.types);
    
    try {
      const dragData = e.dataTransfer.getData('application/json');
      console.log('📦 Raw drag data:', dragData);
      if (!dragData) {
        console.log('❌ No drag data found');
        return;
      }
      
      const data = JSON.parse(dragData);
      console.log('✅ Parsed data:', data);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate drop position relative to canvas with centered stage
      const stageX = (dimensions.width - canvasSize.width * zoom) / 2;
      const stageY = (dimensions.height - canvasSize.height * zoom) / 2;
      const canvasX = (e.clientX - rect.left - stageX) / zoom;
      const canvasY = (e.clientY - rect.top - stageY) / zoom;
      
      // Handle different types of dragged items
      switch (data.type) {
        case 'test':
          console.log('🧪 Test drop successful!', data.message);
          alert('Drag and drop is working! ' + data.message);
          break;
          
        case 'photo':
          const imageSize = getResponsiveElementSize('image');
          addElement({
            id: generateId(),
            type: 'image',
            x: canvasX - imageSize.width / 2, // Center the image
            y: canvasY - imageSize.height / 2,
            width: imageSize.width,
            height: imageSize.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: elements.length + 1,
            src: data.src,
            alt: data.alt || 'Dragged photo',
            filters: {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              hue: 0,
              blur: 0,
              sepia: 0,
              grayscale: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          break;
          
        case 'shape':
          const shapeSize = getResponsiveElementSize('shape');
          addElement({
            id: generateId(),
            type: 'shape',
            x: canvasX - shapeSize.width / 2,
            y: canvasY - shapeSize.height / 2,
            width: shapeSize.width,
            height: shapeSize.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: elements.length + 1,
            shapeType: data.shapeType,
            fill: data.fill || '#48aff0',
            stroke: data.stroke,
            strokeWidth: data.strokeWidth || 2,
            cornerRadius: data.cornerRadius,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          break;
          
        case 'text':
          const textSize = getResponsiveElementSize('text');
          addElement({
            id: generateId(),
            type: 'text',
            x: canvasX - textSize.width / 2,
            y: canvasY - textSize.height / 2,
            width: textSize.width,
            height: textSize.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: elements.length + 1,
            text: data.text || 'Text Element',
            fontSize: data.fontSize || 16,
            fontFamily: data.fontFamily || 'Arial',
            fontWeight: data.fontWeight || 'normal',
            fontStyle: data.fontStyle || 'normal',
            color: data.color || '#000000',
            textAlign: data.textAlign || 'left',
            verticalAlign: data.verticalAlign || 'top',
            lineHeight: data.lineHeight || 1.2,
            letterSpacing: data.letterSpacing || 0,
            textDecoration: data.textDecoration || 'none',
            wordWrap: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          break;
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [pan, zoom, elements.length, addElement]);

  // Performance optimization: Enable WebGL if available
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      
      // Enable WebGL if available (Konva automatically falls back to 2D if WebGL is not supported)
      try {
        // Configure for high DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        if (pixelRatio > 1) {
          stage.scale({ x: pixelRatio, y: pixelRatio });
        }
      } catch (error) {
        console.warn('WebGL optimization failed:', error);
      }
    }
  }, []);

  return (
    <CanvasContainer 
      ref={containerRef} 
      className={className}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Grid background */}
      <GridBackground visible={showGrid} size={gridSize} zoom={zoom} />
      
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={zoom}
        scaleY={zoom}
        x={(dimensions.width - canvasSize.width * zoom) / 2}
        y={(dimensions.height - canvasSize.height * zoom) / 2}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        // onWheel={handleWheel} // DISABLED: Mouse wheel zoom disabled per user request
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDblTap={handleDoubleTap}
        draggable={false} // DISABLED: Stage is now locked in center position
        
        // Performance optimizations
        perfectDrawEnabled={false}
        imageSmoothingEnabled={true}
        hitGraphEnabled={true}
        
        // WebGL acceleration (falls back to 2D canvas if not supported)
        globalCompositeOperation="source-over"
        
        // Make sure the stage allows drops
        onDragOver={(e) => {
          e.evt.preventDefault();
          console.log('🎯 Stage drag over');
        }}
        onDrop={(e) => {
          e.evt.preventDefault();
          console.log('🎯 Stage drop');
          handleDrop(e.evt as unknown as React.DragEvent);
        }}
      >
        {/* Main canvas background with Polotno-style frame */}
        <Layer ref={layerRef} imageSmoothingEnabled={false}>
          {/* Canvas shadow/border frame like Polotno */}
          <Rect
            x={-2}
            y={-2}
            width={canvasSize.width + 4}
            height={canvasSize.height + 4}
            fill="rgba(0, 0, 0, 0.1)"
            listening={false}
            perfectDrawEnabled={false}
            cornerRadius={2}
          />
          {/* Main white canvas background */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill={backgroundColor}
            stroke="rgba(0, 0, 0, 0.15)"
            strokeWidth={1}
            listening={false}
            perfectDrawEnabled={false}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={8}
            shadowOffset={{ x: 0, y: 4 }}
            shadowOpacity={0.3}
          />
        </Layer>
        
        {/* Elements layer */}
        <Layer 
          imageSmoothingEnabled={false}
          hitGraphEnabled={true}
          perfectDrawEnabled={false}
        >
          {sortedElements.map((element) => (
            <Group
              key={element.id}
              data-testid="canvas-element"
              data-type={element.type}
              data-element-id={element.id}
            >
              <CanvasElementRenderer
                element={element}
                isSelected={isSelected(element.id)}
              />
            </Group>
          ))}
        </Layer>
        
        {/* UI overlay layer (selection handles, guides, etc.) */}
        <Layer 
          listening={false}
          perfectDrawEnabled={false}
        >
          {/* Transform controls - replaces simple selection handles */}
          {selection.length > 0 && (() => {
            const bounds = getSelectionBounds();
            return bounds && (
              <TransformControls
                bounds={bounds}
                enableRotation={selection.length === 1} // Only enable rotation for single selections
                enableSnapping={true}
                onTransformStart={() => {
                  // Store initial state for command pattern
                  selection.forEach(id => {
                    const element = elements.find(el => el.id === id);
                    if (element) {
                      (element as any)._initialTransform = {
                        x: element.x,
                        y: element.y,
                        width: element.width,
                        height: element.height,
                        rotation: element.rotation || 0,
                      };
                    }
                  });
                }}
                onTransform={(newBounds) => {
                  // Apply transform to selected elements
                  const scaleX = newBounds.width / bounds.width;
                  const scaleY = newBounds.height / bounds.height;
                  // const deltaX = newBounds.x - bounds.x;
                  // const deltaY = newBounds.y - bounds.y;
                  // const rotationDelta = (newBounds.rotation || 0) - (bounds.rotation || 0);
                  
                  selection.forEach(id => {
                    const element = elements.find(el => el.id === id);
                    if (element) {
                      let newProps: Partial<CanvasElement> = {};
                      
                      if (selection.length === 1) {
                        // Single element - direct transform
                        newProps = {
                          x: newBounds.x,
                          y: newBounds.y,
                          width: newBounds.width,
                          height: newBounds.height,
                          rotation: newBounds.rotation || 0,
                        };
                      } else {
                        // Multiple elements - proportional transform
                        const relativeX = (element.x - bounds.x) / bounds.width;
                        const relativeY = (element.y - bounds.y) / bounds.height;
                        
                        newProps = {
                          x: newBounds.x + relativeX * newBounds.width,
                          y: newBounds.y + relativeY * newBounds.height,
                          width: element.width * scaleX,
                          height: element.height * scaleY,
                        };
                      }
                      
                      transformElements([id], newProps);
                    }
                  });
                }}
                onTransformEnd={() => {
                  // Create command for undo/redo
                  import('@/stores/commandStore').then(({ useCommandStore }) => {
                    const commandStore = useCommandStore.getState();
                    const batchId = commandStore.startBatch('Transform Selection');
                    
                    selection.forEach(id => {
                      const element = elements.find(el => el.id === id);
                      const initialTransform = (element as any)?._initialTransform;
                      
                      if (element && initialTransform) {
                        const currentTransform = {
                          x: element.x,
                          y: element.y,
                          width: element.width,
                          height: element.height,
                          rotation: element.rotation || 0,
                        };
                        
                        commandStore.createTransformElementCommand(
                          id,
                          initialTransform,
                          currentTransform
                        );
                        
                        // Clean up temporary data
                        delete (element as any)._initialTransform;
                      }
                    });
                    
                    commandStore.endBatch(batchId);
                  });
                }}
              />
            );
          })()}
          
          {/* Lasso selection - temporarily disabled */}
          {/* <LassoSelection
            isActive={isLassoActive}
            onSelectionComplete={handleLassoComplete}
          /> */}
          
          {/* Selection box - temporarily disabled */}
          {/* <SelectionBox
            isActive={isBoxActive}
            onSelectionComplete={handleBoxComplete}
          /> */}
          
          {/* Visual feedback and indicators */}
          <VisualFeedback zoom={zoom} />
          
          {/* Multi-selection indicators */}
          {selection.length > 1 && (
            <Group>
              {selection.map(id => {
                const element = elements.find(el => el.id === id);
                if (!element) return null;
                return (
                  <Rect
                    key={`multi-${id}`}
                    x={element.x - 2 / zoom}
                    y={element.y - 2 / zoom}
                    width={element.width + 4 / zoom}
                    height={element.height + 4 / zoom}
                    stroke="#007bff"
                    strokeWidth={1 / zoom}
                    fill="transparent"
                    dash={[2 / zoom, 2 / zoom]}
                    listening={false}
                  />
                );
              })}
            </Group>
          )}
        </Layer>
      </Stage>
    </CanvasContainer>
  );
};

CanvasTextElement.displayName = 'CanvasTextElement';
CanvasImageElement.displayName = 'CanvasImageElement';  
CanvasShapeElement.displayName = 'CanvasShapeElement';
CanvasIconElement.displayName = 'CanvasIconElement';
CanvasElementRenderer.displayName = 'CanvasElementRenderer';

export default observer(CanvasEngine);
