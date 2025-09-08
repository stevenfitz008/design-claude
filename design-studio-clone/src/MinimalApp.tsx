import React from 'react';
import { AppLayout, LeftToolbar, TopNavigation } from './components/basic';
import { useCanvasStore } from './stores/canvasStore';
import { usePanelStore } from './stores/panelStore';

export default function MinimalApp() {
  try {
    // Step 3: Test stores
    const canvasStore = useCanvasStore();
    const panelStore = usePanelStore();
    
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#1e1e1e', 
        color: 'white', 
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        <h1>Minimal Design Studio</h1>
        <p>Testing component by component...</p>
        
        {/* Step 2: Test basic layout components */}
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #333' }}>
          <h2>Step 2: Basic Layout Components Test</h2>
          <div style={{ height: '200px', border: '1px solid #555' }}>
            <AppLayout>
              <TopNavigation />
              <LeftToolbar />
              <div>Basic layout loaded successfully!</div>
            </AppLayout>
          </div>
        </div>

        {/* Step 3: Test stores */}
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #333' }}>
          <h2>Step 3: Stores Test</h2>
          <div>Canvas Store: {canvasStore ? '✅ Loaded' : '❌ Failed'}</div>
          <div>Panel Store: {panelStore ? '✅ Loaded' : '❌ Failed'}</div>
          <div>Active Panel: {panelStore?.activePanel || 'none'}</div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'red', 
        color: 'white', 
        minHeight: '100vh'
      }}>
        <h1>Error in MinimalApp (Step 3):</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}