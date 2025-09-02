import React, { useState } from 'react';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';

interface AppLayoutProps {
  children?: React.ReactNode;
  leftToolbar?: React.ReactNode;
  mainCanvas?: React.ReactNode;
  rightPanel?: React.ReactNode;
  topNavigation?: React.ReactNode;
}

const LayoutContainer = styled.div<{ theme: any }>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: ${props => props.theme.colors.canvasBg};
  color: ${props => props.theme.colors.textPrimary};
  overflow: hidden;
`;

const TopNavigationContainer = styled.div<{ theme: any }>`
  height: ${props => props.theme.layout.topNavHeight};
  background-color: ${props => props.theme.colors.toolbarBg};
  border-bottom: 1px solid ${props => props.theme.colors.borderColor};
  flex-shrink: 0;
  z-index: 10;
`;

const MainContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftToolbarContainer = styled.div<{ theme: any; isVisible: boolean }>`
  width: ${props => props.isVisible ? props.theme.layout.leftToolbarWidth : '0'};
  background-color: ${props => props.theme.colors.toolbarBg};
  border-right: 1px solid ${props => props.theme.colors.borderColor};
  flex-shrink: 0;
  overflow: hidden;
  transition: width ${props => props.theme.transitions.normal};
  z-index: 5;
`;

const MainCanvasContainer = styled.div<{ theme: any }>`
  flex: 1;
  background-color: ${props => props.theme.colors.canvasBg};
  position: relative;
  overflow: hidden;
`;

const RightPanelContainer = styled.div<{ theme: any; isVisible: boolean }>`
  width: ${props => props.isVisible ? props.theme.layout.rightPanelWidth : '0'};
  background-color: ${props => props.theme.colors.panelBg};
  border-left: 1px solid ${props => props.theme.colors.borderColor};
  flex-shrink: 0;
  overflow: hidden;
  transition: width ${props => props.theme.transitions.normal};
  z-index: 5;
`;

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  leftToolbar,
  mainCanvas,
  rightPanel,
  topNavigation
}) => {
  const { theme } = useTheme();
  const [leftToolbarVisible, setLeftToolbarVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);

  // Expose panel visibility controls through context or props
  const layoutControls = {
    leftToolbarVisible,
    rightPanelVisible,
    toggleLeftToolbar: () => setLeftToolbarVisible(!leftToolbarVisible),
    toggleRightPanel: () => setRightPanelVisible(!rightPanelVisible),
  };

  return (
    <LayoutContainer theme={theme}>
      {topNavigation && (
        <TopNavigationContainer theme={theme}>
          {topNavigation}
        </TopNavigationContainer>
      )}
      
      <MainContainer>
        <LeftToolbarContainer theme={theme} isVisible={leftToolbarVisible}>
          {leftToolbar}
        </LeftToolbarContainer>
        
        <MainCanvasContainer theme={theme}>
          {mainCanvas}
        </MainCanvasContainer>
        
        <RightPanelContainer theme={theme} isVisible={rightPanelVisible}>
          {rightPanel}
        </RightPanelContainer>
      </MainContainer>
      
      {children}
    </LayoutContainer>
  );
};

export type { AppLayoutProps };