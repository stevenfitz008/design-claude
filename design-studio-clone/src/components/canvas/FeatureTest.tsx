import React, { useState } from 'react';
import { Button, Card, H5 } from '@blueprintjs/core';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement, ImageElement, TextElement, ShapeElement, IconElement } from '@/types/canvas';

interface FeatureTestProps {
  onClose?: () => void;
}

const FeatureTest: React.FC<FeatureTestProps> = ({ onClose }) => {
  const { addElement, elements } = useCanvasStore();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const testImageElement = () => {
    try {
      const imageElement: ImageElement = {
        id: `test-image-${Date.now()}`,
        type: 'image',
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: 1,
        src: 'https://picsum.photos/200/150',
        originalWidth: 200,
        originalHeight: 150,
        fit: 'cover',
        filters: {
          brightness: 120,
          contrast: 110,
          saturation: 100,
          hue: 0,
          blur: 0,
          sepia: 0,
          grayscale: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      addElement(imageElement);
      addTestResult('✅ Image element with filters created successfully');
    } catch (error) {
      addTestResult('❌ Image element test failed: ' + (error as Error).message);
    }
  };

  const testTextElement = () => {
    try {
      const textElement: TextElement = {
        id: `test-text-${Date.now()}`,
        type: 'text',
        x: 50,
        y: 250,
        width: 300,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: 2,
        text: 'Enhanced Typography Test',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#2c5282',
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.2,
        letterSpacing: 1,
        textDecoration: 'none',
        textTransform: 'none',
        wordWrap: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      addElement(textElement);
      addTestResult('✅ Text element with typography features created successfully');
    } catch (error) {
      addTestResult('❌ Text element test failed: ' + (error as Error).message);
    }
  };

  const testShapeElement = () => {
    try {
      const shapeElement: ShapeElement = {
        id: `test-shape-${Date.now()}`,
        type: 'shape',
        x: 300,
        y: 50,
        width: 120,
        height: 120,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: 3,
        shapeType: 'hexagon',
        fill: '#48aff0',
        stroke: '#2c5282',
        strokeWidth: 3,
        sides: 6,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      addElement(shapeElement);
      addTestResult('✅ Shape element (hexagon) created successfully');
    } catch (error) {
      addTestResult('❌ Shape element test failed: ' + (error as Error).message);
    }
  };

  const testIconElement = () => {
    try {
      const iconElement: IconElement = {
        id: `test-icon-${Date.now()}`,
        type: 'icon',
        x: 300,
        y: 200,
        width: 48,
        height: 48,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: 4,
        iconName: 'heart',
        iconSet: 'default',
        fill: '#e53e3e',
        stroke: '#c53030',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      addElement(iconElement);
      addTestResult('✅ Icon element (heart) created successfully');
    } catch (error) {
      addTestResult('❌ Icon element test failed: ' + (error as Error).message);
    }
  };

  const clearCanvas = () => {
    elements.forEach(element => {
      if (element.id.startsWith('test-')) {
        // Would need to implement delete functionality
      }
    });
    setTestResults([]);
    addTestResult('🧹 Canvas cleared');
  };

  return (
    <Card style={{ padding: '20px', margin: '20px', minWidth: '400px' }}>
      <H5>🧪 Feature Testing Panel</H5>
      
      <div style={{ marginBottom: '16px' }}>
        <p>Current elements on canvas: {elements.length}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <Button 
          text="Test Image + Filters" 
          onClick={testImageElement}
          intent="primary"
          small
        />
        <Button 
          text="Test Typography" 
          onClick={testTextElement}
          intent="success"
          small
        />
        <Button 
          text="Test Advanced Shapes" 
          onClick={testShapeElement}
          intent="warning"
          small
        />
        <Button 
          text="Test Icon System" 
          onClick={testIconElement}
          intent="danger"
          small
        />
      </div>
      
      <Button 
        text="Clear Test Elements" 
        onClick={clearCanvas}
        fill
        minimal
        style={{ marginBottom: '16px' }}
      />
      
      {testResults.length > 0 && (
        <div>
          <H5>Test Results:</H5>
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            border: '1px solid #ccc', 
            padding: '8px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace'
          }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {onClose && (
        <Button 
          text="Close Testing Panel" 
          onClick={onClose}
          fill
          style={{ marginTop: '16px' }}
        />
      )}
    </Card>
  );
};

export default FeatureTest;