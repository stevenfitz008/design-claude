
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes
import { Stage, Layer, Rect, Text, Image, Group, Circle, Ellipse, RegularPolygon, Star, Arrow, Line } from 'react-konva';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasStore } from '@/stores/canvasStore';
import { TransformControls } from './TransformControls';
// Temporarily simplified - complex selection tools disabled
// import { LassoSelection, useLassoSelection } from './LassoSelection';
// import { SelectionBox, useSelectionBox } from './SelectionBox';
// import { styled } from '@styles/goober-setup';
import type { CanvasElement, TextElement, ImageElement, ShapeElement } from '@/types/canvas';

interface CanvasEngineProps {
  className?: string;
}

// Temporarily using inline styles to fix styled.div error
const CanvasContainer: React.FC<{ 
  className?: string; 
  children: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}> = ({ className, children, onDragOver, onDrop }) => (
  <div 
    className={className}
    onDragOver={onDragOver}
    onDrop={onDrop}
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: 0, // Remove padding - frame expands to edges
      margin: 0,
      overflow: 'hidden',
      cursor: 'default',
      transform: 'translateZ(0)', // Force GPU acceleration
      willChange: 'transform',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    {children}
  </div>
);

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
  const { updateElement } = useCanvasStore();
  
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
      draggable={!element.locked && isSelected}
      stroke={isSelected ? '#007bff' : undefined}
      strokeWidth={isSelected ? 1 : 0}
      onDragEnd={(e) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        updateElement(element.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
        
        // Reset scale
        node.scaleX(1);
        node.scaleY(1);
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
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        updateElement(element.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
        
        // Reset scale
        node.scaleX(1);
        node.scaleY(1);
      }}
      perfectDrawEnabled={false} // Performance optimization
    />
  );
});

const CanvasIconElement: React.FC<{ element: IconElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  const { updateElement } = useCanvasStore();
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
      draggable={!element.locked && isSelected}
      stroke={isSelected ? '#007bff' : undefined}
      strokeWidth={isSelected ? 2 : 0}
      onDragEnd={(e) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        updateElement(element.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
        
        // Reset scale
        node.scaleX(1);
        node.scaleY(1);
      }}
      perfectDrawEnabled={false}
    />
  );
});

// Helper function to generate unique IDs
const generateId = (): string => {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to generate basic SVG icons
const generateIconSVG = (iconName: string, fill: string, stroke?: string, strokeWidth?: number): string => {
  const size = 24;
  const center = size / 2;
  const strokeProps = stroke ? `stroke="${stroke}" stroke-width="${strokeWidth || 2}"` : '';
  
  const icons: Record<string, string> = {
    heart: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="${fill}" ${strokeProps}/>`,
    star: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="${fill}" ${strokeProps}/>`,
    circle: `<circle cx="${center}" cy="${center}" r="${center - 2}" fill="${fill}" ${strokeProps}/>`,
    square: `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" fill="${fill}" ${strokeProps}/>`,
    triangle: `<path d="M12 2 L22 20 L2 20 Z" fill="${fill}" ${strokeProps}/>`,
    arrow: `<path d="M5 12h14m-7-7l7 7-7 7" fill="none" stroke="${fill}" stroke-width="${strokeWidth || 2}" stroke-linecap="round" stroke-linejoin="round"/>`,
    home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="${fill}" ${strokeProps}/><polyline points="9,22 9,12 15,12 15,22" fill="none" stroke="${stroke || fill}" stroke-width="${strokeWidth || 2}"/>`,
    user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="${fill}" stroke-width="${strokeWidth || 2}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" fill="none" stroke="${fill}" stroke-width="${strokeWidth || 2}" stroke-linecap="round" stroke-linejoin="round"/>`,
    mail: `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="${fill}" ${strokeProps}/><polyline points="22,6 12,13 2,6" fill="none" stroke="${stroke || '#fff'}" stroke-width="${strokeWidth || 2}"/>`,
  };
  
  const iconPath = icons[iconName] || icons.circle;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${iconPath}</svg>`;
};

const CanvasShapeElement: React.FC<{ element: ShapeElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  const { updateElement } = useCanvasStore();
  
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
    stroke: element.stroke || (isSelected ? '#007bff' : undefined),
    strokeWidth: element.strokeWidth || (isSelected ? 2 : 0),
    dash: element.strokeDashArray,
    listening: !element.locked,
    draggable: !element.locked && isSelected,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    onDragEnd: (e: any) => {
      updateElement(element.id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onTransformEnd: (e: any) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      updateElement(element.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });
      
      // Reset scale
      node.scaleX(1);
      node.scaleY(1);
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
  
  const {
    stageRef,
    layerRef,
    handleStageClick,
    handleStageMouseDown,
    handleWheel,
    fitStageIntoParentContainer,
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

  // Calculate optimal canvas size based on container - FRAME EDGE-TO-EDGE
  const calculateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Frame goes edge-to-edge, but keep canvas content reasonably sized
      const availableWidth = width - 40; // Keep some margin for canvas content
      const availableHeight = height - 40;
      
      // Frame fills container, canvas content stays centered and reasonably sized
      const targetWidth = availableWidth;
      const targetHeight = availableHeight;
      
      // Keep canvas content at reasonable size (not edge-to-edge)
      let canvasWidth = Math.max(Math.min(targetWidth, 1000), 300);
      let canvasHeight = Math.max(Math.min(targetHeight, 700), 200);
      
      const newCanvasSize = { 
        width: Math.round(canvasWidth), 
        height: Math.round(canvasHeight) 
      };
      
      // Update more responsively for autofit (lower threshold)
      if (Math.abs(newCanvasSize.width - canvasSize.width) > 10 || 
          Math.abs(newCanvasSize.height - canvasSize.height) > 10) {
        console.log('📐 Canvas frame edge-to-edge, content sized:', newCanvasSize, `Container: ${width}x${height}`);
        setCanvasSize(newCanvasSize);
      }
    }
  }, [canvasSize, setCanvasSize]);

  // Handle container resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      
      // AUTOFIT: Update both the canvas size in store AND the stage size
      fitCanvasToContainer(width, height); // Update canvas content size for autofit
      calculateCanvasSize();
      
      // Delay fitting to ensure canvas size is updated first
      requestAnimationFrame(() => {
        fitStageIntoParentContainer();
      });
    }
  }, [fitStageIntoParentContainer, calculateCanvasSize, fitCanvasToContainer]);

  useEffect(() => {
    // Initial resize calculation
    handleResize();
    
    // Use ResizeObserver for better performance if available
    if (window.ResizeObserver && containerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        // Throttle resize events to avoid excessive calculations
        requestAnimationFrame(handleResize);
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    } else {
      // Fallback to window resize events
      const throttledResize = () => {
        requestAnimationFrame(handleResize);
      };
      window.addEventListener('resize', throttledResize);
      return () => window.removeEventListener('resize', throttledResize);
    }
  }, [handleResize]);

  // Recalculate when canvas size changes in store
  useEffect(() => {
    if (containerRef.current) {
      fitStageIntoParentContainer();
    }
  }, [canvasSize, fitStageIntoParentContainer]);

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
      
      // Calculate drop position relative to canvas
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      
      // Handle different types of dragged items
      switch (data.type) {
        case 'test':
          console.log('🧪 Test drop successful!', data.message);
          alert('Drag and drop is working! ' + data.message);
          break;
          
        case 'photo':
          addElement({
            id: generateId(),
            type: 'image',
            x: canvasX - 100, // Center the image
            y: canvasY - 100,
            width: 200,
            height: 200,
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
          addElement({
            id: generateId(),
            type: 'shape',
            x: canvasX - 50,
            y: canvasY - 50,
            width: 100,
            height: 100,
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
          addElement({
            id: generateId(),
            type: 'text',
            x: canvasX - 100,
            y: canvasY - 25,
            width: 200,
            height: 50,
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
        x={pan.x}
        y={pan.y}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onWheel={handleWheel}
        draggable={selection.length === 0} // Only allow stage dragging when nothing is selected
        
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
        {/* Main canvas background */}
        <Layer ref={layerRef} imageSmoothingEnabled={false}>
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill={backgroundColor}
            listening={false}
            perfectDrawEnabled={false}
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
