import React, { useRef, useEffect, useState, useCallback } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes
import { Text as KonvaText, Group } from 'react-konva';
import Konva from 'konva';
import { Html } from 'react-konva-utils';
import { useCanvasStore } from '@/stores/canvasStore';
import type { TextElement as TextElementType } from '@/types/canvas';

interface TextElementProps {
  element: TextElementType;
  isSelected: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onFinishEdit: (newText: string) => void;
  onTransform?: (attrs: any) => void;
}

export const TextElement: React.FC<TextElementProps> = observer(({
  element,
  isSelected,
  isEditing,
  onStartEdit,
  onFinishEdit,
  onTransform
}) => {
  const { updateElement } = useCanvasStore();
  const textRef = useRef<Konva.Text>(null);
  const groupRef = useRef<Konva.Group>(null);
  const [textareaValue, setTextareaValue] = useState(element.text);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback(() => {
    if (!element.locked) {
      onStartEdit();
    }
  }, [element.locked, onStartEdit]);

  // Handle drag end
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateElement(element.id, {
      x: node.x(),
      y: node.y(),
    });
  }, [element.id, updateElement]);

  // Handle transform end
  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Text;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Calculate new dimensions
    const newWidth = Math.max(5, node.width() * scaleX);
    const newHeight = Math.max(5, node.height() * scaleY);
    
    // Update element with new properties
    const updates = {
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      rotation: node.rotation(),
      scaleX: 1, // Reset scale after applying to dimensions
      scaleY: 1,
    };
    
    updateElement(element.id, updates);
    
    // Reset the node scale
    node.scaleX(1);
    node.scaleY(1);
    
    if (onTransform) {
      onTransform(updates);
    }
  }, [element.id, updateElement, onTransform]);

  // Auto-resize text width based on content
  const updateTextSize = useCallback(() => {
    if (textRef.current) {
      const textNode = textRef.current;
      const newWidth = textNode.measureSize(element.text).width;
      const newHeight = textNode.measureSize(element.text).height;
      
      if (newWidth !== element.width || newHeight !== element.height) {
        updateElement(element.id, {
          width: Math.max(newWidth, 20),
          height: Math.max(newHeight, element.fontSize * element.lineHeight)
        });
      }
    }
  }, [element, updateElement]);

  // Update text size when content changes
  useEffect(() => {
    updateTextSize();
  }, [element.text, element.fontSize, element.fontFamily, updateTextSize]);

  // Handle editing finish
  const handleEditFinish = useCallback(() => {
    onFinishEdit(textareaValue);
    setTextareaValue(element.text); // Reset to element text if changed externally
  }, [textareaValue, onFinishEdit, element.text]);

  // Handle textarea key events
  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTextareaValue(element.text); // Reset to original
      onFinishEdit(element.text);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleEditFinish();
    }
    e.stopPropagation(); // Prevent canvas shortcuts
  }, [element.text, onFinishEdit, handleEditFinish]);

  // Calculate text styles for consistent rendering
  const textStyles = {
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    fontStyle: element.fontStyle,
    fontWeight: element.fontWeight,
    fill: element.color,
    align: element.textAlign,
    verticalAlign: element.verticalAlign,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    textDecoration: element.textDecoration,
    wrap: element.wordWrap ? 'word' as const : 'none' as const,
  };

  if (isEditing) {
    // Render HTML textarea for editing
    return (
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        opacity={element.opacity}
        visible={element.visible}
      >
        <Html
          divProps={{
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${element.width}px`,
              minHeight: `${element.height}px`,
            }
          }}
        >
          <textarea
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            onBlur={handleEditFinish}
            onKeyDown={handleTextareaKeyDown}
            autoFocus
            style={{
              width: '100%',
              minHeight: `${element.height}px`,
              border: '2px solid #48aff0',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#333333',
              padding: '4px 8px',
              fontSize: `${element.fontSize}px`,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              lineHeight: element.lineHeight,
              letterSpacing: `${element.letterSpacing}px`,
              textAlign: element.textAlign,
              resize: 'none',
              outline: 'none',
              overflow: 'hidden',
              wordWrap: 'break-word',
            }}
            placeholder="Enter your text..."
          />
        </Html>
      </Group>
    );
  }

  // Render Konva text
  return (
    <Group
      ref={groupRef}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity}
      visible={element.visible}
      draggable={!element.locked && isSelected}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      <KonvaText
        ref={textRef}
        width={element.width}
        height={element.height}
        text={element.text}
        {...textStyles}
        
        // Selection and interaction
        stroke={isSelected ? '#48aff0' : undefined}
        strokeWidth={isSelected ? 1 : 0}
        listening={!element.locked}
        
        // Event handlers
        onDblClick={handleDoubleClick}
        onClick={(e) => {
          e.cancelBubble = true;
        }}
        
        // Performance optimizations
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={10} // Larger hit area for easier selection
        
        // Text rendering optimizations
        ellipsis={false}
        
        // Transform settings
        name={`text-${element.id}`}
        id={element.id}
      />
    </Group>
  );
});

TextElement.displayName = 'TextElement';