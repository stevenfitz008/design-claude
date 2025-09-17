// PlotlyCanvas - Main Plotly component with text editing integration
// Combines Plotly.js charts with Design Studio-style text editing functionality

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { PlotData, Layout, Config, PlotMouseEvent } from 'plotly.js';
import { PlotlyInlineTextEditor } from '../text-editor/PlotlyInlineTextEditor';
import { usePlotlyTextStore, useEditingPlotlyTextElement } from '../../stores/plotlyTextStore';
import type { PlotlyTextPosition, PlotlyTextDragData } from '../../types/plotlyText';
import type { TextTemplate } from '../../types/textTemplates';

interface PlotlyCanvasProps {
  data: PlotData[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
  onPlotlyReady?: (plotlyDiv: HTMLDivElement) => void;
}

export const PlotlyCanvas: React.FC<PlotlyCanvasProps> = ({
  data,
  layout = {},
  config = {},
  className,
  onPlotlyReady
}) => {
  const plotlyRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store state
  const {
    textElements,
    selectedElementIds,
    editingState,
    initialize,
    startEditing,
    stopEditing,
    updateTextElement,
    selectTextElement,
    clearSelection,
    applyTemplate,
    updatePlotlyAnnotations
  } = usePlotlyTextStore();
  
  const editingElement = useEditingPlotlyTextElement();

  // Initialize store with plotly reference
  useEffect(() => {
    if (plotlyRef.current && !usePlotlyTextStore.getState().initialized) {
      initialize(plotlyRef);
      if (onPlotlyReady && containerRef.current) {
        onPlotlyReady(containerRef.current);
      }
    }
  }, [initialize, onPlotlyReady]);

  // Convert text elements to Plotly annotations
  const annotations = useMemo(() => {
    return Array.from(textElements.values())
      .filter(element => element.visible)
      .map(element => ({
        x: element.x,
        y: element.y,
        xref: element.xref || 'paper',
        yref: element.yref || 'paper',
        text: element.html || element.text,
        font: {
          family: element.font.family,
          size: element.font.size,
          color: element.font.color,
          ...(element.font.weight && { weight: element.font.weight })
        },
        align: element.align,
        xanchor: element.xanchor,
        yanchor: element.yanchor,
        opacity: element.opacity,
        showarrow: false,
        // Add styling for selected elements
        bgcolor: selectedElementIds.has(element.id) ? 'rgba(72, 175, 240, 0.1)' : undefined,
        bordercolor: selectedElementIds.has(element.id) ? '#48aff0' : undefined,
        borderwidth: selectedElementIds.has(element.id) ? 1 : undefined,
        // Store element ID for interaction
        name: element.id
      }));
  }, [textElements, selectedElementIds]);

  // Merge layout with annotations
  const plotlyLayout = useMemo(() => ({
    ...layout,
    annotations: [...(layout.annotations || []), ...annotations],
    // Enable drag mode for better text interaction
    dragmode: 'select',
    // Styling to match Design Studio theme
    paper_bgcolor: '#2f343c',
    plot_bgcolor: '#394b59',
    font: {
      color: '#f5f8fa',
      ...layout.font
    }
  }), [layout, annotations]);

  // Plotly config with interaction settings
  const plotlyConfig = useMemo(() => ({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToAdd: ['select2d', 'lasso2d'],
    responsive: true,
    ...config
  }), [config]);

  // Handle double-click on annotations to start editing
  const handleAnnotationDoubleClick = useCallback((eventData: any) => {
    if (eventData.points && eventData.points.length > 0) {
      const point = eventData.points[0];
      // Check if this is a text annotation
      if (point.fullData && point.fullData.name) {
        const elementId = point.fullData.name;
        const element = textElements.get(elementId);
        if (element && !element.locked) {
          console.log('🖱️ Double-clicked Plotly text element:', elementId);
          startEditing(elementId);
        }
      }
    }
  }, [textElements, startEditing]);

  // Handle single-click for selection
  const handleAnnotationClick = useCallback((eventData: any) => {
    if (eventData.points && eventData.points.length > 0) {
      const point = eventData.points[0];
      if (point.fullData && point.fullData.name) {
        const elementId = point.fullData.name;
        const isMultiSelect = eventData.event?.ctrlKey || eventData.event?.metaKey;
        selectTextElement(elementId, isMultiSelect);
        console.log('🖱️ Clicked Plotly text element:', elementId);
      }
    } else {
      // Clear selection when clicking empty area
      clearSelection();
    }
  }, [selectTextElement, clearSelection]);

  // Handle drag and drop from text panel
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const dragDataRaw = e.dataTransfer.getData('application/json');
      if (!dragDataRaw) return;
      
      const dragData = JSON.parse(dragDataRaw) as PlotlyTextDragData;
      if (dragData.type !== 'plotly-text') return;
      
      console.log('🎯 Dropped Plotly text template:', dragData);
      
      // Get drop position relative to plot
      const plotlyDiv = containerRef.current;
      if (!plotlyDiv) return;
      
      const rect = plotlyDiv.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height; // Flip Y for Plotly coordinate system
      
      const position: PlotlyTextPosition = {
        paperX: Math.max(0, Math.min(1, x)),
        paperY: Math.max(0, Math.min(1, y)),
        xref: 'paper',
        yref: 'paper'
      };
      
      // Apply template at drop position
      const template: TextTemplate = {
        id: 'dropped-template',
        name: 'Dropped Template',
        category: 'Custom',
        preview: dragData.preview || 'Text',
        style: {
          fontSize: dragData.fontSize || 16,
          fontFamily: dragData.fontFamily || 'Arial',
          fontWeight: dragData.fontWeight || 'normal',
          color: dragData.color || '#ffffff',
          textAlign: dragData.textAlign || 'left',
          lineHeight: dragData.lineHeight || 1.5,
          letterSpacing: dragData.letterSpacing || 0,
          textTransform: dragData.textTransform || 'none',
          textDecoration: dragData.textDecoration || 'none'
        }
      };
      
      const elementId = applyTemplate(template, position);
      console.log('✨ Created Plotly text element from template:', elementId);
      
    } catch (error) {
      console.error('❌ Failed to handle text template drop:', error);
    }
  }, [applyTemplate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle text change from inline editor
  const handleTextChange = useCallback((newText: string) => {
    if (editingState.editingElementId) {
      updateTextElement(editingState.editingElementId, { text: newText });
      console.log('✏️ Updated Plotly text:', newText);
    }
  }, [editingState.editingElementId, updateTextElement]);

  // Calculate editor position for inline editing
  const getEditorPosition = useCallback((): PlotlyTextPosition | null => {
    if (!editingElement || !containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Convert element position to pixel coordinates
    let pixelX: number;
    let pixelY: number;
    
    if (editingElement.xref === 'paper' && editingElement.yref === 'paper') {
      pixelX = rect.left + (typeof editingElement.x === 'number' ? editingElement.x * rect.width : 0);
      pixelY = rect.top + (1 - (typeof editingElement.y === 'number' ? editingElement.y : 0)) * rect.height;
    } else {
      // For data coordinates, would need Plotly's coordinate conversion
      pixelX = rect.left + rect.width / 2;
      pixelY = rect.top + rect.height / 2;
    }
    
    return {
      pixelX,
      pixelY,
      xref: editingElement.xref || 'paper',
      yref: editingElement.yref || 'paper'
    };
  }, [editingElement]);

  // Handle keyboard shortcuts (same as Design Studio)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.size > 0) {
        e.preventDefault();
        selectedElementIds.forEach(id => {
          const element = textElements.get(id);
          if (element && !element.locked) {
            usePlotlyTextStore.getState().deleteTextElement(id);
          }
        });
        console.log('🗑️ Deleted selected text elements via keyboard');
      }
      
      // Escape to clear selection or stop editing
      if (e.key === 'Escape') {
        if (editingState.isEditing) {
          stopEditing();
        } else if (selectedElementIds.size > 0) {
          clearSelection();
        }
      }
      
      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !editingState.isEditing) {
        e.preventDefault();
        usePlotlyTextStore.getState().selectAllElements();
      }
      
      // Ctrl/Cmd + D to duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementIds.size > 0) {
        e.preventDefault();
        usePlotlyTextStore.getState().duplicateSelectedElements();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, textElements, editingState, stopEditing, clearSelection]);

  const editorPosition = getEditorPosition();

  return (
    <div 
      ref={containerRef}
      className={className}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#2f343c'
      }}
    >
      <Plot
        ref={plotlyRef}
        data={data}
        layout={plotlyLayout}
        config={plotlyConfig}
        style={{ width: '100%', height: '100%' }}
        onDoubleClick={handleAnnotationDoubleClick}
        onClick={handleAnnotationClick}
        useResizeHandler={true}
        onInitialized={() => {
          console.log('📊 Plotly initialized with text system');
        }}
        onUpdate={() => {
          console.log('📊 Plotly updated');
        }}
      />
      
      {/* Inline Text Editor Overlay */}
      {editingState.isEditing && editingElement && editorPosition && containerRef.current && (
        <PlotlyInlineTextEditor
          textElement={editingElement}
          plotlyDiv={containerRef.current}
          position={editorPosition}
          onChange={handleTextChange}
          onClose={stopEditing}
          isVisible={true}
        />
      )}
    </div>
  );
};