import React, { useState, useCallback, useRef } from 'react';
import { Rect, Group, Circle, Text as KonvaText } from 'react-konva';
import type { CropPosition } from '@/stores/canvasStore';
import type { ImageElement } from '@/types/canvas';

interface ImageCropOverlayProps {
  imageElement: ImageElement;
  cropArea: CropPosition;
  onCropUpdate: (cropArea: CropPosition) => void;
  onCropFinish: () => void;
}

export const ImageCropOverlay: React.FC<ImageCropOverlayProps> = ({
  imageElement,
  cropArea,
  onCropUpdate,
  onCropFinish
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleSize = 12; // White circle handles like Polotno
  const borderWidth = 2;

  // Handle drag start
  const handleDragStart = useCallback((handle: string) => (e: any) => {
    setIsDragging(true);
    setDragHandle(handle);
    startPosRef.current = {
      x: e.target.x(),
      y: e.target.y()
    };
    e.cancelBubble = true;
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((e: any) => {
    if (!isDragging || !dragHandle) return;

    const currentX = e.target.x();
    const currentY = e.target.y();
    const deltaX = currentX - startPosRef.current.x;
    const deltaY = currentY - startPosRef.current.y;

    const newCropArea = { ...cropArea };

    // Convert stage coordinates to image-relative coordinates
    const imageRelativeDeltaX = deltaX;
    const imageRelativeDeltaY = deltaY;

    switch (dragHandle) {
      case 'top-left':
        newCropArea.x = Math.max(0, cropArea.x + imageRelativeDeltaX);
        newCropArea.y = Math.max(0, cropArea.y + imageRelativeDeltaY);
        newCropArea.width = Math.max(20, cropArea.width - imageRelativeDeltaX);
        newCropArea.height = Math.max(20, cropArea.height - imageRelativeDeltaY);
        break;
      
      case 'top-right':
        newCropArea.y = Math.max(0, cropArea.y + imageRelativeDeltaY);
        newCropArea.width = Math.max(20, cropArea.width + imageRelativeDeltaX);
        newCropArea.height = Math.max(20, cropArea.height - imageRelativeDeltaY);
        break;
      
      case 'bottom-left':
        newCropArea.x = Math.max(0, cropArea.x + imageRelativeDeltaX);
        newCropArea.width = Math.max(20, cropArea.width - imageRelativeDeltaX);
        newCropArea.height = Math.max(20, cropArea.height + imageRelativeDeltaY);
        break;
      
      case 'bottom-right':
        newCropArea.width = Math.max(20, cropArea.width + imageRelativeDeltaX);
        newCropArea.height = Math.max(20, cropArea.height + imageRelativeDeltaY);
        break;
      
      case 'top':
        newCropArea.y = Math.max(0, cropArea.y + imageRelativeDeltaY);
        newCropArea.height = Math.max(20, cropArea.height - imageRelativeDeltaY);
        break;
      
      case 'bottom':
        newCropArea.height = Math.max(20, cropArea.height + imageRelativeDeltaY);
        break;
      
      case 'left':
        newCropArea.x = Math.max(0, cropArea.x + imageRelativeDeltaX);
        newCropArea.width = Math.max(20, cropArea.width - imageRelativeDeltaX);
        break;
      
      case 'right':
        newCropArea.width = Math.max(20, cropArea.width + imageRelativeDeltaX);
        break;
      
      case 'center':
        newCropArea.x = Math.max(0, Math.min(imageElement.width - cropArea.width, cropArea.x + imageRelativeDeltaX));
        newCropArea.y = Math.max(0, Math.min(imageElement.height - cropArea.height, cropArea.y + imageRelativeDeltaY));
        break;
    }

    // Ensure crop area stays within image bounds
    newCropArea.x = Math.max(0, newCropArea.x);
    newCropArea.y = Math.max(0, newCropArea.y);
    newCropArea.width = Math.min(imageElement.width - newCropArea.x, newCropArea.width);
    newCropArea.height = Math.min(imageElement.height - newCropArea.y, newCropArea.height);

    onCropUpdate(newCropArea);
    startPosRef.current = {
      x: currentX,
      y: currentY
    };
  }, [isDragging, dragHandle, cropArea, onCropUpdate, imageElement]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  // Handle double click to finish crop
  const handleDoubleClick = useCallback(() => {
    onCropFinish();
  }, [onCropFinish]);

  const cropX = imageElement.x + cropArea.x;
  const cropY = imageElement.y + cropArea.y;

  return (
    <Group>
      {/* Dimmed overlay outside crop area */}
      {/* Top */}
      <Rect
        x={imageElement.x}
        y={imageElement.y}
        width={imageElement.width}
        height={cropArea.y}
        fill="black"
        opacity={0.5}
        listening={false}
      />
      
      {/* Bottom */}
      <Rect
        x={imageElement.x}
        y={cropY + cropArea.height}
        width={imageElement.width}
        height={imageElement.height - cropArea.y - cropArea.height}
        fill="black"
        opacity={0.5}
        listening={false}
      />
      
      {/* Left */}
      <Rect
        x={imageElement.x}
        y={cropY}
        width={cropArea.x}
        height={cropArea.height}
        fill="black"
        opacity={0.5}
        listening={false}
      />
      
      {/* Right */}
      <Rect
        x={cropX + cropArea.width}
        y={cropY}
        width={imageElement.width - cropArea.x - cropArea.width}
        height={cropArea.height}
        fill="black"
        opacity={0.5}
        listening={false}
      />

      {/* Crop border - solid line like Polotno */}
      <Rect
        x={cropX}
        y={cropY}
        width={cropArea.width}
        height={cropArea.height}
        stroke="#48aff0"
        strokeWidth={borderWidth}
        fill="transparent"
        listening={false}
      />

      {/* Done/Cancel buttons - Polotno style */}
      <Group>
        {/* Done button (checkmark) */}
        <Circle
          x={cropX + 20}
          y={cropY - 30}
          radius={15}
          fill="#48aff0"
          stroke="white"
          strokeWidth={2}
          onClick={onCropFinish}
          onTap={onCropFinish}
        />
        <KonvaText
          x={cropX + 15}
          y={cropY - 35}
          text="✓"
          fontSize={14}
          fill="white"
          fontStyle="bold"
          listening={false}
        />
        
        {/* Cancel button (X) */}
        <Circle
          x={cropX + 60}
          y={cropY - 30}
          radius={15}
          fill="#666"
          stroke="white"
          strokeWidth={2}
          onClick={() => {
            // Cancel crop - we'll need to add this prop
            console.log('Cancel crop');
          }}
          onTap={() => {
            console.log('Cancel crop');
          }}
        />
        <KonvaText
          x={cropX + 56}
          y={cropY - 35}
          text="✕"
          fontSize={12}
          fill="white"
          fontStyle="bold"
          listening={false}
        />
      </Group>

      {/* Corner handles - White circles like Polotno */}
      <Circle
        x={cropX}
        y={cropY}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('top-left')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <Circle
        x={cropX + cropArea.width}
        y={cropY}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('top-right')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <Circle
        x={cropX}
        y={cropY + cropArea.height}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('bottom-left')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <Circle
        x={cropX + cropArea.width}
        y={cropY + cropArea.height}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('bottom-right')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />

      {/* Edge handles - White circles */}
      <Circle
        x={cropX + cropArea.width / 2}
        y={cropY}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('top')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <Circle
        x={cropX + cropArea.width / 2}
        y={cropY + cropArea.height}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('bottom')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <Circle
        x={cropX}
        y={cropY + cropArea.height / 2}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('left')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
      
      <Circle
        x={cropX + cropArea.width}
        y={cropY + cropArea.height / 2}
        radius={handleSize / 2}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('right')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />

      {/* Center drag area */}
      <Rect
        x={cropX}
        y={cropY}
        width={cropArea.width}
        height={cropArea.height}
        fill="transparent"
        draggable={true}
        onDragStart={handleDragStart('center')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDblClick={handleDoubleClick}
      />
    </Group>
  );
};