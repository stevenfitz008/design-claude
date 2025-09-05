import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface PositionIndicatorProps {
  element: CanvasElement | null;
  visible: boolean;
  className?: string;
}

const IndicatorContainer = styled.div<{ theme: any; visible: boolean }>`
  position: fixed;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.primaryBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: ${props => props.theme.colors.text};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 90;
  opacity: ${props => props.visible ? 1 : 0};
  pointer-events: none;
  transform: ${props => props.visible 
    ? 'translateX(-50%) translateY(0) scale(1)' 
    : 'translateX(-50%) translateY(-5px) scale(0.95)'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
`;

const CoordinateGroup = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: 6px;
  
  .label {
    color: ${props => props.theme.colors.textMuted};
    font-weight: 500;
  }
  
  .value {
    color: ${props => props.theme.colors.text};
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    font-weight: 600;
  }
`;

const Separator = styled.div<{ theme: any }>`
  width: 1px;
  height: 16px;
  background: ${props => props.theme.colors.border};
`;

const DimensionGroup = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: 6px;
  
  .label {
    color: ${props => props.theme.colors.textMuted};
    font-weight: 500;
  }
  
  .value {
    color: ${props => props.theme.colors.accent};
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    font-weight: 600;
  }
`;

const LayerInfo = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: 4px;
  
  .label {
    color: ${props => props.theme.colors.textMuted};
    font-size: 11px;
  }
  
  .value {
    color: ${props => props.theme.colors.text};
    font-weight: 600;
  }
`;

export const PositionIndicator: React.FC<PositionIndicatorProps> = observer(({
  element,
  visible,
  className,
}) => {
  const { theme } = useTheme();
  const { elements, zoom } = useCanvasStore();

  const positionData = useMemo(() => {
    if (!element) return null;

    // Get element layer index (z-index equivalent)
    const layerIndex = elements.findIndex(el => el.id === element.id) + 1;
    const totalLayers = elements.length;

    // Format coordinates with appropriate precision
    const formatValue = (value: number, unit: string = 'px') => {
      return `${Math.round(value)}${unit}`;
    };

    // Calculate relative position if element is within a group
    const relativeX = element.x;
    const relativeY = element.y;

    // Calculate canvas-relative position
    const canvasX = relativeX;
    const canvasY = relativeY;

    return {
      coordinates: {
        x: formatValue(canvasX),
        y: formatValue(canvasY),
      },
      dimensions: {
        width: formatValue(element.width),
        height: formatValue(element.height),
      },
      layer: {
        current: layerIndex,
        total: totalLayers,
      },
      rotation: element.rotation || 0,
      opacity: element.opacity || 1,
    };
  }, [element, elements]);

  if (!positionData || !visible) {
    return (
      <IndicatorContainer theme={theme} visible={false} className={className}>
        {/* Empty container for smooth transition */}
      </IndicatorContainer>
    );
  }

  return (
    <IndicatorContainer theme={theme} visible={visible} className={className}>
      {/* Coordinates */}
      <CoordinateGroup theme={theme}>
        <span className="label">X:</span>
        <span className="value">{positionData.coordinates.x}</span>
      </CoordinateGroup>

      <CoordinateGroup theme={theme}>
        <span className="label">Y:</span>
        <span className="value">{positionData.coordinates.y}</span>
      </CoordinateGroup>

      <Separator theme={theme} />

      {/* Dimensions */}
      <DimensionGroup theme={theme}>
        <span className="label">W:</span>
        <span className="value">{positionData.dimensions.width}</span>
      </DimensionGroup>

      <DimensionGroup theme={theme}>
        <span className="label">H:</span>
        <span className="value">{positionData.dimensions.height}</span>
      </DimensionGroup>

      <Separator theme={theme} />

      {/* Layer information */}
      <LayerInfo theme={theme}>
        <span className="label">Layer:</span>
        <span className="value">
          {positionData.layer.current}/{positionData.layer.total}
        </span>
      </LayerInfo>

      {/* Rotation (if not zero) */}
      {positionData.rotation !== 0 && (
        <>
          <Separator theme={theme} />
          <CoordinateGroup theme={theme}>
            <span className="label">°:</span>
            <span className="value">{Math.round(positionData.rotation)}°</span>
          </CoordinateGroup>
        </>
      )}

      {/* Opacity (if not 100%) */}
      {positionData.opacity !== 1 && (
        <>
          <Separator theme={theme} />
          <CoordinateGroup theme={theme}>
            <span className="label">α:</span>
            <span className="value">{Math.round(positionData.opacity * 100)}%</span>
          </CoordinateGroup>
        </>
      )}

      {/* Zoom level indicator */}
      <Separator theme={theme} />
      <LayerInfo theme={theme}>
        <span className="label">Zoom:</span>
        <span className="value">{Math.round(zoom * 100)}%</span>
      </LayerInfo>
    </IndicatorContainer>
  );
});

PositionIndicator.displayName = 'PositionIndicator';