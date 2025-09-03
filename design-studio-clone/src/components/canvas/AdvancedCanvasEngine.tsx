import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes
import { Stage, Layer, Rect, Text, Image, Group, Circle, Ellipse, RegularPolygon, Star, Arrow, Line } from 'react-konva';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasStore } from '@/stores/canvasStore';
import { usePageStore } from '@/stores/pageStore';
import { TransformControls } from './TransformControls';
import { LassoSelection, useLassoSelection } from './LassoSelection';
import { SelectionBox, useSelectionBox } from './SelectionBox';
import { PageCarousel } from './PageCarousel';
import { ZoomControls } from './ZoomControls';
import { CanvasToolbar } from './CanvasToolbar';
import { PositionCallout, usePositionCallout } from './PositionCallout';
import { styled } from '@styles/goober-setup';
import type { CanvasElement, TextElement, ImageElement, ShapeElement } from '@/types/canvas';

interface AdvancedCanvasEngineProps {
  className?: string;
}

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: calc(100% - 90px); /* Account for page carousel */
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

const CanvasWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

// Enhanced Konva element renderers with position tracking
const CanvasTextElement: React.FC<{ element: TextElement; isSelected: boolean; onPositionChange?: (x: number, y: number) => void }> = React.memo(({ element, isSelected, onPositionChange }) => {
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
      onDragMove={(e) => {
        const x = e.target.x();
        const y = e.target.y();
        onPositionChange?.(x, y);
      }}
      onDragEnd={(e) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
        onPositionChange?.(0, 0); // Hide position callout
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
        
        node.scaleX(1);
        node.scaleY(1);
      }}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
    />
  );
});

const CanvasImageElement: React.FC<{ element: ImageElement; isSelected: boolean; onPositionChange?: (x: number, y: number) => void }> = React.memo(({ element, isSelected, onPositionChange }) => {
  const { updateElement } = useCanvasStore();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.crossOrigin = 'anonymous';
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
      onDragMove={(e) => {
        const x = e.target.x();
        const y = e.target.y();
        onPositionChange?.(x, y);
      }}
      onDragEnd={(e) => {
        updateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
        onPositionChange?.(0, 0);
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
        
        node.scaleX(1);
        node.scaleY(1);
      }}
      perfectDrawEnabled={false}
    />
  );
});

const CanvasShapeElement: React.FC<{ element: ShapeElement; isSelected: boolean; onPositionChange?: (x: number, y: number) => void }> = React.memo(({ element, isSelected, onPositionChange }) => {
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
    onDragMove: (e: any) => {
      const x = e.target.x();
      const y = e.target.y();
      onPositionChange?.(x, y);
    },
    onDragEnd: (e: any) => {
      updateElement(element.id, {
        x: e.target.x(),
        y: e.target.y(),
      });
      onPositionChange?.(0, 0);
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

const CanvasElementRenderer: React.FC<{ 
  element: CanvasElement; 
  isSelected: boolean; 
  onPositionChange?: (x: number, y: number) => void 
}> = React.memo(({ element, isSelected, onPositionChange }) => {
  switch (element.type) {
    case 'text':
      return <CanvasTextElement element={element as TextElement} isSelected={isSelected} onPositionChange={onPositionChange} />;
    case 'image':
      return <CanvasImageElement element={element as ImageElement} isSelected={isSelected} onPositionChange={onPositionChange} />;
    case 'shape':
      return <CanvasShapeElement element={element as ShapeElement} isSelected={isSelected} onPositionChange={onPositionChange} />;
    default:
      return null;
  }
});

const AdvancedCanvasEngine: React.FC<AdvancedCanvasEngineProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const {
    stageRef,
    layerRef,
    handleStageClick,
    handleStageMouseDown,
    handleWheel,
    fitStageIntoParentContainer,
  } = useCanvas();
  
  // Canvas store
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
    setZoom,
    deleteElements,
    duplicateElements,
    moveToFront,
    moveToBack
  } = useCanvasStore();

  // Page store
  const {
    pages,
    currentPageId,
    addPage,
    duplicatePage,
    deletePage,
    setCurrentPage,
    reorderPages,
    getCurrentPage,
  } = usePageStore();

  // Position callout
  const { calloutState, showCallout, hideCallout, updatePosition } = usePositionCallout();

  // Selection tools
  const { isLassoActive, handleSelectionComplete: handleLassoComplete } = useLassoSelection();
  const { isBoxActive, handleSelectionComplete: handleBoxComplete } = useSelectionBox();

  // Get current page elements only
  const currentPageElements = useMemo(() => {
    const currentPage = getCurrentPage();
    if (!currentPage) return [];
    
    return elements.filter(element => currentPage.elements.includes(element.id));
  }, [elements, getCurrentPage]);

  // Sorted elements for rendering
  const sortedElements = useMemo(() => {
    return [...currentPageElements].sort((a, b) => a.zIndex - b.zIndex);
  }, [currentPageElements]);

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
    
    if (window.ResizeObserver && containerRef.current) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [handleResize]);

  // Canvas toolbar actions
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    selection.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        const updates: Partial<CanvasElement> = {};
        if (direction === 'horizontal') {
          updates.scaleX = -element.scaleX;
        } else {
          updates.scaleY = -element.scaleY;
        }
        transformElements([id], updates);
      }
    });
  }, [selection, elements, transformElements]);

  const handleEffects = useCallback(() => {
    // TODO: Open effects panel
    console.log('Effects for:', selection);
  }, [selection]);

  const handleFitToPage = useCallback(() => {
    // TODO: Implement fit to page logic
    console.log('Fit to page:', selection);
  }, [selection]);

  const handleApplyMask = useCallback(() => {
    // TODO: Implement masking
    console.log('Apply mask:', selection);
  }, [selection]);

  const handleAnimate = useCallback(() => {
    // TODO: Open animation panel
    console.log('Animate:', selection);
  }, [selection]);

  const handleDelete = useCallback(() => {
    deleteElements(selection);
  }, [selection, deleteElements]);

  const handleDuplicate = useCallback(() => {
    duplicateElements(selection);
  }, [selection, duplicateElements]);

  const handleBringToFront = useCallback(() => {
    selection.forEach(id => moveToFront(id));
  }, [selection, moveToFront]);

  const handleSendToBack = useCallback(() => {
    selection.forEach(id => moveToBack(id));
  }, [selection, moveToBack]);

  // Zoom controls
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, [setZoom]);

  const handleFitToScreen = useCallback(() => {
    fitStageIntoParentContainer();
  }, [fitStageIntoParentContainer]);

  // Position callout handler
  const handleElementPositionChange = useCallback((x: number, y: number) => {
    if (x === 0 && y === 0) {
      hideCallout();
    } else {
      // Convert canvas coordinates to screen coordinates
      const stage = stageRef.current;
      if (stage) {
        const stageBox = stage.container().getBoundingClientRect();
        const screenX = stageBox.left + (x + pan.x) * zoom;
        const screenY = stageBox.top + (y + pan.y) * zoom;
        updatePosition(screenX, screenY);
        if (!calloutState.visible) {
          showCallout(screenX, screenY);
        }
      }
    }
  }, [stageRef, pan, zoom, calloutState.visible, showCallout, hideCallout, updatePosition]);

  return (
    <CanvasWrapper>
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
          draggable={selection.length === 0}
          
          // Performance optimizations
          perfectDrawEnabled={false}
          imageSmoothingEnabled={true}
          hitGraphEnabled={true}
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
                  onPositionChange={handleElementPositionChange}
                />
              </Group>
            ))}
          </Layer>
          
          {/* UI overlay layer */}
          <Layer 
            listening={false}
            perfectDrawEnabled={false}
          >
            {/* Transform controls */}
            {selection.length > 0 && (() => {
              const bounds = getSelectionBounds();
              return bounds && (
                <TransformControls
                  bounds={bounds}
                  enableRotation={selection.length === 1}
                  enableSnapping={true}
                  onTransformStart={() => {
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
                    const scaleX = newBounds.width / bounds.width;
                    const scaleY = newBounds.height / bounds.height;
                    
                    selection.forEach(id => {
                      const element = elements.find(el => el.id === id);
                      if (element) {
                        let newProps: Partial<CanvasElement> = {};
                        
                        if (selection.length === 1) {
                          newProps = {
                            x: newBounds.x,
                            y: newBounds.y,
                            width: newBounds.width,
                            height: newBounds.height,
                            rotation: newBounds.rotation || 0,
                          };
                        } else {
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
                    hideCallout();
                  }}
                />
              );
            })()}
            
            {/* Selection tools */}
            <LassoSelection
              isActive={isLassoActive}
              onSelectionComplete={handleLassoComplete}
            />
            
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
      
      {/* Canvas Toolbar */}
      <CanvasToolbar
        selectedElements={selection}
        onFlip={handleFlip}
        onEffects={handleEffects}
        onFitToPage={handleFitToPage}
        onApplyMask={handleApplyMask}
        onAnimate={handleAnimate}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />
      
      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        onZoomChange={handleZoomChange}
        fitToScreen={handleFitToScreen}
      />
      
      {/* Position Callout */}
      <PositionCallout
        x={calloutState.x}
        y={calloutState.y}
        visible={calloutState.visible}
        elementId={calloutState.elementId}
      />
      
      {/* Page Carousel */}
      <PageCarousel
        pages={pages}
        currentPageId={currentPageId}
        onPageSelect={setCurrentPage}
        onPageAdd={addPage}
        onPageDuplicate={duplicatePage}
        onPageDelete={deletePage}
        onPageReorder={reorderPages}
      />
    </CanvasWrapper>
  );
};

CanvasTextElement.displayName = 'CanvasTextElement';
CanvasImageElement.displayName = 'CanvasImageElement';
CanvasShapeElement.displayName = 'CanvasShapeElement';
CanvasElementRenderer.displayName = 'CanvasElementRenderer';

export default observer(AdvancedCanvasEngine);