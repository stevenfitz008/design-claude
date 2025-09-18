import React, { useState, useEffect } from 'react';
import { Button, InputGroup, Icon } from '@blueprintjs/core';
import { TOOLS } from '../types/tools';
import { PhotosPanelSimple } from './panels/PhotosPanelSimple';
import { useCanvasStore } from '../stores/canvasStore';
import { usePageStore } from '../stores/pageStore';

// Basic working components for design review
export const LeftToolbar: React.FC<{ activeTool?: string; onToolChange?: (tool: string) => void }> = ({ activeTool = 'templates', onToolChange }) => {
  const [activeToolId, setActiveToolId] = useState(activeTool);
  
  const handleToolClick = (toolId: string) => {
    setActiveToolId(toolId);
    onToolChange?.(toolId);
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '72px', 
      backgroundColor: '#252a30',
      borderRight: '1px solid #495563',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 0',
      overflowY: 'auto',
      gap: '2px'
    }} data-testid="left-toolbar">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            margin: '4px 8px',
            padding: '6px 4px',
            background: activeToolId === tool.id ? 'rgba(72, 175, 240, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: activeToolId === tool.id ? '#48aff0' : '#a7b6c2',
            cursor: 'pointer',
            fontSize: '9px',
            fontWeight: '500',
            lineHeight: '1.2',
            transition: 'all 0.15s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            if (activeToolId !== tool.id) {
              e.currentTarget.style.background = 'rgba(167, 182, 194, 0.1)';
              e.currentTarget.style.color = '#f5f8fa';
            }
          }}
          onMouseLeave={(e) => {
            if (activeToolId !== tool.id) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#a7b6c2';
            }
          }}
          title={tool.description || tool.name}
        >
          <Icon 
            icon={tool.icon as any} 
            size={18}
            style={{ marginBottom: '2px' }}
          />
          <div style={{ 
            fontSize: '8px', 
            fontWeight: '400',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '48px'
          }}>
            {tool.name}
          </div>
        </button>
      ))}
    </div>
  );
};

export const MainCanvas: React.FC = () => {
  const { currentPageId, pages } = usePageStore();
  const {
    canvasImages,
    selectedImageId,
    isDragging,
    isResizing,
    dragOver,
    setCanvasImages,
    addCanvasImage,
    updateCanvasImage,
    removeCanvasImage,
    setSelectedImageId,
    setIsDragging,
    setIsResizing,
    setDragOver
  } = useCanvasStore();
  const [zoom, setZoom] = useState(100);
  const [showPositionCallout, setShowPositionCallout] = useState(false);
  const [calloutPosition, setCalloutPosition] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 });
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  
  const handleElementDrag = (elementId: string, position: { x: number; y: number }, mousePos: { x: number; y: number }) => {
    setShowPositionCallout(true);
    setCalloutPosition({
      x: mousePos.x,
      y: mousePos.y - 30,
      elementX: position.x,
      elementY: position.y
    });
  };

  const handleElementDragEnd = () => {
    setShowPositionCallout(false);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const currentPage = pages.find(p => p.id === currentPageId);

  useEffect(() => {
    // Listen for direct photo additions (for touch devices)
    const handleAddPhoto = (event: any) => {
      const photo = event.detail;
      // Use the advanced canvas engine's add element functionality
      console.log('Photo to be added via advanced canvas:', photo);
    };
    
    window.addEventListener('addPhotoToCanvas', handleAddPhoto);
    return () => window.removeEventListener('addPhotoToCanvas', handleAddPhoto);
  }, []);
  
  const addImageToCanvas = (photo: any, position: { x: number, y: number }) => {
    const newImage = {
      id: `img_${photo.id}_${Date.now()}`,
      photoId: photo.id,
      src: photo.urls.regular || photo.urls.small,
      alt: photo.alt_description || 'Unsplash photo',
      photographer: photo.user.name,
      position,
      size: { width: 200, height: 150 },
      rotation: 0,
      opacity: 1
    };
    
    addCanvasImage(newImage);
    console.log('Image added to canvas:', newImage);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'unsplash-photo' && data.photo) {
        const rect = e.currentTarget.getBoundingClientRect();
        const position = {
          x: e.clientX - rect.left - 100, // Offset to center image on cursor
          y: e.clientY - rect.top - 75
        };
        addImageToCanvas(data.photo, position);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  const moveImage = (imageId: string, newPosition: { x: number, y: number }) => {
    updateCanvasImage(imageId, { position: newPosition });
  };

  const resizeImage = (imageId: string, newSize: { width: number; height: number }) => {
    updateCanvasImage(imageId, { size: newSize });
  };

  const handleMouseDown = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;
    
    // Just select the image, don't start dragging yet
    setSelectedImageId(imageId);
    
    // Set up drag preparation with proper offset calculation
    const canvasRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!canvasRect) return;
    
    const imageRect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - imageRect.left;
    const offsetY = e.clientY - imageRect.top;
    
    // Store drag info but don't activate dragging yet
    const dragInfo = {
      imageId,
      offset: { x: offsetX, y: offsetY },
      startPos: { x: e.clientX, y: e.clientY },
      hasMoved: false
    };
    
    // Start drag detection on mouse move
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const distance = Math.sqrt(
        Math.pow(moveEvent.clientX - dragInfo.startPos.x, 2) + 
        Math.pow(moveEvent.clientY - dragInfo.startPos.y, 2)
      );
      
      // Only start dragging if mouse moved more than 3px
      if (distance > 3 && !dragInfo.hasMoved) {
        dragInfo.hasMoved = true;
        setIsDragging({
          imageId: dragInfo.imageId,
          offset: dragInfo.offset
        });
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, imageId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;
    
    setIsResizing({
      imageId,
      handle,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: { width: image.size.width, height: image.size.height }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const image = canvasImages.find(img => img.id === isDragging.imageId);
      if (!image) return;
      
      const newPosition = {
        x: Math.max(0, Math.min(800 - image.size.width, e.clientX - canvasRect.left - isDragging.offset.x)),
        y: Math.max(0, Math.min(600 - image.size.height, e.clientY - canvasRect.top - isDragging.offset.y))
      };
      moveImage(isDragging.imageId, newPosition);
    }
    
    if (isResizing) {
      const deltaX = e.clientX - isResizing.startPos.x;
      const deltaY = e.clientY - isResizing.startPos.y;
      
      let newWidth = isResizing.startSize.width;
      let newHeight = isResizing.startSize.height;
      
      switch (isResizing.handle) {
        case 'se': // bottom-right
          newWidth = Math.max(50, isResizing.startSize.width + deltaX);
          newHeight = Math.max(38, isResizing.startSize.height + deltaY);
          break;
        case 'sw': // bottom-left  
          newWidth = Math.max(50, isResizing.startSize.width - deltaX);
          newHeight = Math.max(38, isResizing.startSize.height + deltaY);
          break;
        case 'ne': // top-right
          newWidth = Math.max(50, isResizing.startSize.width + deltaX);
          newHeight = Math.max(38, isResizing.startSize.height - deltaY);
          break;
        case 'nw': // top-left
          newWidth = Math.max(50, isResizing.startSize.width - deltaX);
          newHeight = Math.max(38, isResizing.startSize.height - deltaY);
          break;
      }
      
      resizeImage(isResizing.imageId, { width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setIsResizing(null);
  };

  // Global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const canvasContainer = document.querySelector('[data-canvas-container]');
        if (!canvasContainer) return;
        
        const canvasRect = canvasContainer.getBoundingClientRect();
        const image = canvasImages.find(img => img.id === isDragging.imageId);
        if (!image) return;
        
        const newPosition = {
          x: Math.max(0, Math.min(800 - image.size.width, e.clientX - canvasRect.left - isDragging.offset.x)),
          y: Math.max(0, Math.min(600 - image.size.height, e.clientY - canvasRect.top - isDragging.offset.y))
        };
        moveImage(isDragging.imageId, newPosition);
      }
      
      if (isResizing) {
        const deltaX = e.clientX - isResizing.startPos.x;
        const deltaY = e.clientY - isResizing.startPos.y;
        
        let newWidth = isResizing.startSize.width;
        let newHeight = isResizing.startSize.height;
        
        switch (isResizing.handle) {
          case 'se': // bottom-right
            newWidth = Math.max(50, isResizing.startSize.width + deltaX);
            newHeight = Math.max(38, isResizing.startSize.height + deltaY);
            break;
          case 'sw': // bottom-left  
            newWidth = Math.max(50, isResizing.startSize.width - deltaX);
            newHeight = Math.max(38, isResizing.startSize.height + deltaY);
            break;
          case 'ne': // top-right
            newWidth = Math.max(50, isResizing.startSize.width + deltaX);
            newHeight = Math.max(38, isResizing.startSize.height - deltaY);
            break;
          case 'nw': // top-left
            newWidth = Math.max(50, isResizing.startSize.width - deltaX);
            newHeight = Math.max(38, isResizing.startSize.height - deltaY);
            break;
        }
        
        resizeImage(isResizing.imageId, { width: newWidth, height: newHeight });
      }
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(null);
      setIsResizing(null);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, canvasImages]);
  
  const selectImage = (imageId: string) => {
    setSelectedImageId(selectedImageId === imageId ? null : imageId);
  };
  
  const deleteImage = (imageId: string) => {
    removeCanvasImage(imageId);
  };
  
  return (
    <div style={{
      flex: 1,
      backgroundColor: '#2f343c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }} data-testid="main-canvas">
      <div 
        style={{
          width: '800px',
          height: '600px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          border: dragOver ? '2px dashed #48aff0' : '2px solid transparent',
          transition: 'border-color 0.2s ease'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-canvas-container
      >
        {canvasImages.length === 0 ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#666',
            fontSize: '16px',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📷</div>
            <div>Drag photos here to start designing</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>or click photos to add them</div>
          </div>
        ) : null}
        
        {canvasImages.map(image => (
          <div
            key={image.id}
            style={{
              position: 'absolute',
              left: image.position.x,
              top: image.position.y,
              width: image.size.width,
              height: image.size.height,
              transform: `rotate(${image.rotation}deg)`,
              opacity: image.opacity,
              cursor: 'move',
              border: selectedImageId === image.id ? '2px solid #48aff0' : '2px solid transparent',
              borderRadius: '4px',
              boxShadow: selectedImageId === image.id ? '0 0 12px rgba(72, 175, 240, 0.5)' : 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseDown={(e) => handleMouseDown(e, image.id)}
            onDoubleClick={() => deleteImage(image.id)}
            title={`Photo by ${image.photographer} • Click to select • Double-click to delete`}
          >
            <img
              src={image.src}
              alt={image.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '2px',
                pointerEvents: 'none'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/${image.size.width}/${image.size.height}?random=${image.photoId}`;
              }}
            />
            {selectedImageId === image.id && (
              <>
                {/* Resize handles */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#48aff0',
                    borderRadius: '50%',
                    cursor: 'nw-resize'
                  }}
                  onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'nw')}
                />
                <div 
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#48aff0',
                    borderRadius: '50%',
                    cursor: 'ne-resize'
                  }}
                  onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'ne')}
                />
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '-4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#48aff0',
                    borderRadius: '50%',
                    cursor: 'sw-resize'
                  }}
                  onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'sw')}
                />
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#48aff0',
                    borderRadius: '50%',
                    cursor: 'se-resize'
                  }}
                  onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'se')}
                />
              </>
            )}
          </div>
        ))}
        
        {/* Drop zone indicator */}
        {dragOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(72, 175, 240, 0.1)',
            border: '2px dashed #48aff0',
            borderRadius: '12px',
            padding: '20px 40px',
            fontSize: '18px',
            color: '#48aff0',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            Drop photo here
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components for image manipulation
const ResizeHandle: React.FC<{
  position: 'nw' | 'ne' | 'sw' | 'se';
  onResize: (deltaW: number, deltaH: number) => void;
}> = ({ position, onResize }) => {
  const getPositionStyles = () => {
    const base = {
      position: 'absolute' as const,
      width: '8px',
      height: '8px',
      backgroundColor: '#48aff0',
      borderRadius: '50%',
      cursor: `${position}-resize`
    };
    
    switch (position) {
      case 'nw': return { ...base, top: '-4px', left: '-4px' };
      case 'ne': return { ...base, top: '-4px', right: '-4px' };
      case 'sw': return { ...base, bottom: '-4px', left: '-4px' };
      case 'se': return { ...base, bottom: '-4px', right: '-4px' };
    }
  };
  
  return (
    <div
      className="resize-handle"
      style={getPositionStyles()}
      onMouseDown={(e) => {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          onResize(deltaX, deltaY);
        };
        
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
    />
  );
};

const ActionButton: React.FC<{
  icon: string;
  title: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, title, onClick, danger }) => (
  <button
    style={{
      width: '24px',
      height: '24px',
      backgroundColor: danger ? '#db3737' : '#394b59',
      border: '1px solid #495563',
      borderRadius: '3px',
      color: '#f5f8fa',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = danger ? '#f55656' : '#48aff0';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = danger ? '#db3737' : '#394b59';
    }}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={title}
  >
    {icon}
  </button>
);

export const RightPanel: React.FC<{ activeTool?: string }> = ({ activeTool = 'templates' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Panel-specific components
  const TemplatesPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Templates</h3>
      <div style={{ color: '#a7b6c2' }}>Browse design templates</div>
    </div>
  );

  const TextPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Text</h3>
      <div style={{ color: '#a7b6c2' }}>Add and style text elements</div>
    </div>
  );

  const IconsPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Icons</h3>
      <div style={{ color: '#a7b6c2' }}>Browse and add icons</div>
    </div>
  );

  const ShapesPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Shapes</h3>
      <div style={{ color: '#a7b6c2' }}>Add geometric shapes</div>
    </div>
  );

  const UploadPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Upload</h3>
      <div style={{ color: '#a7b6c2' }}>Upload your own files</div>
    </div>
  );

  const VideosPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Videos</h3>
      <div style={{ color: '#a7b6c2' }}>Add and edit videos</div>
    </div>
  );

  const BackgroundPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Background</h3>
      <div style={{ color: '#a7b6c2' }}>Set canvas background</div>
    </div>
  );

  const LayersPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Layers</h3>
      <div style={{ color: '#a7b6c2' }}>Manage element layers</div>
    </div>
  );

  const ResizePanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Resize</h3>
      <div style={{ color: '#a7b6c2' }}>Adjust canvas dimensions</div>
    </div>
  );

  const QuotesPanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Quotes</h3>
      <div style={{ color: '#a7b6c2' }}>Add inspirational quotes</div>
    </div>
  );

  const QRCodePanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>QR Code</h3>
      <div style={{ color: '#a7b6c2' }}>Generate QR codes</div>
    </div>
  );

  const AIImagePanel: React.FC = () => (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>AI Image</h3>
      <div style={{ color: '#a7b6c2' }}>Generate images with AI</div>
    </div>
  );

  const PhotosPanel: React.FC = () => {
    const mockPhotos = [
      { id: '1', url: 'https://picsum.photos/200/150?random=1', title: 'Mountain Landscape' },
      { id: '2', url: 'https://picsum.photos/200/200?random=2', title: 'Abstract Art' },
      { id: '3', url: 'https://picsum.photos/200/180?random=3', title: 'City View' },
      { id: '4', url: 'https://picsum.photos/200/160?random=4', title: 'Nature Scene' },
      { id: '5', url: 'https://picsum.photos/200/190?random=5', title: 'Architecture' },
      { id: '6', url: 'https://picsum.photos/200/170?random=6', title: 'Technology' }
    ];

    return (
      <>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #495563' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            Photos
          </h3>
          <InputGroup
            leftIcon="search"
            placeholder="Search photos..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            style={{ marginBottom: '12px' }}
          />
          <div style={{ fontSize: '12px', color: '#a7b6c2' }}>
            Photos by <a href="https://unsplash.com" style={{ color: '#48aff0' }}>Unsplash</a>
          </div>
        </div>
        
        {/* Photos Grid */}
        <div style={{ 
          flex: 1, 
          padding: '16px', 
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {mockPhotos.map(photo => (
            <div 
              key={photo.id}
              style={{
                border: '1px solid #495563',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: '#2f343c'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#48aff0';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#495563';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => console.log('Photo clicked:', photo.id)}
            >
              <img 
                src={photo.url} 
                alt={photo.title}
                style={{ width: '100%', height: '120px', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
        
        {/* Load More Button */}
        <div style={{ padding: '16px', borderTop: '1px solid #495563' }}>
          <Button 
            text="Load More Photos"
            fill
            onClick={() => console.log('Load more clicked')}
          />
        </div>
      </>
    );
  };

  const renderPanelContent = () => {
    switch (activeTool) {
      case 'my-designs':
      case 'templates':
        return <TemplatesPanel />;
      case 'text':
        return <TextPanel />;
      case 'photos':
        return <PhotosPanelSimple />;
      case 'icons':
        return <IconsPanel />;
      case 'shapes':
        return <ShapesPanel />;
      case 'upload':
        return <UploadPanel />;
      case 'videos':
        return <VideosPanel />;
      case 'background':
        return <BackgroundPanel />;
      case 'layers':
        return <LayersPanel />;
      case 'resize':
        return <ResizePanel />;
      case 'quotes':
        return <QuotesPanel />;
      case 'qr-code':
        return <QRCodePanel />;
      case 'ai-img':
        return <AIImagePanel />;
      default:
        return <TemplatesPanel />;
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '350px',
      height: '100%',
      backgroundColor: '#394b59',
      borderLeft: '1px solid #495563',
      display: 'flex',
      flexDirection: 'column',
      color: '#f5f8fa'
    }} data-testid="right-panel">
      {renderPanelContent()}
    </div>
  );
};

export const TopNavigation: React.FC<{ 
  projectName?: string;
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}> = ({ projectName = 'Untitled Design' }) => (
  <div style={{
    height: '64px',
    backgroundColor: '#252a30',
    borderBottom: '1px solid #495563',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    color: '#f5f8fa'
  }} data-testid="top-navigation">
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ fontSize: '18px', fontWeight: '600' }}>🎨 Design Studio</div>
      <div style={{ fontSize: '14px', color: '#a7b6c2' }}>{projectName}</div>
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button icon="floppy-disk" minimal onClick={() => console.log('Save')}>Save</Button>
      <Button icon="share" minimal onClick={() => console.log('Share')}>Share</Button>
      <Button icon="download" intent="primary" onClick={() => console.log('Download')}>Download</Button>
    </div>
  </div>
);