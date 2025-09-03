import React, { useState } from 'react';
import { observer } from "mobx-react-lite";
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
  max-height: 100vh; /* Ensure no overflow beyond viewport */
  max-width: 100vw;  /* Ensure no overflow beyond viewport */
  min-height: 0;     /* Allow flex shrinking */
  background-color: ${props => props.theme.colors.canvasBg};
  color: ${props => props.theme.colors.textPrimary};
  overflow: hidden;
  position: fixed;   /* Fix to viewport for browser fitting */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  min-height: 0; /* Allow flex shrinking for proper browser fit */
  position: relative;
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
  min-height: 0; /* Allow flex shrinking for proper browser fit */
  min-width: 0;  /* Allow flex shrinking for proper browser fit */
  /* Canvas is now on the right side */
`;

const RightPanelContainer = styled.div<{ theme: any; isVisible: boolean }>`
  width: ${props => props.isVisible ? props.theme.layout.rightPanelWidth : '0'};
  background-color: ${props => props.theme.colors.panelBg};
  border-left: 1px solid ${props => props.theme.colors.borderColor};
  border-right: 1px solid ${props => props.theme.colors.borderColor};
  flex-shrink: 0;
  overflow: hidden;
  transition: width ${props => props.theme.transitions.normal};
  z-index: 5;
`;

// we need observer to update component automatically on any store changes
export const AppLayout: React.FC<AppLayoutProps> = observer(({
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
    <LayoutContainer theme={theme} data-testid="app-layout">
      {topNavigation && (
        <TopNavigationContainer theme={theme} data-testid="top-navigation">
          {topNavigation}
        </TopNavigationContainer>
      )}
      
      <MainContainer>
        <LeftToolbarContainer theme={theme} isVisible={leftToolbarVisible} data-testid="left-toolbar">
          {leftToolbar}
        </LeftToolbarContainer>
        
        <MainCanvasContainer theme={theme} data-testid="main-canvas">
          {mainCanvas}
        </MainCanvasContainer>
        
        <RightPanelContainer theme={theme} isVisible={rightPanelVisible} data-testid="right-panel">
          {rightPanel}
        </RightPanelContainer>
      </MainContainer>
      
      {children}
    </LayoutContainer>
  );
});

export type { AppLayoutProps };