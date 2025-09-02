import React from 'react';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import CanvasEngine from '../canvas/CanvasEngine';

interface MainCanvasProps {
  className?: string;
}

const CanvasContainer = styled.div<{ theme: any }>`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme.colors.canvasBg};
  overflow: hidden;
`;

export const MainCanvas: React.FC<MainCanvasProps> = ({ className }) => {
  const { theme } = useTheme();

  return (
    <CanvasContainer theme={theme} className={className}>
      <CanvasEngine />
    </CanvasContainer>
  );
};

export type { MainCanvasProps };