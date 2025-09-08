import React from 'react';
// import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import CanvasEngine from '../canvas/CanvasEngine';
import { BottomZoomControls } from '../canvas/BottomZoomControls';
import { CanvasTopBar } from '../canvas/CanvasTopBar';
// import { ActionBar } from '../navigation/ActionBar';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasCentering } from '@/hooks/useCanvasCentering';

interface MainCanvasProps {
  className?: string;
}

// Temporarily using inline styles to fix styled.div error
// const CanvasContainer = styled.div<{ theme: any }>`...
const CanvasContainer: React.FC<{ theme: any; className?: string; children: React.ReactNode }> = ({ theme, className, children }) => (
  <div 
    className={className}
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors?.canvasBg || '#2f343c',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: 0, // Ensure no padding for edge-to-edge frame
      margin: 0   // Ensure no margin for edge-to-edge frame
    }}
  >
    {children}
  </div>
);

const CanvasArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="main-canvas-area" style={{
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    padding: 0,
    margin: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#2f343c', // Canvas background matching Polotno Studio
    // Account for bottom zoom controls (height ~40px + 16px bottom margin = ~56px)
    paddingBottom: '56px' // This shifts the visual center up to account for bottom controls
  }}>
    {children}
  </div>
);


export const MainCanvas: React.FC<MainCanvasProps> = ({ className }) => {
  const { theme } = useTheme();
  const { zoom, setZoom } = useCanvasStore();
  const { zoomToFit } = useCanvas();
  
  // Enable automatic centering behavior
  useCanvasCentering();

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handleAutoFit = () => {
    zoomToFit();
  };

  return (
    <CanvasContainer theme={theme} className={`main-canvas-container ${className || ''}`}>
      <CanvasTopBar />
      <CanvasArea>
        <CanvasEngine />
        <BottomZoomControls
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onAutoFit={handleAutoFit}
          minZoom={0.1}
          maxZoom={5.0}
        />
      </CanvasArea>
    </CanvasContainer>
  );
};


export type { MainCanvasProps };