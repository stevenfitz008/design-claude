import React, { useState, useEffect } from 'react';
import './styles/goober-setup'; // Initialize Goober CSS-in-JS setup
import { AppLayout, LeftToolbar, TopNavigation } from './components/basic';
import { MainCanvas } from './components/layout/MainCanvas';
import { PhotosPanelSimple } from './components/panels/PhotosPanelSimple';
import { VideosPanel } from './components/panels/VideosPanel';
import { IconsPanel } from './components/panels/IconsPanel';
import { TextPanel } from './components/panels/TextPanel';
import { ShapesPanel } from './components/panels/ShapesPanel';
import { ResizePanel } from './components/panels/ResizePanel';
import { BackgroundMediaPanel } from './components/panels/BackgroundMedia';
import { LayersPanel } from './components/panels/LayersPanel';
import { ReportsPanel } from './components/panels/ReportsPanel';
import { useTextEditor } from './hooks/useTextEditor';
import { preloadEssentialFonts } from './services/googleFonts';
import { useCanvasStore } from './stores/canvasStore';
import { useDragTrackingStore } from './stores/dragTrackingStore';
import type { TextTemplate } from './components/panels/TextPanel';
import { reportsService } from './services/reportsService';
import { authService } from './services/authService';

// Initialize authService with demo user for testing
if (!authService.isAuthenticated()) {
  const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWY2czRpMHEwMDA1MTFyNW8xcDBhcXdmIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwicGxhbiI6IkZSRUUiLCJpYXQiOjE3NTcxNTQ3MjQsImV4cCI6MTc1NzI0MTEyNH0.Dm9vJa-NM-TWUCC_kEgZqgtIKKZErNmhIeeCdGtGVLA';
  const demoUser = {
    id: 'cmf6s4i0q000511r5o1p0aqwf',
    email: 'test@example.com',
    name: 'John Doe',
    plan: 'FREE',
    preferences: {
      theme: 'dark',
      autoSave: true,
      language: 'en',
      showGrid: false,
      showGuides: false,
      snapToGrid: false,
      snapToGuides: false,
      defaultCanvasSize: { width: 800, height: 600 }
    },
    limits: {
      maxProjects: 50,
      hasAIFeatures: false,
      maxStorageSize: 1024,
      hasCollaboration: false,
      hasAdvancedExport: false,
      maxExportsPerMonth: 10
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  // Store in localStorage and reload authService
  localStorage.setItem('accessToken', demoToken);
  localStorage.setItem('user', JSON.stringify(demoUser));
  authService.reloadFromStorage();
}

const AppContent: React.FC = () => {
  const [activeTool, setActiveTool] = useState('templates');
  const [projectName] = useState('Untitled Design');
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const { createTextFromTemplate } = useTextEditor();
  const { addElement, elements, undo, redo, canUndo, canRedo, pushHistory, canvasSize } = useCanvasStore();
  const { startDrag, endDrag, updateDrag, updateDropPreview, clearDropPreview, isDropzoneActive } = useDragTrackingStore();
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000); // Auto-hide after 4 seconds
  };

  // Helper function to generate unique IDs
  const generateId = (): string => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleSave = async () => {
    try {
      console.log('💾 Saving project...');
      
      // Get current canvas state
      const currentCanvasState = {
        elements,
        canvasSize, // Use actual canvas size from store
        projectName,
        createdAt: new Date().toISOString()
      };

      // Get user info for author field
      const currentUser = authService.getUser();
      const authorName = currentUser?.name || 'Unknown User';

      // Prepare report data for API (matching CreateReportDto structure)
      const reportData = {
        title: projectName,
        description: `Design with ${elements.length} elements created on ${new Date().toLocaleDateString()}`,
        author: authorName,
        category: 'Design',
        tags: ['canvas', 'design'],
        isPublic: false,
        isPublished: true
      };

      console.log('📊 Saving report data:', reportData);
      
      // Call the Reports API to save
      const savedReport = await reportsService.createReport(reportData);
      
      console.log('✅ Project saved successfully!', savedReport);
      
      // Show success notification to user
      showNotification(`"${projectName}" saved successfully!`, 'success');
      
    } catch (error) {
      console.error('❌ Failed to save project:', error);
      showNotification('Failed to save project. Please try again.', 'error');
    }
  };

  const handleExport = () => {
    console.log('Export project');
  };

  const handleShare = () => {
    console.log('Share project');
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
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

  // Global drag and drop handlers
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Update drop preview position
    const target = e.target as HTMLElement;
    const canvasElement = document.querySelector('.konvajs-content') || document.querySelector('[data-testid="main-canvas"]');
    const isOverCanvas = canvasElement && (canvasElement.contains(target) || canvasElement === target);
    
    if (isOverCanvas) {
      const canvasRect = canvasElement.getBoundingClientRect();
      const dropX = e.clientX - canvasRect.left;
      const dropY = e.clientY - canvasRect.top;
      
      updateDropPreview({
        visible: true,
        x: dropX,
        y: dropY,
        type: 'canvas-drop-zone'
      });
    } else {
      clearDropPreview();
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    clearDropPreview();
    
    // Check if drop is on canvas area
    const target = e.target as HTMLElement;
    const canvasElement = document.querySelector('.konvajs-content') || document.querySelector('[data-testid="main-canvas"]');
    const isDropOnCanvas = canvasElement && (canvasElement.contains(target) || canvasElement === target);
    
    if (isDropOnCanvas) {
      // Forward to canvas drop handler
      console.log('📍 Drop is on canvas area');
      
      const dragData = e.dataTransfer.getData('application/json');
      if (dragData) {
        const data = JSON.parse(dragData);
        console.log('📦 Global drop data:', data);
        
        // Track the drop operation  
        let resultElementId: string | null = null;
        let success = false;
        
        // Calculate drop position (simplified - center of canvas area)
        const canvasRect = canvasElement.getBoundingClientRect();
        const dropX = e.clientX - canvasRect.left - 100; // Center the element
        const dropY = e.clientY - canvasRect.top - 100;
        
        // Start drag tracking
        startDrag({
          type: 'panel-to-canvas',
          sourceType: data.type,
          sourceData: data,
          startPosition: { x: e.clientX, y: e.clientY },
          targetType: 'canvas',
          metadata: { dragData: data }
        });

        // Handle different types of dragged items
        switch (data.type) {
          case 'test':
            alert('Global drag and drop works: ' + data.message);
            endDrag(true);
            break;
            
          case 'photo':
            console.log('📸 Adding photo to canvas:', data.src);
            resultElementId = generateId();
            addElement({
              id: resultElementId,
              type: 'image',
              x: Math.max(0, dropX),
              y: Math.max(0, dropY),
              width: 200,
              height: 200,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              visible: true,
              locked: false,
              zIndex: elements.length + 1,
              src: data.src,
              alt: data.alt || 'Dragged photo',
              originalWidth: 200,
              originalHeight: 200,
              fit: 'cover' as const,
              filters: {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
                blur: 0,
                sepia: 0,
                grayscale: 0
              },
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            pushHistory('ADD_PHOTO', 'Added photo from drag and drop');
            success = true;
            endDrag(true, resultElementId);
            break;
            
          case 'shape':
            console.log('🔷 Adding shape to canvas:', data.shapeType);
            resultElementId = generateId();
            addElement({
              id: resultElementId,
              type: 'shape',
              x: Math.max(0, dropX),
              y: Math.max(0, dropY),
              width: 100,
              height: 100,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              visible: true,
              locked: false,
              zIndex: elements.length + 1,
              shapeType: data.shapeType,
              fill: data.fill || '#48aff0',
              stroke: data.stroke,
              strokeWidth: data.strokeWidth || 2,
              cornerRadius: data.cornerRadius,
              sides: data.sides,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            pushHistory('ADD_SHAPE', `Added ${data.shapeType} from drag and drop`);
            success = true;
            endDrag(true, resultElementId);
            break;
            
          case 'video':
            console.log('🎬 Adding video to canvas:', data.src);
            resultElementId = generateId();
            addElement({
              id: resultElementId,
              type: 'video',
              x: Math.max(0, dropX),
              y: Math.max(0, dropY),
              width: data.width && data.height ? Math.min(300, data.width) : 300,
              height: data.width && data.height ? (Math.min(300, data.width) / data.aspect_ratio) : 200,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              visible: true,
              locked: false,
              zIndex: elements.length + 1,
              src: data.src,
              poster: data.thumbnail,
              originalWidth: data.width || 300,
              originalHeight: data.height || 200,
              duration: data.duration || 0,
              currentTime: 0,
              autoplay: false,
              loop: false,
              muted: true,
              controls: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            pushHistory('ADD_VIDEO', 'Added video from drag and drop');
            success = true;
            endDrag(true, resultElementId);
            break;
            
          case 'text':
            console.log('📝 Adding text to canvas:', data.text);
            addElement({
              id: generateId(),
              type: 'text',
              x: Math.max(0, dropX),
              y: Math.max(0, dropY),
              width: 200,
              height: 50,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              visible: true,
              locked: false,
              zIndex: elements.length + 1,
              text: data.text || 'Text Element',
              fontSize: data.fontSize || 16,
              fontFamily: data.fontFamily || 'Arial',
              fontWeight: data.fontWeight || 'normal',
              fontStyle: data.fontStyle || 'normal',
              color: data.color || '#000000',
              textAlign: data.textAlign || 'left',
              verticalAlign: data.verticalAlign || 'top',
              lineHeight: data.lineHeight || 1.2,
              letterSpacing: data.letterSpacing || 0,
              textDecoration: data.textDecoration || 'none',
              textTransform: 'none' as const,
              wordWrap: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            endDrag(true, generateId());
            break;

          case 'background':
            console.log('🎨 Setting canvas background:', data.src);
            // For backgrounds, we could either:
            // 1. Set as canvas background
            // 2. Add as image element (current implementation for simplicity)
            addElement({
              id: generateId(),
              type: 'image',
              x: Math.max(0, dropX),
              y: Math.max(0, dropY),
              width: 300,
              height: 200,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              visible: true,
              locked: false,
              zIndex: 0, // Background should be behind other elements
              src: data.src,
              alt: data.alt || 'Background',
              originalWidth: 300,
              originalHeight: 200,
              cornerRadius: 0,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            endDrag(true, generateId());
            break;
          default:
            endDrag(false); // Unknown type
            break;
        }
      }
    }
  };

  return (
    <div
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
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
          canUndo={canUndo()}
          canRedo={canRedo()}
          reportId={currentReportId}
          onReportChange={setCurrentReportId}
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
      rightPanel={rightPanelVisible ? (
        <div style={{ backgroundColor: '#2f343c', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Collapsible Tab integrated into panel */}
          <div
            onClick={toggleRightPanel}
            title="Collapse panel"
            style={{
              position: 'absolute',
              left: '-24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '80px',
              backgroundColor: '#252a30',
              border: '1px solid #495563',
              borderRadius: '12px 0 0 12px',
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
              e.currentTarget.style.transform = 'translateY(-50%) translateX(-2px)';
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
            ) : activeTool === 'reports' ? (
              <ReportsPanel />
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
                  {activeTool === 'templates' ? 'T' :
                   activeTool === 'uploads' ? 'U' :
                   activeTool === 'elements' ? 'E' :
                   activeTool === 'text' ? 'T' :
                   activeTool === 'shapes' ? 'S' :
                   activeTool === 'videos' ? 'V' :
                   activeTool === 'background' ? 'B' :
                   activeTool === 'layers' ? 'L' :
                   activeTool === 'resize' ? 'R' :
                   activeTool === 'quotes' ? 'Q' :
                   activeTool === 'qr-code' ? 'QR' :
                   activeTool === 'ai-img' ? 'AI' :
                   activeTool === 'reports' ? 'RP' : 
                   activeTool === 'photos' ? 'P' : 'D'}
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
                     activeTool === 'ai-img' ? 'AI Img' :
                     activeTool === 'reports' ? 'Reports' : 'Panel'} Tools
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
                     activeTool === 'reports' ? 'Manage your design reports and multi-page documents' :
                     'Select a tool from the left toolbar to get started'}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      ) : (
        /* Expand Tab when panel is collapsed */
        <div
          onClick={toggleRightPanel}
          title="Expand panel"
          style={{
            position: 'fixed',
            right: '0px',
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
      )}
    />
    
    {/* Notification Toast */}
    {notification && (
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        backgroundColor: notification.type === 'success' ? '#48aff0' : '#e74c3c',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '300px',
        animation: 'slideInFromRight 0.3s ease-out'
      }}>
        <span style={{
          fontSize: '16px'
        }}>
          {notification.type === 'success' ? '✅' : '❌'}
        </span>
        {notification.message}
      </div>
    )}
    </div>
  );
};

function App() {
  return <AppContent />;
}

export default App;
