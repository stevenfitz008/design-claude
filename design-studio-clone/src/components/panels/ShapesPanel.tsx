import React, { useState } from 'react';
import { Button, FormGroup, NumericInput, Divider } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

// Shape definitions with preview SVGs
const BASIC_SHAPES = [
  {
    id: 'rectangle',
    name: 'Rectangle',
    type: 'rectangle',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <rect x="2" y="2" width="36" height="26" fill="currentColor" stroke="none" rx="2" />
      </svg>
    )
  },
  {
    id: 'circle',
    name: 'Circle',
    type: 'circle',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <circle cx="20" cy="15" r="13" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'triangle',
    name: 'Triangle',
    type: 'triangle',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="20,3 37,27 3,27" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'diamond',
    name: 'Diamond',
    type: 'diamond',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="20,3 37,15 20,27 3,15" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'star',
    name: 'Star',
    type: 'star',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="20,2 24,12 35,12 26,19 30,29 20,23 10,29 14,19 5,12 16,12" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    type: 'hexagon',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="20,3 33,9 33,21 20,27 7,21 7,9" fill="currentColor" stroke="none" />
      </svg>
    )
  }
];

const ARROW_SHAPES = [
  {
    id: 'arrow-right',
    name: 'Arrow Right',
    type: 'arrow-right',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="2,10 2,20 25,20 25,25 38,15 25,5 25,10" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'arrow-left',
    name: 'Arrow Left',
    type: 'arrow-left',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="38,10 38,20 15,20 15,25 2,15 15,5 15,10" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'arrow-up',
    name: 'Arrow Up',
    type: 'arrow-up',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="10,28 20,28 20,8 25,8 15,2 5,8 10,8" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'arrow-down',
    name: 'Arrow Down',
    type: 'arrow-down',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <polygon points="10,2 20,2 20,22 25,22 15,28 5,22 10,22" fill="currentColor" stroke="none" />
      </svg>
    )
  }
];

const LINE_SHAPES = [
  {
    id: 'line',
    name: 'Line',
    type: 'line',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <line x1="5" y1="15" x2="35" y2="15" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    )
  },
  {
    id: 'dashed-line',
    name: 'Dashed Line',
    type: 'dashed-line',
    preview: (
      <svg width="40" height="30" viewBox="0 0 40 30">
        <line x1="5" y1="15" x2="35" y2="15" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4 2" />
      </svg>
    )
  }
];

export const ShapesPanel: React.FC = () => {
  const { theme } = useTheme();
  const { addElement } = useCanvasStore();
  
  // Shape properties state
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapeSize, setShapeSize] = useState(100);
  const [cornerRadius, setCornerRadius] = useState(0);

  const handleShapeClick = (shape: any) => {
    const element = {
      id: `shape_${shape.id}_${Date.now()}`,
      type: 'shape' as const,
      x: 100,
      y: 100,
      width: shapeSize,
      height: shape.type === 'circle' ? shapeSize : Math.round(shapeSize * 0.8),
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      shapeType: shape.type,
      fill: shape.type.includes('line') ? 'transparent' : fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      cornerRadius: shape.type === 'rectangle' ? cornerRadius : 0,
      strokeDashArray: shape.type.includes('dashed') ? [4, 2] : undefined
    };
    
    addElement(element);
  };

  const ShapeGrid: React.FC<{ shapes: any[], title: string }> = ({ shapes, title }) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: theme.colors?.textPrimary || '#f5f8fa',
        marginBottom: '12px'
      }}>
        {title}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
        gap: '12px'
      }}>
        {shapes.map((shape) => (
          <div
            key={shape.id}
            onClick={() => handleShapeClick(shape)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: theme.colors?.cardBg || '#394b59',
              border: `1px solid ${theme.colors?.border || '#495563'}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors?.primary || '#48aff0';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors?.border || '#495563';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title={`Add ${shape.name}`}
            role="button"
            tabIndex={0}
            aria-label={`Add ${shape.name}`}
          >
            <div style={{ 
              color: theme.colors?.textPrimary || '#f5f8fa',
              marginBottom: '8px'
            }}>
              {shape.preview}
            </div>
            <span style={{
              fontSize: '11px',
              textAlign: 'center',
              color: theme.colors?.textPrimary || '#f5f8fa',
              lineHeight: '1.2'
            }}>
              {shape.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Shape Properties */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: theme.colors?.textPrimary || '#f5f8fa',
          marginBottom: '12px'
        }}>
          Shape Properties
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Size */}
          <FormGroup label="Size">
            <NumericInput
              value={shapeSize}
              onValueChange={(value) => setShapeSize(value)}
              min={10}
              max={500}
              stepSize={10}
              fill
            />
          </FormGroup>

          {/* Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <FormGroup label="Fill">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '30px',
                  border: '1px solid #495563',
                  borderRadius: '3px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              />
            </FormGroup>
            
            <FormGroup label="Stroke">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '30px',
                  border: '1px solid #495563',
                  borderRadius: '3px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              />
            </FormGroup>
          </div>

          {/* Stroke Width and Corner Radius */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <FormGroup label="Stroke Width">
              <NumericInput
                value={strokeWidth}
                onValueChange={(value) => setStrokeWidth(value)}
                min={0}
                max={20}
                stepSize={1}
                fill
              />
            </FormGroup>
            
            <FormGroup label="Corner Radius">
              <NumericInput
                value={cornerRadius}
                onValueChange={(value) => setCornerRadius(value)}
                min={0}
                max={50}
                stepSize={1}
                fill
              />
            </FormGroup>
          </div>
        </div>
      </div>

      {/* Shapes Grid */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}>
        <ShapeGrid shapes={BASIC_SHAPES} title="Basic Shapes" />
        <ShapeGrid shapes={ARROW_SHAPES} title="Arrows" />
        <ShapeGrid shapes={LINE_SHAPES} title="Lines" />
      </div>
    </div>
  );
};

ShapesPanel.displayName = 'ShapesPanel';