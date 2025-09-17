// BasicPlotlyTextDemo - Complete demonstration of Plotly text system
// Shows all features: templates, rich text editing, drag-and-drop, inline editing

import React, { useState } from 'react';
import { PlotlyCanvas } from '../components/plotly/PlotlyCanvas';
import { PlotlyTextPanel } from '../components/panels/PlotlyTextPanel';
import { usePlotlyTextStore } from '../stores/plotlyTextStore';
import type { PlotData } from 'plotly.js';
import type { TextTemplate } from '../types/textTemplates';

// Sample chart data
const sampleData: PlotData[] = [
  {
    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    y: [20, 14, 23, 25, 22, 16],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Sales',
    line: { color: '#48aff0' },
    marker: { color: '#48aff0' }
  },
  {
    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    y: [12, 18, 17, 19, 15, 21],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Profit',
    line: { color: '#28a745' },
    marker: { color: '#28a745' }
  }
];

const sampleLayout = {
  title: {
    text: 'Monthly Sales & Profit Dashboard',
    font: { color: '#f5f8fa', size: 20 }
  },
  xaxis: {
    title: 'Month',
    color: '#a7b6c2',
    gridcolor: '#495563'
  },
  yaxis: {
    title: 'Amount ($000)',
    color: '#a7b6c2',
    gridcolor: '#495563'
  },
  margin: { l: 60, r: 60, t: 60, b: 60 },
  showlegend: true,
  legend: {
    font: { color: '#f5f8fa' },
    bgcolor: 'rgba(47, 52, 60, 0.8)'
  }
};

export const BasicPlotlyTextDemo: React.FC = () => {
  const [showTextPanel, setShowTextPanel] = useState(true);
  
  // Store state
  const { 
    selectedElementIds,
    addTextElement,
    getSelectedElements
  } = usePlotlyTextStore();
  
  const selectedElements = getSelectedElements();
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  // Handle template selection from panel
  const handleTemplateSelect = (template: TextTemplate) => {
    console.log('📝 Template selected:', template.name);
    
    // Add text element at center of chart
    const elementData = {
      type: 'text' as const,
      text: template.preview,
      x: 0.5,
      y: 0.8,
      xref: 'paper',
      yref: 'paper',
      font: {
        family: template.style.fontFamily,
        size: template.style.fontSize,
        color: template.style.color,
        weight: template.style.fontWeight
      },
      align: template.style.textAlign,
      xanchor: 'center' as const,
      yanchor: 'middle' as const,
      opacity: 1,
      visible: true,
      editable: true,
      selected: false,
      locked: false,
      zIndex: Date.now()
    };
    
    const id = addTextElement(elementData);
    console.log('✨ Created text element from template:', id);
  };

  // Handle rich text updates
  const handleRichTextUpdate = (html: string, imageData?: string) => {
    console.log('✨ Rich text updated:', { html, hasImageData: !!imageData });
    
    if (!selectedElement) {
      // Create new rich text element
      const elementData = {
        type: 'rich-text' as const,
        text: html,
        html: html,
        x: 0.5,
        y: 0.6,
        xref: 'paper',
        yref: 'paper',
        font: {
          family: 'Arial',
          size: 16,
          color: '#ffffff'
        },
        align: 'center' as const,
        xanchor: 'center' as const,
        yanchor: 'middle' as const,
        opacity: 1,
        visible: true,
        editable: true,
        selected: false,
        locked: false,
        richText: true,
        imageData,
        zIndex: Date.now()
      };
      
      const id = addTextElement(elementData);
      console.log('✨ Created rich text element:', id);
    }
  };

  // Handle new text element creation
  const handleAddTextElement = (elementData: any) => {
    const id = addTextElement(elementData);
    console.log('➕ Added new text element:', id);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#252a30',
      color: '#f5f8fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Main Chart Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        {/* Top Bar */}
        <div style={{
          height: '60px',
          background: '#2f343c',
          borderBottom: '1px solid #495563',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#f5f8fa'
          }}>
            📊 Plotly Text System Demo
          </h1>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {selectedElementIds.size > 0 && (
              <div style={{
                padding: '6px 12px',
                background: 'rgba(72, 175, 240, 0.1)',
                border: '1px solid rgba(72, 175, 240, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#48aff0'
              }}>
                {selectedElementIds.size} text element(s) selected
              </div>
            )}
            
            <button
              onClick={() => setShowTextPanel(!showTextPanel)}
              style={{
                padding: '8px 16px',
                background: showTextPanel ? '#48aff0' : 'transparent',
                color: showTextPanel ? 'white' : '#a7b6c2',
                border: `1px solid ${showTextPanel ? '#48aff0' : '#495563'}`,
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showTextPanel ? 'Hide' : 'Show'} Text Panel
            </button>
          </div>
        </div>
        
        {/* Chart Container */}
        <div style={{
          flex: 1,
          position: 'relative',
          background: '#2f343c'
        }}>
          <PlotlyCanvas
            data={sampleData}
            layout={sampleLayout}
            config={{
              displayModeBar: true,
              displaylogo: false,
              responsive: true
            }}
            onPlotlyReady={(plotlyDiv) => {
              console.log('📊 Plotly ready for text editing');
            }}
          />
        </div>
      </div>
      
      {/* Text Panel Sidebar */}
      {showTextPanel && (
        <div style={{
          width: '350px',
          background: '#2f343c',
          borderLeft: '1px solid #495563',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Panel Header */}
          <div style={{
            height: '60px',
            background: '#252a30',
            borderBottom: '1px solid #495563',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>📝</span>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#f5f8fa'
            }}>
              Text Tools
            </h2>
          </div>
          
          {/* Text Panel */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PlotlyTextPanel
              onTemplateSelect={handleTemplateSelect}
              onRichTextUpdate={handleRichTextUpdate}
              selectedTextElement={selectedElement}
              onAddTextElement={handleAddTextElement}
            />
          </div>
        </div>
      )}
      
      {/* Instructions Overlay */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '20px',
        background: 'rgba(47, 52, 60, 0.95)',
        border: '1px solid #495563',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '300px',
        fontSize: '14px',
        color: '#a7b6c2',
        backdropFilter: 'blur(4px)',
        zIndex: 1000
      }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '16px', 
          color: '#f5f8fa' 
        }}>
          🚀 How to use:
        </h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '16px', 
          lineHeight: '1.5' 
        }}>
          <li>Click templates to add text to chart</li>
          <li>Drag templates onto chart for precise positioning</li>
          <li>Double-click text annotations to edit inline</li>
          <li>Use Rich Text Editor for advanced formatting</li>
          <li>Select multiple elements with Ctrl/Cmd + click</li>
          <li>Delete with Delete key, duplicate with Ctrl/Cmd + D</li>
        </ul>
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(72, 175, 240, 0.1)',
          border: '1px solid rgba(72, 175, 240, 0.3)',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#48aff0'
        }}>
          ✨ Same UX as Design Studio, adapted for Plotly!
        </div>
      </div>
    </div>
  );
};