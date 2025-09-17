import React, { useEffect, useRef, useCallback } from 'react';
import { Html } from 'react-konva-utils';
import type Konva from 'konva';

// Fix for Konva text rendering
if (typeof window !== 'undefined' && window.Konva) {
  (window.Konva as any)._fixTextRendering = true;
}

interface TextEditorProps {
  textNode: Konva.Text;
  onClose: () => void;
  onChange: (newText: string) => void;
  isVisible: boolean;
}

export const InlineTextEditor: React.FC<TextEditorProps> = ({ 
  textNode, 
  onClose, 
  onChange, 
  isVisible 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = useCallback((newText: string) => {
    onChange(newText);
  }, [onChange]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!textareaRef.current || !textNode || !isVisible) return;

    const textarea = textareaRef.current;
    const stage = textNode.getStage();
    
    if (!stage) return;

    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const scale = textNode.getAbsoluteScale();
    
    // Calculate position relative to stage
    const areaPosition = {
      x: textPosition.x,
      y: textPosition.y,
    };

    // Set textarea content and basic positioning
    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    
    // Match text node dimensions and styling
    const textWidth = Math.max(100, textNode.width() * scale.x);
    const textHeight = Math.max(20, textNode.height() * scale.y);
    
    textarea.style.width = `${textWidth - (textNode.padding() * 2)}px`;
    textarea.style.height = `${textHeight - (textNode.padding() * 2) + 5}px`;
    textarea.style.fontSize = `${textNode.fontSize() * scale.x}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.fontWeight = textNode.fontStyle() === 'bold' ? 'bold' : 'normal';
    textarea.style.fontStyle = textNode.fontStyle() === 'italic' ? 'italic' : 'normal';
    textarea.style.color = textNode.fill();
    textarea.style.textAlign = textNode.align();
    textarea.style.lineHeight = textNode.lineHeight().toString();
    
    // Style the textarea to match design
    textarea.style.border = '2px solid #48aff0';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = `${textNode.padding()}px`;
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'rgba(47, 52, 60, 0.95)';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.transformOrigin = 'left top';
    textarea.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    textarea.style.backdropFilter = 'blur(4px)';
    
    // Handle rotation
    const rotation = textNode.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    if (scale.x !== 1 || scale.y !== 1) {
      transform += ` scale(${scale.x}, ${scale.y})`;
    }
    textarea.style.transform = transform;

    // Auto-resize height
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    // Focus the textarea
    textarea.focus();
    textarea.select();

    // Event handlers
    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        handleTextChange(textarea.value);
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent event propagation to avoid canvas shortcuts
      e.stopPropagation();
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextChange(textarea.value);
        handleClose();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        // Insert tab character
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }
    };

    const handleInput = () => {
      // Auto-resize height as user types
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + 3}px`;
      
      // Update width if needed
      const newWidth = Math.max(100, textNode.width() * scale.x);
      textarea.style.width = `${newWidth - (textNode.padding() * 2)}px`;
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste but clean up the text
      e.stopPropagation();
      setTimeout(() => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight + 3}px`;
      }, 0);
    };

    // Add event listeners
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('paste', handlePaste);
    
    // Delay adding click listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 100);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('paste', handlePaste);
      window.removeEventListener('click', handleOutsideClick);
      clearTimeout(timeoutId);
    };
  }, [textNode, handleTextChange, handleClose, isVisible]);

  if (!isVisible || !textNode) {
    return null;
  }

  return (
    <Html divProps={{ 
      style: { 
        pointerEvents: 'auto',
        zIndex: 1000 
      } 
    }}>
      <textarea
        ref={textareaRef}
        style={{
          minHeight: '1em',
          position: 'absolute',
          zIndex: 1000,
        }}
        placeholder="Enter text..."
        autoFocus
      />
    </Html>
  );
};