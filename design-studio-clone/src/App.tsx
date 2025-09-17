import React, { useState, useEffect } from 'react';
import './styles/goober-setup'; // Initialize Goober CSS-in-JS setup
import './styles/global-icons.css'; // Global icon theming
import { AppLayout, LeftToolbar } from './components/basic';
import { TopNavigation } from './components/layout/TopNavigation';
import { ThemeProvider } from './contexts/ThemeProvider';
import { MainCanvas } from './components/layout/MainCanvas';
import { PhotosPanelSimple } from './components/panels/PhotosPanelSimple';
import { VideosPanel } from './components/panels/VideosPanel';
import { IconsPanel } from './components/panels/IconsPanel';
import { TextPanel } from './components/panels/TextPanel';
import { ShapesPanel } from './components/panels/ShapesPanel';
import { ResizePanel } from './components/panels/ResizePanel';
import { BackgroundMediaPanel } from './components/panels/BackgroundMedia';
import { LayersPanel } from './components/panels/LayersPanel';
import { useTextEditor } from './hooks/useTextEditor';
import { preloadEssentialFonts } from './services/googleFonts';
import { useCanvasStore } from './stores/canvasStore';
import type { TextTemplate } from './components/panels/TextPanel';

const AppContent: React.FC = () => {
  const [activeTool, setActiveTool] = useState('templates');
  const [projectName] = useState('Untitled Design');
  const [leftContextPanelVisible, setLeftContextPanelVisible] = useState(true);
  const { createTextFromTemplate } = useTextEditor();
  const { addElement, elements } = useCanvasStore();

  // Helper function to generate unique IDs
  const generateId = (): string => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

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

  const toggleLeftContextPanel = () => {
    setLeftContextPanelVisible(!leftContextPanelVisible);
  };

  // Handle text template selection
  const handleTextTemplateSelect = async (template: TextTemplate) => {
    try {
      // Create text at canvas center
      await createTextFromTemplate(template, 300, 200);
    } catch (error) {
      console.error('Failed to create text from template:', error);
    }
  };

  // Preload fonts on app start
  useEffect(() => {
    preloadEssentialFonts().catch(error => {
      console.warn('Failed to preload essential fonts:', error);
    });
  }, []);

  // Note: Drag and drop handling is now exclusively handled by CanvasEngine
  // to prevent duplicate elements from being created

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
    
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
      rightPanel={leftContextPanelVisible ? (
        <div style={{ backgroundColor: '#2f343c', height: '100%', width: '525px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Collapsible Tab integrated into panel - positioned on right side */}
          <div
            onClick={toggleLeftContextPanel}
            title="Collapse context panel"
            style={{
              position: 'absolute',
              right: '-24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '80px',
              backgroundColor: '#252a30',
              border: '1px solid #495563',
              borderRadius: '0 12px 12px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              zIndex: 1000,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(72, 175, 240, 0.1)';
              e.currentTarget.style.transform = 'translateY(-50%) translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#252a30';
              e.currentTarget.style.transform = 'translateY(-50%)';
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              style={{
                width: '12px',
                height: '12px',
                color: '#a7b6c2',
                transition: 'transform 0.15s ease',
                transform: 'rotate(180deg)'
              }}
            >
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* All panel headings removed for clean design consistency */}
            {false && (
              <h3 style={{ color: '#f5f8fa', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                {activeTool === 'templates' ? 'Templates' : 
                 activeTool === 'uploads' ? 'Upload' :
                 activeTool === 'elements' ? 'Icons' :
                 activeTool === 'text' ? 'Text' : 
                 activeTool === 'shapes' ? 'Shapes' :
                 activeTool === 'videos' ? 'Videos' :
                 activeTool === 'background' ? 'Background' :
                 activeTool === 'layers' ? 'Layers' :
                 activeTool === 'resize' ? 'Resize' :
                 activeTool === 'quotes' ? 'Quotes' :
                 activeTool === 'qr-code' ? 'QR Code' :
                 activeTool === 'ai-img' ? 'AI Img' : 'Panel'}
              </h3>
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTool === 'photos' ? (
              <PhotosPanelSimple />
            ) : activeTool === 'videos' ? (
              <VideosPanel />
            ) : activeTool === 'elements' ? (
              <IconsPanel />
            ) : activeTool === 'text' ? (
              <TextPanel onTemplateSelect={handleTextTemplateSelect} />
            ) : activeTool === 'shapes' ? (
              <ShapesPanel />
            ) : activeTool === 'resize' ? (
              <ResizePanel />
            ) : activeTool === 'background' ? (
              <BackgroundMediaPanel />
            ) : activeTool === 'layers' ? (
              <LayersPanel />
            ) : (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                height: '300px',
                color: '#8a9ba8',
                textAlign: 'center',
                gap: '16px'
              }}>
                <div style={{ fontSize: '48px', opacity: 0.5 }}>
                  {activeTool === 'templates' ? '📄' :
                   activeTool === 'uploads' ? '📁' :
                   activeTool === 'elements' ? '⭐' :
                   activeTool === 'text' ? 'T' :
                   activeTool === 'shapes' ? '🔷' :
                   activeTool === 'videos' ? '🎥' :
                   activeTool === 'background' ? '🎨' :
                   activeTool === 'layers' ? '📚' :
                   activeTool === 'resize' ? '📐' :
                   activeTool === 'quotes' ? '💭' :
                   activeTool === 'qr-code' ? '📱' :
                   activeTool === 'ai-img' ? '🤖' : '📋'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#bfccd6', marginBottom: '8px' }}>
                    {activeTool === 'photos' ? 'Photos' : 
                     activeTool === 'templates' ? 'Templates' : 
                     activeTool === 'uploads' ? 'Upload' :
                     activeTool === 'elements' ? 'Icons' :
                     activeTool === 'text' ? 'Text' : 
                     activeTool === 'shapes' ? 'Shapes' :
                     activeTool === 'videos' ? 'Videos' :
                     activeTool === 'background' ? 'Background' :
                     activeTool === 'layers' ? 'Layers' :
                     activeTool === 'resize' ? 'Resize' :
                     activeTool === 'quotes' ? 'Quotes' :
                     activeTool === 'qr-code' ? 'QR Code' :
                     activeTool === 'ai-img' ? 'AI Img' : 'Panel'} Tools
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.4', maxWidth: '250px' }}>
                    {activeTool === 'templates' ? 'Choose from thousands of professionally designed templates' :
                     activeTool === 'uploads' ? 'Upload your own images, videos, and files' :
                     activeTool === 'elements' ? 'Add icons and decorative elements to your design' :
                     activeTool === 'text' ? 'Add and customize text with various fonts and styles' :
                     activeTool === 'shapes' ? 'Add geometric shapes, lines, and basic forms' :
                     activeTool === 'videos' ? 'Browse and add video content to your design' :
                     activeTool === 'background' ? 'Set solid colors, gradients, or image backgrounds' :
                     activeTool === 'layers' ? 'Manage and organize your design layers' :
                     activeTool === 'resize' ? 'Change canvas dimensions and aspect ratios' :
                     activeTool === 'quotes' ? 'Add inspirational quotes and text blocks' :
                     activeTool === 'qr-code' ? 'Create custom QR codes for your designs' :
                     activeTool === 'ai-img' ? 'Generate images using AI technology' :
                     'Select a tool from the left toolbar to get started'}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      ) : (
        /* Expand Tab when context panel is collapsed - positioned next to left toolbar */
        <div
          onClick={toggleLeftContextPanel}
          title="Expand context panel"
          style={{
            position: 'fixed',
            left: '72px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '80px',
            backgroundColor: '#252a30',
            border: '1px solid #495563',
            borderRadius: '0 12px 12px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            zIndex: 1000,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(72, 175, 240, 0.1)';
            e.currentTarget.style.transform = 'translateY(-50%) translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#252a30';
            e.currentTarget.style.transform = 'translateY(-50%)';
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              width: '12px',
              height: '12px',
              color: '#a7b6c2',
              transition: 'transform 0.15s ease',
              transform: 'rotate(0deg)'
            }}
          >
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
