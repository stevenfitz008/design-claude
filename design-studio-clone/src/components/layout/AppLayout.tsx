import React, { useState } from 'react';
// Collapsible tab functionality - positioned in border area
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
  position: relative;
`;

const CollapseTab = styled.div<{ theme: any; isVisible: boolean }>`
  position: absolute;
  right: ${props => props.isVisible ? '0px' : '-24px'};
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 80px;
  background-color: ${props => props.theme.colors.toolbarBg};
  border: 1px solid ${props => props.theme.colors.borderColor};
  border-radius: 12px 0 0 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${props => props.theme.transitions.normal};
  z-index: 15;
  box-shadow: ${props => props.theme.shadows.sm};
  
  &:hover {
    background-color: ${props => props.theme.colors.hoverBg};
    transform: translateY(-50%) translateX(-2px);
  }
  
  svg {
    width: 12px;
    height: 12px;
    color: ${props => props.theme.colors.textSecondary};
    transition: transform ${props => props.theme.transitions.normal};
    transform: ${props => props.isVisible ? 'rotate(0deg)' : 'rotate(180deg)'};
  }
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
          <div
            onClick={layoutControls.toggleRightPanel}
            title={rightPanelVisible ? "Collapse panel" : "Expand panel"}
            style={{
              position: 'absolute',
              right: rightPanelVisible ? '0px' : '-24px',
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
              zIndex: 15,
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
                transform: rightPanelVisible ? 'rotate(0deg)' : 'rotate(180deg)'
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