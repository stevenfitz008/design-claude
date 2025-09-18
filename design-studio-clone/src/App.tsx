import React, { useState } from 'react';
import { LeftToolbar, MainCanvas, RightPanel, TopNavigation } from './components/basic';

function App() {
  const [activeTool, setActiveTool] = useState('photos');

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#2f343c',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Navigation */}
      <TopNavigation
        projectName="Design Studio"
        onSave={() => console.log('Save')}
        onExport={() => console.log('Export')}
        onShare={() => console.log('Share')}
        onUndo={() => console.log('Undo')}
        onRedo={() => console.log('Redo')}
        canUndo={false}
        canRedo={false}
      />
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Left Toolbar */}
        <LeftToolbar 
          activeTool={activeTool}
          onToolChange={handleToolChange}
        />
        
        {/* Main Canvas */}
        <MainCanvas />
        
        {/* Right Panel */}
        <RightPanel activeTool={activeTool} />
      </div>
    </div>
  );
}

export default App;