import React from 'react';
import { errorLogger } from './utils/errorLogger';
import { ErrorBoundary } from './components/debug/ErrorBoundary';
import { DebugPanel } from './components/debug/DebugPanel';
import { useCanvasStore } from './stores/canvasStore';
import { usePanelStore } from './stores/panelStore';

export default function StoreTestApp() {
  try {
    console.log('🧪 StoreTestApp: Starting comprehensive store testing...');
    errorLogger.logError('Test app started', { 
      component: 'StoreTestApp', 
      action: 'Initialization',
      additionalData: { testMode: true }
    });
    
    // Step 1: Store imports now handled at top level
    console.log('StoreTestApp: Store imports successful!');
    
    // Step 2: Test store initialization
    console.log('StoreTestApp: Initializing stores...');
    const canvasStore = useCanvasStore();
    const panelStore = usePanelStore();
    
    console.log('StoreTestApp: Stores initialized successfully!');
    console.log('Canvas store elements:', canvasStore?.elements?.length || 'undefined');
    console.log('Panel store activePanel:', panelStore?.activePanel || 'undefined');

    return (
      <ErrorBoundary componentName="StoreTestApp">
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#1e1e1e', 
          color: 'white', 
          minHeight: '100vh',
          fontSize: '16px'
        }}>
          <h1>🧪 Store Test App with Debugging</h1>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2f343c', borderRadius: '8px' }}>
            <h2>✅ Store Import Test</h2>
            <p>Both stores imported successfully without errors!</p>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2f343c', borderRadius: '8px' }}>
            <h2>🏪 Store Status</h2>
            <div style={{ fontFamily: 'monospace', backgroundColor: '#252a30', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
              <div>📦 Canvas Store: {canvasStore ? '✅ Loaded' : '❌ Failed'}</div>
              <div>📦 Panel Store: {panelStore ? '✅ Loaded' : '❌ Failed'}</div>
              <div>📊 Elements Count: {canvasStore?.elements?.length || 0}</div>
              <div>🎛️ Active Panel: {panelStore?.activePanel || 'none'}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#27ae60', color: 'white', borderRadius: '8px' }}>
            <h2>🎉 Success!</h2>
            <p>If you can see this, the stores are working correctly.</p>
            <p><small>Debug panel available in bottom-right corner. Press Ctrl+Shift+D to toggle.</small></p>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#8e44ad', color: 'white', borderRadius: '8px' }}>
            <h2>🔧 Debug Features</h2>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li>Error logging with stack traces</li>
              <li>Debug panel with error summary</li>
              <li>Global error boundary protection</li>
              <li>Console debugging tools: <code>designStudioDebug</code></li>
            </ul>
            <button 
              onClick={() => errorLogger.logError('Test error from button', { 
                component: 'StoreTestApp', 
                action: 'Manual Test' 
              })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Test Error Logging
            </button>
            <button 
              onClick={() => {throw new Error('Test error boundary')}}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Test Error Boundary
            </button>
          </div>
        </div>
        <DebugPanel />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('StoreTestApp: Error occurred:', error);
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'red', 
        color: 'white', 
        minHeight: '100vh'
      }}>
        <h1>❌ Store Test Error</h1>
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.3)', 
          padding: '15px', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          marginTop: '20px'
        }}>
          <pre>{String(error)}</pre>
          <pre>{error.stack}</pre>
        </div>
      </div>
    );
  }
}