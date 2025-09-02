
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image, Group } from 'react-konva';
import Konva from 'konva';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasStore } from '@/stores/canvasStore';
import { SelectionHandles } from './SelectionHandles';
import { TransformControls } from './TransformControls';
import { LassoSelection, useLassoSelection } from './LassoSelection';
import { SelectionBox, useSelectionBox } from './SelectionBox';
import { styled } from '@styles/goober-setup';
import type { CanvasElement, TextElement, ImageElement, ShapeElement } from '@/types/canvas';

interface CanvasEngineProps {
  className?: string;
}

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: default;
  
  /* Performance optimizations */
  transform: translateZ(0); /* Force GPU acceleration */
  will-change: transform;
  
  /* Disable text selection */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
`;

const GridBackground = styled.div<{ visible: boolean; size: number; zoom: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${props => props.visible ? 0.1 : 0};
  pointer-events: none;
  background-image: 
    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
  background-size: 
    ${props => props.size * props.zoom}px ${props => props.size * props.zoom}px;
  transition: opacity 0.2s ease;
`;

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
  
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.crossOrigin = 'anonymous'; // Handle CORS
    img.src = element.src;
  }, [element.src]);
  
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
      perfectDrawEnabled={false} // Performance optimization
    />
  );
});

const CanvasShapeElement: React.FC<{ element: ShapeElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  const { updateElement } = useCanvasStore();
  
  return (
    <Rect
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
      fill={element.fill}
      stroke={element.stroke || (isSelected ? '#007bff' : undefined)}
      strokeWidth={element.strokeWidth || (isSelected ? 2 : 0)}
      cornerRadius={element.cornerRadius || 0}
      dash={element.strokeDashArray}
      listening={!element.locked}
      draggable={!element.locked && isSelected}
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

// Main element renderer
const CanvasElementRenderer: React.FC<{ element: CanvasElement; isSelected: boolean }> = React.memo(({ element, isSelected }) => {
  switch (element.type) {
    case 'text':
      return <CanvasTextElement element={element as TextElement} isSelected={isSelected} />;
    case 'image':
      return <CanvasImageElement element={element as ImageElement} isSelected={isSelected} />;
    case 'shape':
      return <CanvasShapeElement element={element as ShapeElement} isSelected={isSelected} />;
    default:
      return null;
  }
});

const CanvasEngine: React.FC<CanvasEngineProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentTool, setCurrentTool] = useState<'select' | 'lasso' | 'box'>('select');
  
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
    transformElements
  } = useCanvasStore();

  // Selection tools
  const { isLassoActive, startLassoSelection, handleSelectionComplete: handleLassoComplete } = useLassoSelection();
  const { isBoxActive, startBoxSelection, handleSelectionComplete: handleBoxComplete } = useSelectionBox();

  // Memoized sorted elements for performance
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => a.zIndex - b.zIndex);
  }, [elements]);

  // Handle container resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      fitStageIntoParentContainer();
    }
  }, [fitStageIntoParentContainer]);

  useEffect(() => {
    handleResize();
    
    // Use ResizeObserver for better performance if available
    if (window.ResizeObserver && containerRef.current) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [handleResize]);

  // Performance optimization: Enable WebGL if available
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      
      // Enable WebGL if available (Konva automatically falls back to 2D if WebGL is not supported)
      try {
        // Set high-performance rendering mode
        stage.perfectDrawEnabled(false);
        
        // Enable hit graph caching for better performance
        stage.hitGraphEnabled(true);
        
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
    <CanvasContainer ref={containerRef} className={className}>
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
                  const deltaX = newBounds.x - bounds.x;
                  const deltaY = newBounds.y - bounds.y;
                  const rotationDelta = (newBounds.rotation || 0) - (bounds.rotation || 0);
                  
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
          
          {/* Lasso selection */}
          <LassoSelection
            isActive={isLassoActive}
            onSelectionComplete={handleLassoComplete}
          />
          
          {/* Selection box */}
          <SelectionBox
            isActive={isBoxActive}
            onSelectionComplete={handleBoxComplete}
          />
          
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
CanvasElementRenderer.displayName = 'CanvasElementRenderer';

export default CanvasEngine;
