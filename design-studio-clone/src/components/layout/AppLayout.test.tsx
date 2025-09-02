import React from 'react';

interface AppLayoutProps {
  children?: React.ReactNode;
  leftToolbar?: React.ReactNode;
  mainCanvas?: React.ReactNode;
  rightPanel?: React.ReactNode;
  topNavigation?: React.ReactNode;
}

// Minimal test version without styled components
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  leftToolbar,
  mainCanvas,
  rightPanel,
  topNavigation,
}) => {
  return (
    <div data-testid="app-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {topNavigation && (
        <div data-testid="top-navigation" style={{ height: '64px', backgroundColor: '#394b59' }}>
          {topNavigation}
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {leftToolbar && (
          <div style={{ width: '72px', backgroundColor: '#252a30' }}>
            {leftToolbar}
          </div>
        )}
        <div style={{ flex: 1, backgroundColor: '#2f343c' }}>
          {mainCanvas}
        </div>
        {rightPanel && (
          <div style={{ width: '350px', backgroundColor: '#394b59' }}>
            {rightPanel}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};