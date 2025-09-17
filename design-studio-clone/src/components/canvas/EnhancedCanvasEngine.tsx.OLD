import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { Stage, Layer, Rect, Text, Image, Group, Circle, Ellipse, RegularPolygon, Star, Arrow, Line, Transformer } from 'react-konva';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasStore } from '@/stores/canvasStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMobileTouch } from '@/hooks/useMobileTouch';
import { TransformControls } from './TransformControls';
import { VisualFeedback } from './VisualFeedback';
import { PositionIndicator } from './PositionIndicator';
import { CanvasToolbar } from './CanvasToolbar';
import { AdvancedEffectsPanel } from './AdvancedEffectsPanel';
import { MaskingToolPanel } from './MaskingToolPanel';
import { CropToolPanel } from './CropToolPanel';
import { AnimationTimelinePanel } from './AnimationTimelinePanel';
import { IconRenderer } from '@/components/common/IconRenderer';
import type { CanvasElement, TextElement, ImageElement, ShapeElement, IconElement } from '@/types/canvas';

interface EnhancedCanvasEngineProps {
  className?: string;
}

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
      padding: 20,
      margin: 0,
      overflow: 'hidden',
      cursor: 'default',
      transform: 'translateZ(0)',
      willChange: 'transform',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}
  >
    {children}
  </div>
);

const EnhancedCanvasEngine: React.FC<EnhancedCanvasEngineProps> = observer(({ className }) => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<any>(null);
  
  // Canvas store and hooks
  const {
    elements,
    selection,
    canvasSize,
    zoom,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    clearSelection,
    setCanvasSize,
    setZoom,
  } = useCanvasStore();

  // Advanced tool state
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [showMaskingPanel, setShowMaskingPanel] = useState(false);
  const [showCropPanel, setShowCropPanel] = useState(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [showPositionIndicator, setShowPositionIndicator] = useState(false);

  // Custom hooks
  useKeyboardShortcuts();
  useMobileTouch(stageRef);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const maxWidth = Math.max(800, rect.width - 40);
        const maxHeight = Math.max(600, rect.height - 40);
        
        // Maintain aspect ratio while fitting in container
        let width = canvasSize.width * zoom;
        let height = canvasSize.height * zoom;
        
        if (width > maxWidth) {
          const scale = maxWidth / width;
          width = maxWidth;
          height = height * scale;
        }
        
        if (height > maxHeight) {
          const scale = maxHeight / height;
          height = maxHeight;
          width = width * scale;
        }
        
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [canvasSize, zoom]);

  // Get selected element for tools
  const currentSelectedElement = useMemo(() => {
    if (selection.length === 1) {
      return elements.find(el => el.id === selection[0]) || null;
    }
    return null;
  }, [selection, elements]);

  // Update selected element when selection changes
  useEffect(() => {
    setSelectedElement(currentSelectedElement);
    setShowPositionIndicator(!!currentSelectedElement);
  }, [currentSelectedElement]);

  // Advanced tool handlers
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!currentSelectedElement) return;

    const updates: any = {};
    if (direction === 'horizontal') {
      updates.scaleX = (currentSelectedElement.scaleX || 1) * -1;
    } else {
      updates.scaleY = (currentSelectedElement.scaleY || 1) * -1;
    }

    updateElement(currentSelectedElement.id, updates);
  }, [currentSelectedElement, updateElement]);

  const handleEffects = useCallback(() => {
    if (currentSelectedElement?.type === 'image') {
      setShowEffectsPanel(true);
    }
  }, [currentSelectedElement]);

  const handleApplyEffects = useCallback((effectsData: any) => {
    if (!currentSelectedElement) return;
    
    // Apply CSS filters to the element
    const filters = {
      brightness: effectsData.brightness,
      contrast: effectsData.contrast,
      saturation: effectsData.saturation,
      hue: effectsData.hue,
      blur: effectsData.blur,
      grayscale: effectsData.grayscale,
      sepia: effectsData.sepia,
      invert: effectsData.invert,
    };
    
    updateElement(currentSelectedElement.id, { filters });
  }, [currentSelectedElement, updateElement]);

  const handleFitToPage = useCallback(() => {
    if (!currentSelectedElement) return;

    const padding = 40;
    const availableWidth = canvasSize.width - padding * 2;
    const availableHeight = canvasSize.height - padding * 2;
    
    const scaleX = availableWidth / currentSelectedElement.width;
    const scaleY = availableHeight / currentSelectedElement.height;
    const scale = Math.min(scaleX, scaleY);
    
    const newWidth = currentSelectedElement.width * scale;
    const newHeight = currentSelectedElement.height * scale;
    
    updateElement(currentSelectedElement.id, {
      width: newWidth,
      height: newHeight,
      x: (canvasSize.width - newWidth) / 2,
      y: (canvasSize.height - newHeight) / 2,
    });
  }, [currentSelectedElement, canvasSize, updateElement]);

  const handleApplyMask = useCallback(() => {
    if (currentSelectedElement?.type === 'image') {
      setShowMaskingPanel(true);
    }
  }, [currentSelectedElement]);

  const handleApplyMaskData = useCallback((maskData: any) => {
    if (!currentSelectedElement) return;
    
    updateElement(currentSelectedElement.id, { mask: maskData });
  }, [currentSelectedElement, updateElement]);

  const handleCrop = useCallback(() => {
    if (currentSelectedElement?.type === 'image') {
      setShowCropPanel(true);
    }
  }, [currentSelectedElement]);

  const handleApplyCrop = useCallback((cropData: any) => {
    if (!currentSelectedElement) return;
    
    updateElement(currentSelectedElement.id, { 
      cropData,
      width: cropData.width,
      height: cropData.height,
    });
  }, [currentSelectedElement, updateElement]);

  const handleAnimate = useCallback(() => {
    setShowAnimationPanel(true);
  }, []);

  const handleApplyAnimation = useCallback((animationData: any) => {
    if (!currentSelectedElement) return;
    
    updateElement(currentSelectedElement.id, { animation: animationData });
  }, [currentSelectedElement, updateElement]);

  const handleRemoveBackground = useCallback(async () => {
    if (!currentSelectedElement || currentSelectedElement.type !== 'image') return;
    
    // This would integrate with an AI background removal service
    // For now, we'll simulate it by applying a mask
    const maskData = {
      type: 'ai-background-removal',
      processed: true,
    };
    
    updateElement(currentSelectedElement.id, { backgroundRemoved: true, mask: maskData });
  }, [currentSelectedElement, updateElement]);

  const handleDelete = useCallback(() => {
    selection.forEach(id => deleteElement(id));
    clearSelection();
  }, [selection, deleteElement, clearSelection]);

  const handleDuplicate = useCallback(() => {
    selection.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        const duplicated = {
          ...element,
          id: `${element.id}_copy_${Date.now()}`,
          x: element.x + 20,
          y: element.y + 20,
        };
        addElement(duplicated);
      }
    });
  }, [selection, elements, addElement]);

  const handleBringToFront = useCallback(() => {
    selection.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        updateElement(id, { zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1 });
      }
    });
  }, [selection, elements, updateElement]);

  const handleSendToBack = useCallback(() => {
    selection.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        updateElement(id, { zIndex: Math.min(...elements.map(el => el.zIndex || 0)) - 1 });
      }
    });
  }, [selection, elements, updateElement]);

  // Drag and drop handling
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const dropData = JSON.parse(data);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create new element based on drop data
      const newElement: CanvasElement = {
        id: `element_${Date.now()}`,
        type: dropData.type,
        x: x - 50, // Center on cursor
        y: y - 50,
        width: 100,
        height: 100,
        ...dropData,
      };

      addElement(newElement);
    } catch (error) {
      console.warn('Could not parse drop data:', error);
    }
  }, [addElement]);

  // Element renderer
  const renderElement = useCallback((element: CanvasElement) => {
    const commonProps = {
      x: element.x,
      y: element.y,
      draggable: true,
      onClick: () => selectElement(element.id),
      onDragEnd: (e: any) => {
        updateElement(element.id, { x: e.target.x(), y: e.target.y() });
      },
    };

    switch (element.type) {
      case 'text':
        const textElement = element as TextElement;
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={textElement.text}
            fontSize={textElement.fontSize}
            fill={textElement.fill}
            fontFamily={textElement.fontFamily}
            width={element.width}
            height={element.height}
          />
        );

      case 'image':
        const imageElement = element as ImageElement;
        return (
          <Image
            key={element.id}
            {...commonProps}
            image={imageElement.imageObj}
            width={element.width}
            height={element.height}
            filters={imageElement.filters}
          />
        );

      case 'shape':
        const shapeElement = element as ShapeElement;
        switch (shapeElement.shapeType) {
          case 'rectangle':
            return (
              <Rect
                key={element.id}
                {...commonProps}
                width={element.width}
                height={element.height}
                fill={shapeElement.fill}
                stroke={shapeElement.stroke}
                strokeWidth={shapeElement.strokeWidth}
              />
            );
          case 'circle':
            return (
              <Circle
                key={element.id}
                {...commonProps}
                radius={Math.min(element.width, element.height) / 2}
                fill={shapeElement.fill}
                stroke={shapeElement.stroke}
                strokeWidth={shapeElement.strokeWidth}
              />
            );
          case 'ellipse':
            return (
              <Ellipse
                key={element.id}
                {...commonProps}
                radiusX={element.width / 2}
                radiusY={element.height / 2}
                fill={shapeElement.fill}
                stroke={shapeElement.stroke}
                strokeWidth={shapeElement.strokeWidth}
              />
            );
          default:
            return null;
        }

      case 'icon':
        const iconElement = element as IconElement;
        return (
          <Group key={element.id} {...commonProps}>
            <IconRenderer
              iconName={iconElement.iconName}
              size={Math.min(element.width, element.height)}
              color={iconElement.fill}
            />
          </Group>
        );

      default:
        return null;
    }
  }, [selectElement, updateElement]);

  return (
    <CanvasContainer
      ref={containerRef}
      className={className}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Position Indicator */}
      <PositionIndicator
        element={selectedElement}
        visible={showPositionIndicator}
      />

      {/* Advanced Canvas Toolbar */}
      <CanvasToolbar
        selectedElements={selection}
        onFlip={handleFlip}
        onEffects={handleEffects}
        onFitToPage={handleFitToPage}
        onApplyMask={handleApplyMask}
        onCrop={handleCrop}
        onAnimate={handleAnimate}
        onRemoveBackground={handleRemoveBackground}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />

      {/* Main Canvas */}
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        ref={stageRef}
        style={{
          border: '2px solid #48aff0',
          borderRadius: '8px',
          background: 'white',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
        onMouseDown={(e) => {
          // Click on empty canvas to clear selection
          if (e.target === e.target.getStage()) {
            clearSelection();
          }
        }}
      >
        <Layer ref={layerRef}>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fill="#ffffff"
            listening={false}
          />

          {/* Elements */}
          {elements
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(renderElement)}

          {/* Transform controls for selected elements */}
          {currentSelectedElement && (
            <TransformControls
              bounds={{
                x: currentSelectedElement.x,
                y: currentSelectedElement.y,
                width: currentSelectedElement.width,
                height: currentSelectedElement.height,
                rotation: currentSelectedElement.rotation || 0,
              }}
              onTransform={(newBounds) => {
                updateElement(currentSelectedElement.id, {
                  x: newBounds.x,
                  y: newBounds.y,
                  width: newBounds.width,
                  height: newBounds.height,
                  rotation: newBounds.rotation,
                });
              }}
              enableRotation={true}
              enableSnapping={true}
            />
          )}

          {/* Visual feedback */}
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

      {/* Advanced Tool Panels */}
      <AdvancedEffectsPanel
        isOpen={showEffectsPanel}
        onClose={() => setShowEffectsPanel(false)}
        element={selectedElement}
        onApplyEffects={handleApplyEffects}
      />

      <MaskingToolPanel
        isOpen={showMaskingPanel}
        onClose={() => setShowMaskingPanel(false)}
        element={selectedElement}
        onApplyMask={handleApplyMaskData}
      />

      <CropToolPanel
        isOpen={showCropPanel}
        onClose={() => setShowCropPanel(false)}
        element={selectedElement}
        onApplyCrop={handleApplyCrop}
      />

      <AnimationTimelinePanel
        isOpen={showAnimationPanel}
        onClose={() => setShowAnimationPanel(false)}
        element={selectedElement}
        onApplyAnimation={handleApplyAnimation}
      />
    </CanvasContainer>
  );
});

EnhancedCanvasEngine.displayName = 'EnhancedCanvasEngine';

export default EnhancedCanvasEngine;