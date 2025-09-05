import React from 'react';
import { observer } from "mobx-react-lite";
// import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import CanvasEngine from '../canvas/CanvasEngine';
import { BottomZoomControls } from '../canvas/BottomZoomControls';
import { CanvasTopBar } from '../canvas/CanvasTopBar';
// import { ActionBar } from '../navigation/ActionBar';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvas } from '@/hooks/useCanvas';

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
      backgroundColor: theme.colors?.canvasBg || '#364459',
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
  <div style={{
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
    background: '#364459' // Canvas background from theme
  }}>
    {children}
  </div>
);


// we need observer to update component automatically on any store changes
export const MainCanvas: React.FC<MainCanvasProps> = observer(({ className }) => {
  const { theme } = useTheme();
  const { zoom, setZoom } = useCanvasStore();
  const { zoomToFit } = useCanvas();

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handleAutoFit = () => {
    zoomToFit();
  };

  return (
    <CanvasContainer theme={theme} className={className}>
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
});


export type { MainCanvasProps };