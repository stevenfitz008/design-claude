import React, { useEffect, useState, useRef } from 'react';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import type { PositionCalloutProps } from '@/types/pages';

const CalloutContainer = styled.div<{ 
  visible: boolean; 
  x: number; 
  y: number; 
  theme: any;
}>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y - 40}px; /* Position above the cursor/element */
  pointer-events: none;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)'};
  transition: all 0.2s ease-out;
`;

const CalloutBubble = styled.div<{ theme: any }>`
  position: relative;
  background: ${props => props.theme.colors.primaryBg};
  color: ${props => props.theme.colors.text};
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Roboto Mono', monospace;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  
  /* Arrow pointing down */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: ${props => props.theme.colors.primaryBg};
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
  }
  
  /* Arrow border */
  &::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 7px solid transparent;
    border-top-color: ${props => props.theme.colors.border};
    z-index: -1;
  }
`;

const CoordinateDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Coordinate = styled.span<{ axis: 'x' | 'y'; theme: any }>`
  color: ${props => props.axis === 'x' ? '#e74c3c' : '#3498db'};
  font-weight: 700;
  
  &::before {
    content: '${props => props.axis.toUpperCase()}: ';
    color: ${props => props.theme.colors.textSecondary};
    font-weight: 500;
  }
`;

const PositionCallout: React.FC<PositionCalloutProps> = ({
  x,
  y,
  visible,
  elementId,
  className,
}) => {
  const { theme } = useTheme();
  const [displayPosition, setDisplayPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Convert canvas coordinates to screen coordinates if needed
  useEffect(() => {
    if (visible) {
      // Add a small delay to prevent flickering during rapid movements
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDisplayPosition({ x: Math.round(x), y: Math.round(y) });
        setIsVisible(true);
      }, 50);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [x, y, visible]);

  // Auto-hide after a delay when not dragging
  useEffect(() => {
    if (visible && !elementId) {
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 2000); // Hide after 2 seconds of inactivity

      return () => clearTimeout(hideTimeout);
    }
  }, [visible, elementId]);

  if (!visible && !isVisible) {
    return null;
  }

  return (
    <CalloutContainer
      visible={isVisible}
      x={displayPosition.x}
      y={displayPosition.y}
      theme={theme}
      className={className}
    >
      <CalloutBubble theme={theme}>
        <CoordinateDisplay>
          <Coordinate axis="x" theme={theme}>
            {displayPosition.x}
          </Coordinate>
          <Coordinate axis="y" theme={theme}>
            {displayPosition.y}
          </Coordinate>
        </CoordinateDisplay>
      </CalloutBubble>
    </CalloutContainer>
  );
};

// Hook for managing position callout state
export const usePositionCallout = () => {
  const [calloutState, setCalloutState] = useState({
    x: 0,
    y: 0,
    visible: false,
    elementId: undefined as string | undefined,
  });

  const showCallout = (x: number, y: number, elementId?: string) => {
    setCalloutState({ x, y, visible: true, elementId });
  };

  const hideCallout = () => {
    setCalloutState(prev => ({ ...prev, visible: false }));
  };

  const updatePosition = (x: number, y: number) => {
    setCalloutState(prev => ({ ...prev, x, y }));
  };

  return {
    calloutState,
    showCallout,
    hideCallout,
    updatePosition,
  };
};

export { PositionCallout };
export type { PositionCalloutProps };