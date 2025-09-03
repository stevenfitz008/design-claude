import React, { useCallback, useState } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes
import { styled } from '@styles/goober-setup';
import { Button, Slider, Popover, Menu, MenuItem } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import type { ZoomControlProps } from '@/types/pages';

const ZoomContainer = styled.div<{ theme: any }>`
  position: fixed;
  bottom: 100px; /* Above page carousel */
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.theme.colors.primaryBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 90;
`;

const ZoomDisplay = styled.div<{ theme: any }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  min-width: 40px;
  text-align: center;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 3px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ZoomSliderContainer = styled.div<{ theme: any }>`
  width: 120px;
  padding: 16px;
  
  .bp5-slider-handle {
    background-color: ${props => props.theme.colors.primary} !important;
    border-color: ${props => props.theme.colors.primary} !important;
  }
  
  .bp5-slider-track .bp5-slider-progress {
    background-color: ${props => props.theme.colors.primary} !important;
  }
`;

const QuickZoomMenu = styled(Menu)`
  min-width: 140px;
`;

const ZoomControls: React.FC<ZoomControlProps> = observer(({
  zoom,
  onZoomChange,
  minZoom = 0.1,
  maxZoom = 5.0,
  fitToScreen,
  className,
}) => {
  const { theme } = useTheme();
  const [showSlider, setShowSlider] = useState(false);

  const zoomPercentage = Math.round(zoom * 100);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(maxZoom, zoom * 1.25);
    onZoomChange(newZoom);
  }, [zoom, maxZoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(minZoom, zoom / 1.25);
    onZoomChange(newZoom);
  }, [zoom, minZoom, onZoomChange]);

  const handleSliderChange = useCallback((value: number) => {
    onZoomChange(value / 100);
  }, [onZoomChange]);

  const handleQuickZoom = useCallback((targetZoom: number) => {
    onZoomChange(targetZoom);
  }, [onZoomChange]);

  const handleFitToScreen = useCallback(() => {
    fitToScreen();
  }, [fitToScreen]);

  const quickZoomMenu = (
    <QuickZoomMenu>
      <MenuItem
        text="Fit to Screen"
        onClick={handleFitToScreen}
        icon="maximize"
      />
      <MenuItem
        text="100%"
        onClick={() => handleQuickZoom(1.0)}
        active={zoomPercentage === 100}
      />
      <MenuItem
        text="75%"
        onClick={() => handleQuickZoom(0.75)}
        active={zoomPercentage === 75}
      />
      <MenuItem
        text="50%"
        onClick={() => handleQuickZoom(0.5)}
        active={zoomPercentage === 50}
      />
      <MenuItem
        text="25%"
        onClick={() => handleQuickZoom(0.25)}
        active={zoomPercentage === 25}
      />
      <Menu.Divider />
      <MenuItem
        text="200%"
        onClick={() => handleQuickZoom(2.0)}
        active={zoomPercentage === 200}
      />
      <MenuItem
        text="300%"
        onClick={() => handleQuickZoom(3.0)}
        active={zoomPercentage === 300}
      />
      <MenuItem
        text="500%"
        onClick={() => handleQuickZoom(5.0)}
        active={zoomPercentage === 500}
      />
    </QuickZoomMenu>
  );

  const sliderPopover = (
    <ZoomSliderContainer theme={theme}>
      <Slider
        min={minZoom * 100}
        max={maxZoom * 100}
        stepSize={5}
        labelStepSize={100}
        value={zoomPercentage}
        onChange={handleSliderChange}
        vertical={false}
        showTrackFill
        labelRenderer={(value: number) => `${value}%`}
      />
    </ZoomSliderContainer>
  );

  return (
    <ZoomContainer theme={theme} className={className}>
      <Button
        icon="zoom-out"
        minimal
        small
        onClick={handleZoomOut}
        disabled={zoom <= minZoom}
        title="Zoom out (Ctrl + -)"
      />
      
      <Popover
        content={sliderPopover}
        position="top"
        isOpen={showSlider}
        onInteraction={setShowSlider}
      >
        <Popover
          content={quickZoomMenu}
          position="top-right"
          disabled={showSlider}
        >
          <ZoomDisplay theme={theme} title="Click for zoom options">
            {zoomPercentage}%
          </ZoomDisplay>
        </Popover>
      </Popover>
      
      <Button
        icon="zoom-in"
        minimal
        small
        onClick={handleZoomIn}
        disabled={zoom >= maxZoom}
        title="Zoom in (Ctrl + +)"
      />
      
      <Button
        icon="zoom-to-fit"
        minimal
        small
        onClick={handleFitToScreen}
        title="Fit to screen (Ctrl + 0)"
      />
    </ZoomContainer>
  );
});

export { ZoomControls };
export type { ZoomControlProps };