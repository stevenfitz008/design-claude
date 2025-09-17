import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  selectedElements: CanvasElement[];
}

export const useContextMenu = () => {
  const { elements, selection } = useCanvasStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedElements: []
  });

  const showContextMenu = useCallback((x: number, y: number, elementId?: string) => {
    console.log('📍 Showing context menu at:', { x, y, elementId });
    
    // Get the selected elements
    let selectedElements: CanvasElement[] = [];
    
    if (elementId && !selection.includes(elementId)) {
      // If right-clicked on an unselected element, select it
      const element = elements.find(el => el.id === elementId);
      if (element) {
        selectedElements = [element];
      }
    } else {
      // Use current selection
      selectedElements = elements.filter(el => selection.includes(el.id));
    }

    if (selectedElements.length === 0) {
      console.log('❌ No elements selected for context menu');
      return;
    }

    console.log('✅ Context menu for elements:', selectedElements.map(el => ({ id: el.id, type: el.type })));

    setContextMenu({
      visible: true,
      x,
      y,
      selectedElements
    });
  }, [elements, selection]);

  const hideContextMenu = useCallback(() => {
    console.log('❌ Hiding context menu');
    setContextMenu(prev => ({
      ...prev,
      visible: false
    }));
  }, []);

  const handleContextMenuClick = useCallback((event: React.MouseEvent, elementId?: string) => {
    event.preventDefault();
    event.stopPropagation();

    // Get mouse position relative to the viewport
    const x = event.clientX;
    const y = event.clientY;

    showContextMenu(x, y, elementId);
  }, [showContextMenu]);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    handleContextMenuClick
  };
};