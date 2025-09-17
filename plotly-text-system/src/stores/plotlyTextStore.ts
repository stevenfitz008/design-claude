// PlotlyTextStore - Zustand store for managing Plotly text elements
// Adapted from Design Studio's canvasStore and panelStore patterns

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import type { 
  PlotlyTextElement, 
  TextEditingState, 
  RichTextEditorState, 
  PlotlyTextPosition,
  PlotlyTextStore 
} from '../types/plotlyText';
import type { TextTemplate } from '../types/textTemplates';

interface PlotlyTextStoreState extends PlotlyTextStore {
  // Additional state
  initialized: boolean;
  
  // Helper methods
  getElementById: (id: string) => PlotlyTextElement | undefined;
  getSelectedElements: () => PlotlyTextElement[];
  isElementSelected: (id: string) => boolean;
  
  // Bulk operations
  selectAllElements: () => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  
  // Template operations
  createElementFromTemplate: (template: TextTemplate, position: PlotlyTextPosition) => string;
  
  // Initialization
  initialize: (plotlyRef: React.RefObject<any>) => void;
}

export const usePlotlyTextStore = create<PlotlyTextStoreState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // State
      textElements: new Map(),
      selectedElementIds: new Set(),
      plotlyRef: null,
      initialized: false,
      
      editingState: {
        isEditing: false,
        editingElementId: null,
        editorPosition: null,
        editorSize: null
      },
      
      richTextEditor: {
        isVisible: false,
        content: '',
        status: 'ready',
        selectedElementId: null
      },

      // Initialization
      initialize: (plotlyRef: React.RefObject<any>) => {
        set({ plotlyRef, initialized: true });
        console.log('🚀 PlotlyTextStore initialized');
      },

      // Element management
      addTextElement: (elementData) => {
        const id = `plotly-text-${Date.now()}-${Math.random().toString(36).substring(2)}`;
        const element: PlotlyTextElement = {
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...elementData
        };
        
        set((state) => {
          const newTextElements = new Map(state.textElements);
          newTextElements.set(id, element);
          
          console.log('➕ Added Plotly text element:', element);
          
          return { 
            textElements: newTextElements,
            selectedElementIds: new Set([id]) // Auto-select new element
          };
        });
        
        // Trigger Plotly update
        get().updatePlotlyAnnotations();
        
        return id;
      },

      updateTextElement: (id, updates) => {
        set((state) => {
          const element = state.textElements.get(id);
          if (!element) {
            console.warn('⚠️ Attempted to update non-existent text element:', id);
            return state;
          }
          
          const updatedElement: PlotlyTextElement = {
            ...element,
            ...updates,
            updatedAt: Date.now()
          };
          
          const newTextElements = new Map(state.textElements);
          newTextElements.set(id, updatedElement);
          
          console.log('✏️ Updated Plotly text element:', updatedElement);
          
          return { textElements: newTextElements };
        });
        
        // Trigger Plotly update
        get().updatePlotlyAnnotations();
      },

      deleteTextElement: (id) => {
        set((state) => {
          const newTextElements = new Map(state.textElements);
          const element = newTextElements.get(id);
          
          if (element) {
            newTextElements.delete(id);
            console.log('🗑️ Deleted Plotly text element:', element);
          }
          
          const newSelectedIds = new Set(state.selectedElementIds);
          newSelectedIds.delete(id);
          
          return { 
            textElements: newTextElements,
            selectedElementIds: newSelectedIds
          };
        });
        
        // Trigger Plotly update
        get().updatePlotlyAnnotations();
      },

      // Selection management
      selectTextElement: (id, multiSelect = false) => {
        set((state) => {
          const element = state.textElements.get(id);
          if (!element) {
            console.warn('⚠️ Attempted to select non-existent text element:', id);
            return state;
          }
          
          let newSelectedIds: Set<string>;
          
          if (multiSelect) {
            newSelectedIds = new Set(state.selectedElementIds);
            if (newSelectedIds.has(id)) {
              newSelectedIds.delete(id);
              console.log('➖ Deselected Plotly text element:', id);
            } else {
              newSelectedIds.add(id);
              console.log('➕ Added to selection:', id);
            }
          } else {
            newSelectedIds = new Set([id]);
            console.log('🔍 Selected Plotly text element:', id);
          }
          
          return { selectedElementIds: newSelectedIds };
        });
      },

      clearSelection: () => {
        set({ selectedElementIds: new Set() });
        console.log('🔄 Cleared text selection');
      },

      selectAllElements: () => {
        const elementIds = Array.from(get().textElements.keys());
        set({ selectedElementIds: new Set(elementIds) });
        console.log('🔍 Selected all Plotly text elements:', elementIds.length);
      },

      // Editing state management
      startEditing: (elementId) => {
        const element = get().textElements.get(elementId);
        if (!element) {
          console.warn('⚠️ Attempted to edit non-existent text element:', elementId);
          return;
        }
        
        set({
          editingState: {
            isEditing: true,
            editingElementId: elementId,
            editorPosition: { 
              x: typeof element.x === 'number' ? element.x : 0, 
              y: typeof element.y === 'number' ? element.y : 0 
            },
            editorSize: { width: 200, height: 60 }
          }
        });
        
        console.log('✏️ Started editing Plotly text element:', elementId);
      },

      stopEditing: () => {
        set({
          editingState: {
            isEditing: false,
            editingElementId: null,
            editorPosition: null,
            editorSize: null
          }
        });
        
        console.log('✅ Stopped editing Plotly text');
      },

      // Rich text editor management
      showRichTextEditor: (elementId) => {
        const element = elementId ? get().textElements.get(elementId) : null;
        
        set({
          richTextEditor: {
            isVisible: true,
            content: element?.html || element?.text || '',
            status: 'ready',
            selectedElementId: elementId || null
          }
        });
        
        console.log('✨ Showed rich text editor for:', elementId || 'new element');
      },

      hideRichTextEditor: () => {
        set({
          richTextEditor: {
            isVisible: false,
            content: '',
            status: 'ready',
            selectedElementId: null
          }
        });
        
        console.log('❌ Hidden rich text editor');
      },

      // Template operations
      applyTemplate: (template, position) => {
        const elementData = {
          type: 'text' as const,
          text: template.preview,
          x: position.paperX || position.dataX || 0.5,
          y: position.paperY || position.dataY || 0.5,
          xref: position.xref,
          yref: position.yref,
          font: {
            family: template.fontFamily,
            size: template.fontSize,
            color: template.color,
            weight: template.fontWeight
          },
          align: template.textAlign,
          xanchor: 'center' as const,
          yanchor: 'middle' as const,
          opacity: 1,
          visible: true,
          editable: true,
          selected: false,
          locked: false,
          zIndex: Date.now()
        };
        
        return get().addTextElement(elementData);
      },

      createElementFromTemplate: (template, position) => {
        return get().applyTemplate(template, position);
      },

      // Helper methods
      getElementById: (id) => {
        return get().textElements.get(id);
      },

      getSelectedElements: () => {
        const { textElements, selectedElementIds } = get();
        return Array.from(selectedElementIds)
          .map(id => textElements.get(id))
          .filter((element): element is PlotlyTextElement => element !== undefined);
      },

      isElementSelected: (id) => {
        return get().selectedElementIds.has(id);
      },

      // Bulk operations
      deleteSelectedElements: () => {
        const selectedIds = Array.from(get().selectedElementIds);
        selectedIds.forEach(id => get().deleteTextElement(id));
        console.log('🗑️ Deleted selected Plotly text elements:', selectedIds.length);
      },

      duplicateSelectedElements: () => {
        const selectedElements = get().getSelectedElements();
        const newIds: string[] = [];
        
        selectedElements.forEach(element => {
          const duplicateData = {
            ...element,
            x: typeof element.x === 'number' ? element.x + 0.1 : element.x,
            y: typeof element.y === 'number' ? element.y + 0.1 : element.y,
            text: `${element.text} Copy`
          };
          delete (duplicateData as any).id;
          delete (duplicateData as any).createdAt;
          delete (duplicateData as any).updatedAt;
          
          const newId = get().addTextElement(duplicateData);
          newIds.push(newId);
        });
        
        // Select the duplicated elements
        set({ selectedElementIds: new Set(newIds) });
        console.log('📋 Duplicated Plotly text elements:', newIds.length);
      },

      // Plotly integration
      updatePlotlyAnnotations: () => {
        const { plotlyRef, textElements } = get();
        
        if (!plotlyRef?.current) {
          console.warn('⚠️ No Plotly reference available for annotation update');
          return;
        }
        
        try {
          // Convert text elements to Plotly annotations
          const annotations = Array.from(textElements.values())
            .filter(element => element.visible)
            .map(element => ({
              x: element.x,
              y: element.y,
              xref: element.xref || 'paper',
              yref: element.yref || 'paper',
              text: element.html || element.text,
              font: element.font,
              align: element.align,
              xanchor: element.xanchor,
              yanchor: element.yanchor,
              opacity: element.opacity,
              showarrow: false,
              // Add unique ID for tracking
              name: element.id
            }));
          
          // Update Plotly layout
          const currentLayout = plotlyRef.current.layout || {};
          const updatedLayout = {
            ...currentLayout,
            annotations: annotations
          };
          
          // Use Plotly.relayout to update annotations
          if (window.Plotly) {
            window.Plotly.relayout(plotlyRef.current, { annotations });
            console.log('📊 Updated Plotly annotations:', annotations.length);
          }
        } catch (error) {
          console.error('❌ Failed to update Plotly annotations:', error);
        }
      },

      syncWithPlotlyAnnotations: (annotations) => {
        // Convert Plotly annotations back to text elements
        // This would be used when loading existing Plotly charts
        console.log('🔄 Syncing with Plotly annotations:', annotations.length);
        
        const newTextElements = new Map<string, PlotlyTextElement>();
        
        annotations.forEach((annotation, index) => {
          if (annotation.text) {
            const id = `synced-${index}-${Date.now()}`;
            const element: PlotlyTextElement = {
              id,
              type: annotation.text.includes('<') ? 'rich-text' : 'text',
              x: annotation.x,
              y: annotation.y,
              xref: annotation.xref || 'paper',
              yref: annotation.yref || 'paper',
              text: annotation.text,
              font: annotation.font || { family: 'Arial', size: 12, color: '#000' },
              align: annotation.align || 'left',
              xanchor: annotation.xanchor || 'center',
              yanchor: annotation.yanchor || 'middle',
              opacity: annotation.opacity || 1,
              visible: true,
              editable: true,
              selected: false,
              locked: false,
              zIndex: index,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            
            newTextElements.set(id, element);
          }
        });
        
        set({ textElements: newTextElements });
        console.log('✅ Synced Plotly annotations to text elements:', newTextElements.size);
      }
    })),
    {
      name: 'plotly-text-store',
      // Only serialize essential state for persistence
      partialize: (state) => ({
        textElements: Array.from(state.textElements.entries()),
        selectedElementIds: Array.from(state.selectedElementIds)
      })
    }
  )
);

// Helper hook for selected text elements
export const useSelectedPlotlyTextElements = () => {
  return usePlotlyTextStore(state => state.getSelectedElements());
};

// Helper hook for current editing element
export const useEditingPlotlyTextElement = () => {
  return usePlotlyTextStore(state => {
    const { editingState, textElements } = state;
    if (!editingState.editingElementId) return null;
    return textElements.get(editingState.editingElementId) || null;
  });
};

// Helper hook for rich text editor state
export const usePlotlyRichTextEditor = () => {
  return usePlotlyTextStore(state => state.richTextEditor);
};