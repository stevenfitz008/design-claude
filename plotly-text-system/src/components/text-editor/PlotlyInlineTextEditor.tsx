// PlotlyInlineTextEditor - Adapted from Design Studio's InlineTextEditor
// Original: /design-studio-clone/src/components/canvas/InlineTextEditor.tsx
// Adapted for: Plotly annotations with DOM overlay positioning

import React, { useEffect, useRef, useCallback } from 'react';
import type { PlotlyTextElement, PlotlyTextPosition } from '../../types/plotlyText';

interface PlotlyInlineTextEditorProps {
  textElement: PlotlyTextElement;
  plotlyDiv: HTMLDivElement;
  position: PlotlyTextPosition;
  onClose: () => void;
  onChange: (newText: string) => void;
  isVisible: boolean;
}

export const PlotlyInlineTextEditor: React.FC<PlotlyInlineTextEditorProps> = ({ 
  textElement,
  plotlyDiv,
  position,
  onClose, 
  onChange, 
  isVisible 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleTextChange = useCallback((newText: string) => {
    onChange(newText);
  }, [onChange]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const calculatePosition = useCallback(() => {
    if (!plotlyDiv || !textareaRef.current) return;

    const plotlyRect = plotlyDiv.getBoundingClientRect();
    const textarea = textareaRef.current;

    // Get Plotly plot area dimensions
    const plotElement = plotlyDiv.querySelector('.main-svg') as SVGElement;
    const plotRect = plotElement?.getBoundingClientRect() || plotlyRect;

    let pixelX: number;
    let pixelY: number;

    // Convert position to pixel coordinates
    if (position.paperX !== undefined && position.paperY !== undefined) {
      // Paper coordinates (0-1) relative to plot area
      pixelX = plotRect.left + (position.paperX * plotRect.width);
      pixelY = plotRect.top + (position.paperY * plotRect.height);
    } else if (position.pixelX !== undefined && position.pixelY !== undefined) {
      // Direct pixel coordinates
      pixelX = position.pixelX;
      pixelY = position.pixelY;
    } else {
      // Data coordinates - would need Plotly's coordinate conversion
      // For now, fallback to center of plot
      pixelX = plotRect.left + plotRect.width / 2;
      pixelY = plotRect.top + plotRect.height / 2;
    }

    // Position textarea overlay
    textarea.style.position = 'fixed';
    textarea.style.left = `${pixelX}px`;
    textarea.style.top = `${pixelY}px`;
    textarea.style.zIndex = '9999';

    return { x: pixelX, y: pixelY };
  }, [plotlyDiv, position]);

  useEffect(() => {
    if (!textareaRef.current || !textElement || !isVisible || !plotlyDiv) return;

    const textarea = textareaRef.current;
    
    // Calculate position
    const coords = calculatePosition();
    if (!coords) return;

    // Set textarea content and styling to match text element
    textarea.value = textElement.text;
    
    // Match text element styling
    textarea.style.fontSize = `${textElement.font.size}px`;
    textarea.style.fontFamily = textElement.font.family;
    textarea.style.fontWeight = textElement.font.weight?.toString() || 'normal';
    textarea.style.color = textElement.font.color;
    textarea.style.textAlign = textElement.align || 'left';
    
    // Style the textarea to match Design Studio's design
    textarea.style.border = '2px solid #48aff0';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'rgba(47, 52, 60, 0.95)';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.transformOrigin = 'left top';
    textarea.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    textarea.style.backdropFilter = 'blur(4px)';
    textarea.style.minWidth = '150px';
    textarea.style.minHeight = '20px';
    
    // Auto-resize height based on content
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + 3}px`;
      
      // Auto-resize width based on content
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.fontSize = textarea.style.fontSize;
      tempSpan.style.fontFamily = textarea.style.fontFamily;
      tempSpan.style.fontWeight = textarea.style.fontWeight;
      tempSpan.textContent = textarea.value || 'W'; // Minimum width
      document.body.appendChild(tempSpan);
      
      const textWidth = tempSpan.offsetWidth;
      document.body.removeChild(tempSpan);
      
      textarea.style.width = `${Math.max(150, textWidth + 20)}px`;
    };

    autoResize();

    // Focus and select
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
      // Prevent event propagation to avoid Plotly shortcuts
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
        autoResize();
      }
    };

    const handleInput = () => {
      autoResize();
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste but auto-resize after
      e.stopPropagation();
      setTimeout(autoResize, 0);
    };

    // Handle window resize to reposition
    const handleResize = () => {
      calculatePosition();
    };

    // Add event listeners
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('paste', handlePaste);
    window.addEventListener('resize', handleResize);
    
    // Delay adding click listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 100);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('paste', handlePaste);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleOutsideClick);
      clearTimeout(timeoutId);
    };
  }, [textElement, handleTextChange, handleClose, isVisible, plotlyDiv, calculatePosition]);

  if (!isVisible || !textElement) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9998
      }}
    >
      <textarea
        ref={textareaRef}
        style={{
          pointerEvents: 'auto',
          position: 'absolute',
          zIndex: 9999,
          minHeight: '1em',
        }}
        placeholder="Enter text..."
        autoFocus
      />
    </div>
  );
};