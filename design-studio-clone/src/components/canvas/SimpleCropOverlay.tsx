import React, { useState, useCallback, useRef } from 'react';
import { Rect, Group, Circle } from 'react-konva';
import type { ImageElement } from '@/types/canvas';

interface SimpleCropOverlayProps {
  imageElement: ImageElement;
  onCropChange: (cropData: { x: number; y: number; width: number; height: number }) => void;
  onCropFinish: () => void;
  onCropCancel: () => void;
}

export const SimpleCropOverlay: React.FC<SimpleCropOverlayProps> = ({
  imageElement,
  onCropChange,
  onCropFinish,
  onCropCancel
}) => {
  // Current crop area in display coordinates
  const [cropArea, setCropArea] = useState(() => {
    // If there's existing crop data, convert from original to display coordinates
    if (imageElement.cropData) {
      const scaleX = imageElement.width / imageElement.originalWidth;
      const scaleY = imageElement.height / imageElement.originalHeight;
      return {
        x: imageElement.cropData.x * scaleX,
        y: imageElement.cropData.y * scaleY,
        width: imageElement.cropData.width * scaleX,
        height: imageElement.cropData.height * scaleY
      };
    }
    // Default to full image in display coordinates
    return {
      x: 0,
      y: 0,
      width: imageElement.width,
      height: imageElement.height
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialCrop = useRef(cropArea);

  // Convert display coordinates to original image coordinates
  const convertToOriginalCoords = useCallback((displayCrop: typeof cropArea) => {
    const scaleX = imageElement.originalWidth / imageElement.width;
    const scaleY = imageElement.originalHeight / imageElement.height;
    
    return {
      x: Math.round(displayCrop.x * scaleX),
      y: Math.round(displayCrop.y * scaleY),
      width: Math.round(displayCrop.width * scaleX),
      height: Math.round(displayCrop.height * scaleY)
    };
  }, [imageElement]);

  // Update crop area and notify parent
  const updateCrop = useCallback((newCropArea: typeof cropArea) => {
    // Constrain to image bounds
    const constrainedCrop = {
      x: Math.max(0, newCropArea.x),
      y: Math.max(0, newCropArea.y),
      width: Math.min(newCropArea.width, imageElement.width - newCropArea.x),
      height: Math.min(newCropArea.height, imageElement.height - newCropArea.y)
    };
    
    // Minimum crop size
    constrainedCrop.width = Math.max(20, constrainedCrop.width);
    constrainedCrop.height = Math.max(20, constrainedCrop.height);
    
    setCropArea(constrainedCrop);
    
    // Convert to original coordinates and notify parent
    const originalCoords = convertToOriginalCoords(constrainedCrop);
    onCropChange(originalCoords);
  }, [imageElement, convertToOriginalCoords, onCropChange]);

  // Handle drag start
  const handleDragStart = useCallback((handle: string) => (e: any) => {
    setIsDragging(true);
    setDragHandle(handle);
    dragStart.current = { x: e.evt.clientX, y: e.evt.clientY };
    initialCrop.current = { ...cropArea };
    e.cancelBubble = true;
  }, [cropArea]);

  // Handle drag move  
  const handleDragMove = useCallback((e: any) => {
    if (!isDragging || !dragHandle) return;

    const deltaX = (e.evt.clientX - dragStart.current.x) / 1; // Adjust for zoom if needed
    const deltaY = (e.evt.clientY - dragStart.current.y) / 1;
    
    const newCrop = { ...initialCrop.current };
    
    switch (dragHandle) {
      case 'top-left':
        newCrop.x += deltaX;
        newCrop.y += deltaY;
        newCrop.width -= deltaX;
        newCrop.height -= deltaY;
        break;
      case 'top-right':
        newCrop.y += deltaY;
        newCrop.width += deltaX;
        newCrop.height -= deltaY;
        break;
      case 'bottom-left':
        newCrop.x += deltaX;
        newCrop.width -= deltaX;
        newCrop.height += deltaY;
        break;
      case 'bottom-right':
        newCrop.width += deltaX;
        newCrop.height += deltaY;
        break;
      case 'move':
        newCrop.x += deltaX;
        newCrop.y += deltaY;
        break;
    }
    
    updateCrop(newCrop);
  }, [isDragging, dragHandle, updateCrop]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  const cropX = imageElement.x + cropArea.x;
  const cropY = imageElement.y + cropArea.y;
  const handleSize = 8;

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
        opacity={0.6}
        listening={false}
      />
      
      {/* Bottom */}
      <Rect
        x={imageElement.x}
        y={cropY + cropArea.height}
        width={imageElement.width}
        height={imageElement.height - cropArea.y - cropArea.height}
        fill="black"
        opacity={0.6}
        listening={false}
      />
      
      {/* Left */}
      <Rect
        x={imageElement.x}
        y={cropY}
        width={cropArea.x}
        height={cropArea.height}
        fill="black"
        opacity={0.6}
        listening={false}
      />
      
      {/* Right */}
      <Rect
        x={cropX + cropArea.width}
        y={cropY}
        width={imageElement.width - cropArea.x - cropArea.width}
        height={cropArea.height}
        fill="black"
        opacity={0.6}
        listening={false}
      />

      {/* Crop border */}
      <Rect
        x={cropX}
        y={cropY}
        width={cropArea.width}
        height={cropArea.height}
        stroke="#48aff0"
        strokeWidth={2}
        fill="transparent"
        draggable={true}
        onDragStart={handleDragStart('move')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDblClick={onCropFinish}
      />

      {/* Corner handles */}
      <Circle
        x={cropX}
        y={cropY}
        radius={handleSize}
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
        radius={handleSize}
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
        radius={handleSize}
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
        radius={handleSize}
        fill="white"
        stroke="#48aff0"
        strokeWidth={2}
        draggable={true}
        onDragStart={handleDragStart('bottom-right')}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />

      {/* Action buttons */}
      <Group x={cropX + 20} y={cropY - 40}>
        {/* Done button */}
        <Circle
          x={0}
          y={0}
          radius={18}
          fill="#51cf66"
          stroke="white"
          strokeWidth={2}
          onClick={onCropFinish}
          onTap={onCropFinish}
        />
        
        {/* Cancel button */}
        <Circle
          x={45}
          y={0}
          radius={18}
          fill="#ff6b6b"
          stroke="white"
          strokeWidth={2}
          onClick={onCropCancel}
          onTap={onCropCancel}
        />
      </Group>
    </Group>
  );
};