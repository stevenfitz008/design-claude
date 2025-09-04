import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

interface KeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  const {
    enabled = true,
    preventDefault = true
  } = options;

  const {
    selection,
    elements,
    copySelection,
    paste,
    cutSelection,
    deleteElements,
    duplicateElements,
    undo,
    redo,
    canUndo,
    canRedo,
    updateElement,
    selectAll,
    clearSelection,
    moveToFront,
    moveToBack,
    moveForward,
    moveBackward
  } = useCanvasStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't handle shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const key = event.key.toLowerCase();

    let handled = false;

    // Copy, Cut, Paste operations
    if (isCtrlOrCmd && !isShift) {
      switch (key) {
        case 'c':
          if (selection.length > 0) {
            copySelection();
            handled = true;
          }
          break;
        case 'x':
          if (selection.length > 0) {
            cutSelection();
            handled = true;
          }
          break;
        case 'v':
          paste();
          handled = true;
          break;
        case 'd':
          if (selection.length > 0) {
            duplicateElements(selection);
            handled = true;
          }
          break;
        case 'a':
          selectAll();
          handled = true;
          break;
        case 'z':
          if (canUndo()) {
            undo();
            handled = true;
          }
          break;
        case 'y':
          if (canRedo()) {
            redo();
            handled = true;
          }
          break;
      }
    }

    // Redo with Ctrl+Shift+Z (alternative)
    if (isCtrlOrCmd && isShift && key === 'z') {
      if (canRedo()) {
        redo();
        handled = true;
      }
    }

    // Delete operations
    if ((key === 'delete' || key === 'backspace') && selection.length > 0) {
      deleteElements(selection);
      handled = true;
    }

    // Escape to clear selection
    if (key === 'escape') {
      clearSelection();
      handled = true;
    }

    // Arrow key movements
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && selection.length > 0) {
      const moveDistance = isShift ? 10 : 1;
      let deltaX = 0;
      let deltaY = 0;

      switch (key) {
        case 'arrowup':
          deltaY = -moveDistance;
          break;
        case 'arrowdown':
          deltaY = moveDistance;
          break;
        case 'arrowleft':
          deltaX = -moveDistance;
          break;
        case 'arrowright':
          deltaX = moveDistance;
          break;
      }

      // Move selected elements
      selection.forEach(id => {
        const element = elements.find(el => el.id === id);
        if (element && !element.locked) {
          updateElement(id, {
            x: element.x + deltaX,
            y: element.y + deltaY
          });
        }
      });

      handled = true;
    }

    // Layer order shortcuts
    if (selection.length > 0) {
      if (isCtrlOrCmd && isShift) {
        switch (key) {
          case ']':
          case '}':
            // Bring to front
            selection.forEach(id => moveToFront(id));
            handled = true;
            break;
          case '[':
          case '{':
            // Send to back
            selection.forEach(id => moveToBack(id));
            handled = true;
            break;
        }
      } else if (isCtrlOrCmd) {
        switch (key) {
          case ']':
            // Bring forward
            selection.forEach(id => moveForward(id));
            handled = true;
            break;
          case '[':
            // Send backward
            selection.forEach(id => moveBackward(id));
            handled = true;
            break;
        }
      }
    }

    if (handled && preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [
    enabled,
    preventDefault,
    selection,
    elements,
    copySelection,
    paste,
    cutSelection,
    deleteElements,
    duplicateElements,
    undo,
    redo,
    canUndo,
    canRedo,
    updateElement,
    selectAll,
    clearSelection,
    moveToFront,
    moveToBack,
    moveForward,
    moveBackward
  ]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listener to document for global shortcuts
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // Return utility functions for programmatic use
  return {
    copySelection: () => selection.length > 0 && copySelection(),
    cutSelection: () => selection.length > 0 && cutSelection(),
    paste,
    duplicateSelection: () => selection.length > 0 && duplicateElements(selection),
    deleteSelection: () => selection.length > 0 && deleteElements(selection),
    selectAll,
    clearSelection,
    undo: canUndo() ? undo : undefined,
    redo: canRedo() ? redo : undefined,
    canUndo: canUndo(),
    canRedo: canRedo()
  };
};