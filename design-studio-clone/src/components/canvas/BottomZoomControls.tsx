import React, { useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { Button } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

interface BottomZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onAutoFit: () => void;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

const BottomZoomControls: React.FC<BottomZoomControlsProps> = observer(({
  zoom,
  onZoomChange,
  onAutoFit,
  minZoom = 0.05,
  maxZoom = 20.0,
  className
}) => {
  const { theme } = useTheme();

  const zoomPercentage = Math.round(zoom * 100);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(maxZoom, zoom * 1.25);
    onZoomChange(newZoom);
  }, [zoom, maxZoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(minZoom, zoom / 1.25);
    onZoomChange(newZoom);
  }, [zoom, minZoom, onZoomChange]);

  const handleAutoFit = useCallback(() => {
    onAutoFit();
  }, [onAutoFit]);

  return (
    <div 
      className={className}
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: theme.colors?.primaryBg || '#252a30',
        border: `1px solid ${theme.colors?.border || '#495563'}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        zIndex: 1000,
        userSelect: 'none',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Zoom Out Button */}
      <Button
        icon="minus"
        minimal
        small
        onClick={handleZoomOut}
        disabled={zoom <= minZoom}
        title="Zoom out (Ctrl + -)"
        style={{
          color: zoom <= minZoom ? '#8a9ba8' : '#f5f8fa',
          width: '28px',
          height: '28px',
          minHeight: '28px',
          minWidth: '28px',
        }}
      />
      
      {/* Zoom Percentage Display */}
      <div
        onClick={handleAutoFit}
        title="Auto-fit canvas (Ctrl + 0)"
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: theme.colors?.text || '#f5f8fa',
          minWidth: '48px',
          textAlign: 'center',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          background: 'rgba(255, 255, 255, 0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(72, 175, 240, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
      >
        {zoomPercentage}%
      </div>
      
      {/* Zoom In Button */}
      <Button
        icon="plus"
        minimal
        small
        onClick={handleZoomIn}
        disabled={zoom >= maxZoom}
        title="Zoom in (Ctrl + +)"
        style={{
          color: zoom >= maxZoom ? '#8a9ba8' : '#f5f8fa',
          width: '28px',
          height: '28px',
          minHeight: '28px',
          minWidth: '28px',
        }}
      />
    </div>
  );
});

export { BottomZoomControls };
export type { BottomZoomControlsProps };