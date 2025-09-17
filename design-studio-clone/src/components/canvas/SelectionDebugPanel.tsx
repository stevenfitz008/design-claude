import React, { useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvas } from '@/hooks/useCanvas';

const SelectionDebugPanel: React.FC = () => {
  const { elements, selection, deleteElements, clearSelection } = useCanvasStore();
  const { selectionRectangle } = useCanvas();
  const [isMinimized, setIsMinimized] = useState(false);
  
  const clearCanvas = () => {
    const allIds = elements.map(el => el.id);
    deleteElements(allIds);
    clearSelection();
    console.log('🧹 Canvas cleared - all elements removed');
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: isMinimized ? '5px' : '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      maxWidth: isMinimized ? 'auto' : '300px',
      minWidth: isMinimized ? '120px' : 'auto',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isMinimized ? '0' : '5px'
      }}>
        <strong>Debug Panel</strong>
        <button 
          onClick={toggleMinimized}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            marginLeft: '8px'
          }}
          title={isMinimized ? 'Maximize' : 'Minimize'}
        >
          {isMinimized ? '□' : '_'}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <div>Total Elements: {elements.length}</div>
          <div>Selected IDs: {selection.join(', ') || 'none'}</div>
          
          {/* Element Details */}
          {elements.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '10px' }}>
              <strong>Elements:</strong>
              {elements.map((el, index) => (
                <div key={el.id} style={{ marginLeft: '8px', opacity: selection.includes(el.id) ? 1 : 0.7 }}>
                  {index + 1}. {el.type} ({Math.round(el.width)}×{Math.round(el.height)})
                  {el.type === 'image' && (
                    <div style={{ marginLeft: '12px', fontSize: '9px' }}>
                      Original: {(el as any).originalWidth}×{(el as any).originalHeight}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div>Selection Rectangle: 
            {selectionRectangle.visible ? (
              <div>
                • Visible: true<br/>
                • x1: {Math.round(selectionRectangle.x1)}<br/>
                • y1: {Math.round(selectionRectangle.y1)}<br/>
                • x2: {Math.round(selectionRectangle.x2)}<br/>
                • y2: {Math.round(selectionRectangle.y2)}
              </div>
            ) : (
              ' Hidden'
            )}
          </div>
          <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.8 }}>
            <strong>Instructions:</strong><br/>
            • Click elements to select<br/>
            • Ctrl+click for multi-select<br/>
            • Drag on empty area for selection rectangle<br/>
            • Text elements show only horizontal resize handles
          </div>
          
          {/* Clear Canvas Button */}
          <button 
            onClick={clearCanvas}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#ff6666'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#ff4444'}
          >
            🧹 Clear Canvas ({elements.length} elements)
          </button>
        </>
      )}

      {isMinimized && (
        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
          {elements.length} elements | {selection.length} selected
        </div>
      )}
    </div>
  );
};

export default SelectionDebugPanel;