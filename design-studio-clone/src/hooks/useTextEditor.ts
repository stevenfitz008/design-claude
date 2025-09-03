import { useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { googleFontsService } from '@/services/googleFonts';
import type { TextTemplate } from '@/components/panels/TextPanel';
import type { TextElement } from '@/types/canvas';

interface TextEditorState {
  isEditing: boolean;
  editingElementId: string | null;
  tempText: string;
  cursorPosition: { x: number; y: number } | null;
}

interface UseTextEditorReturn {
  // State
  isEditing: boolean;
  editingElementId: string | null;
  tempText: string;
  
  // Text creation
  createTextFromTemplate: (template: TextTemplate, x?: number, y?: number) => Promise<void>;
  createEmptyText: (x: number, y: number, initialText?: string) => Promise<void>;
  
  // Text editing
  startEditing: (elementId: string) => void;
  stopEditing: (save?: boolean) => void;
  updateTempText: (text: string) => void;
  
  // Text formatting
  updateTextStyle: (elementId: string, style: Partial<TextElement>) => void;
  applyStyleToSelection: (style: Partial<TextElement>) => void;
  
  // Font management
  loadFont: (fontFamily: string, weights?: string[]) => Promise<void>;
  getFontFamilyString: (fontFamily: string) => string;
  
  // Utilities
  duplicateText: (elementId: string) => void;
  getTextBounds: (elementId: string) => { width: number; height: number } | null;
}

export const useTextEditor = (): UseTextEditorReturn => {
  const { 
    elements, 
    selection, 
    addElement, 
    updateElement, 
    selectElement,
    getElementById 
  } = useCanvasStore();
  
  const [editorState, setEditorState] = useState<TextEditorState>({
    isEditing: false,
    editingElementId: null,
    tempText: '',
    cursorPosition: null
  });

  // Generate unique ID for text elements
  const generateTextId = useCallback((): string => {
    return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create text element from template
  const createTextFromTemplate = useCallback(async (
    template: TextTemplate, 
    x: number = 50, 
    y: number = 50
  ): Promise<void> => {
    try {
      // Load the font first
      await googleFontsService.loadFont(template.style.fontFamily, [template.style.fontWeight]);
      
      // Create text element with template styling
      const textElement: TextElement = {
        id: generateTextId(),
        type: 'text',
        x,
        y,
        width: 300, // Initial width, will auto-adjust
        height: template.style.fontSize * template.style.lineHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1,
        
        // Text properties
        text: template.preview,
        fontSize: template.style.fontSize,
        fontFamily: googleFontsService.getFontFamilyString(template.style.fontFamily),
        fontStyle: 'normal',
        fontWeight: template.style.fontWeight,
        color: template.style.color,
        textAlign: template.style.textAlign,
        verticalAlign: 'top',
        lineHeight: template.style.lineHeight,
        letterSpacing: template.style.letterSpacing,
        textDecoration: template.style.textDecoration || '',
        textTransform: template.style.textTransform,
        wordWrap: true
      };

      addElement(textElement);
      selectElement(textElement.id);
      
      // Auto-start editing for new text
      setTimeout(() => startEditing(textElement.id), 100);
      
    } catch (error) {
      console.error('Failed to create text from template:', error);
    }
  }, [elements, addElement, selectElement, generateTextId]);

  // Create empty text element
  const createEmptyText = useCallback(async (
    x: number, 
    y: number, 
    initialText: string = 'Enter text'
  ): Promise<void> => {
    try {
      const textElement: TextElement = {
        id: generateTextId(),
        type: 'text',
        x,
        y,
        width: 200,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1,
        
        text: initialText,
        fontSize: 16,
        fontFamily: 'Inter, Arial, sans-serif',
        fontStyle: 'normal',
        fontWeight: '400',
        color: '#333333',
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.4,
        letterSpacing: 0,
        textDecoration: '',
        wordWrap: true
      };

      addElement(textElement);
      selectElement(textElement.id);
      startEditing(textElement.id);
      
    } catch (error) {
      console.error('Failed to create empty text:', error);
    }
  }, [elements, addElement, selectElement, generateTextId]);

  // Start editing a text element
  const startEditing = useCallback((elementId: string): void => {
    const element = getElementById(elementId);
    if (!element || element.type !== 'text') return;

    setEditorState(prev => ({
      ...prev,
      isEditing: true,
      editingElementId: elementId,
      tempText: (element as TextElement).text || ''
    }));
  }, [getElementById]);

  // Stop editing
  const stopEditing = useCallback((save: boolean = true): void => {
    if (!editorState.isEditing || !editorState.editingElementId) return;

    if (save && editorState.tempText.trim()) {
      updateElement(editorState.editingElementId, {
        text: editorState.tempText.trim()
      });
    }

    setEditorState(prev => ({
      ...prev,
      isEditing: false,
      editingElementId: null,
      tempText: '',
      cursorPosition: null
    }));
  }, [editorState, updateElement]);

  // Update temporary text during editing
  const updateTempText = useCallback((text: string): void => {
    setEditorState(prev => ({
      ...prev,
      tempText: text
    }));
  }, []);

  // Update text element style
  const updateTextStyle = useCallback(async (
    elementId: string, 
    style: Partial<TextElement>
  ): Promise<void> => {
    // Load font if fontFamily is being updated
    if (style.fontFamily && style.fontWeight) {
      const fontName = style.fontFamily.split(',')[0].replace(/"/g, '');
      await googleFontsService.loadFont(fontName, [style.fontWeight]);
    }
    
    updateElement(elementId, style);
  }, [updateElement]);

  // Apply style to all selected text elements
  const applyStyleToSelection = useCallback(async (style: Partial<TextElement>): Promise<void> => {
    const textElements = elements.filter(el => 
      selection.includes(el.id) && el.type === 'text'
    );

    // Load font if needed
    if (style.fontFamily && style.fontWeight) {
      const fontName = style.fontFamily.split(',')[0].replace(/"/g, '');
      await googleFontsService.loadFont(fontName, [style.fontWeight]);
    }

    // Update all selected text elements
    textElements.forEach(element => {
      updateElement(element.id, style);
    });
  }, [elements, selection, updateElement]);

  // Load Google Font
  const loadFont = useCallback(async (
    fontFamily: string, 
    weights: string[] = ['400']
  ): Promise<void> => {
    return googleFontsService.loadFont(fontFamily, weights);
  }, []);

  // Get CSS font-family string
  const getFontFamilyString = useCallback((fontFamily: string): string => {
    return googleFontsService.getFontFamilyString(fontFamily);
  }, []);

  // Duplicate text element
  const duplicateText = useCallback((elementId: string): void => {
    const element = getElementById(elementId);
    if (!element || element.type !== 'text') return;

    const duplicatedElement: TextElement = {
      ...(element as TextElement),
      id: generateTextId(),
      x: element.x + 20,
      y: element.y + 20,
      zIndex: Math.max(...elements.map(el => el.zIndex || 0)) + 1
    };

    addElement(duplicatedElement);
    selectElement(duplicatedElement.id);
  }, [getElementById, elements, addElement, selectElement, generateTextId]);

  // Get text bounds (estimated)
  const getTextBounds = useCallback((elementId: string): { width: number; height: number } | null => {
    const element = getElementById(elementId);
    if (!element || element.type !== 'text') return null;

    const textElement = element as TextElement;
    
    // Rough estimation - would need actual canvas measurement in real implementation
    const charWidth = textElement.fontSize * 0.6;
    const lineHeight = textElement.fontSize * textElement.lineHeight;
    
    const lines = textElement.text.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    return {
      width: maxLineLength * charWidth,
      height: lines.length * lineHeight
    };
  }, [getElementById]);

  // Handle escape key to stop editing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && editorState.isEditing) {
        stopEditing(false);
      } else if (event.key === 'Enter' && event.ctrlKey && editorState.isEditing) {
        stopEditing(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorState.isEditing, stopEditing]);

  return {
    // State
    isEditing: editorState.isEditing,
    editingElementId: editorState.editingElementId,
    tempText: editorState.tempText,
    
    // Text creation
    createTextFromTemplate,
    createEmptyText,
    
    // Text editing
    startEditing,
    stopEditing,
    updateTempText,
    
    // Text formatting
    updateTextStyle,
    applyStyleToSelection,
    
    // Font management
    loadFont,
    getFontFamilyString,
    
    // Utilities
    duplicateText,
    getTextBounds
  };
};