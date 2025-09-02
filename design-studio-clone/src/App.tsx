// Import goober setup FIRST before any React components
import '@styles/goober-setup';

import React, { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@components/layout/AppLayout.test';
import { LeftToolbar, MainCanvas, RightPanel, TopNavigation } from '@components/basic';
import '@styles/blueprint-theme.css';
import '@styles/variables.css';
import '@styles/globals.css';

const AppContent: React.FC = () => {
  const [activeTool, setActiveTool] = useState('templates');
  const [projectName, setProjectName] = useState('Untitled Design');

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleSave = () => {
    console.log('Save project');
  };

  const handleExport = () => {
    console.log('Export project');
  };

  const handleShare = () => {
    console.log('Share project');
  };

  const handleUndo = () => {
    console.log('Undo action');
  };

  const handleRedo = () => {
    console.log('Redo action');
  };

  return (
    <AppLayout
      topNavigation={
        <TopNavigation
          projectName={projectName}
          onSave={handleSave}
          onExport={handleExport}
          onShare={handleShare}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={false}
          canRedo={false}
        />
      }
      leftToolbar={
        <LeftToolbar 
          activeTool={activeTool}
          onToolChange={handleToolChange}
        />
      }
      mainCanvas={
        <MainCanvas />
      }
      rightPanel={
        <RightPanel />
      }
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App
