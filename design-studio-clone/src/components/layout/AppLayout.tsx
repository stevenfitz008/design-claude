import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeProvider';

interface AppLayoutProps {
  children?: React.ReactNode;
  leftToolbar?: React.ReactNode;
  mainCanvas?: React.ReactNode;
  rightPanel?: React.ReactNode;
  topNavigation?: React.ReactNode;
}

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setRightPanelVisible(false);
      } else {
        setRightPanelVisible(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#2f343c',
      color: '#f5f8fa',
      overflow: 'hidden'
    }} data-testid="app-layout">
      {topNavigation && (
        <div style={{
          height: '64px',
          backgroundColor: '#252a30',
          borderBottom: '1px solid #495563',
          flexShrink: 0,
          zIndex: 10
        }} data-testid="top-navigation">
          {topNavigation}
        </div>
      )}
      
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: leftToolbarVisible ? '72px' : '0',
          backgroundColor: '#252a30',
          borderRight: '1px solid #495563',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.15s ease',
          zIndex: 5,
          ...(isMobile && {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: leftToolbarVisible ? '72px' : '0'
          })
        }} data-testid="left-toolbar">
          {leftToolbar}
        </div>
        
        <div style={{
          width: rightPanelVisible ? '350px' : '0',
          backgroundColor: '#394b59',
          borderRight: '1px solid #495563',
          flexShrink: 0,
          overflow: 'hidden',
          transition: isMobile ? 'transform 0.15s ease' : 'width 0.15s ease',
          zIndex: 6,
          position: 'relative',
          ...(isMobile && {
            position: 'absolute',
            top: 0,
            left: leftToolbarVisible ? '72px' : '0',
            height: '100%',
            width: '350px',
            transform: rightPanelVisible ? 'translateX(0)' : 'translateX(-100%)'
          })
        }} data-testid="right-panel">
          {rightPanel}
          
          {/* Desktop toggle tab */}
          {!isMobile && (
            <button
              onClick={toggleRightPanel}
              style={{
                position: 'absolute',
                top: '50%',
                right: rightPanelVisible ? '-16px' : '-32px',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '60px',
                backgroundColor: '#394b59',
                border: '1px solid #495563',
                borderLeft: rightPanelVisible ? 'none' : '1px solid #495563',
                borderRadius: rightPanelVisible ? '0 8px 8px 0' : '8px',
                color: '#a7b6c2',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                zIndex: 7,
                transition: 'all 0.15s ease',
                boxShadow: rightPanelVisible ? 'none' : '2px 0 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f5f8fa';
                e.currentTarget.style.backgroundColor = '#485563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#a7b6c2';
                e.currentTarget.style.backgroundColor = '#394b59';
              }}
              title={rightPanelVisible ? 'Hide panel' : 'Show panel'}
            >
              {rightPanelVisible ? '«' : '»'}
            </button>
          )}
          
          {/* Mobile close button */}
          {isMobile && rightPanelVisible && (
            <button
              onClick={toggleRightPanel}
              style={{
                position: 'absolute',
                top: '50%',
                right: '-20px',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '40px',
                backgroundColor: '#394b59',
                border: '1px solid #495563',
                borderLeft: 'none',
                borderRadius: '0 8px 8px 0',
                color: '#f5f8fa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                zIndex: 7
              }}
            >
              ×
            </button>
          )}
        </div>
        
        <div style={{
          flex: 1,
          backgroundColor: '#2f343c',
          position: 'relative',
          overflow: 'hidden',
          ...(isMobile && leftToolbarVisible && {
            marginLeft: rightPanelVisible ? '0' : '0'
          })
        }} data-testid="main-canvas">
          {mainCanvas}
        </div>
      </div>
      
      {children}
      
      {/* Mobile panel toggle button */}
      {isMobile && !rightPanelVisible && (
        <button
          onClick={toggleRightPanel}
          style={{
            position: 'fixed',
            top: '50%',
            left: leftToolbarVisible ? '82px' : '10px',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            backgroundColor: '#394b59',
            border: '1px solid #495563',
            borderRadius: '50%',
            color: '#f5f8fa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          ☰
        </button>
      )}
      
      {/* Desktop panel toggle button when closed */}
      {!isMobile && !rightPanelVisible && (
        <button
          onClick={toggleRightPanel}
          style={{
            position: 'fixed',
            top: '50%',
            left: leftToolbarVisible ? '82px' : '10px',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '60px',
            backgroundColor: '#394b59',
            border: '1px solid #495563',
            borderRadius: '8px',
            color: '#a7b6c2',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            zIndex: 7,
            boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f5f8fa';
            e.currentTarget.style.backgroundColor = '#485563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a7b6c2';
            e.currentTarget.style.backgroundColor = '#394b59';
          }}
          title="Show panel"
        >
          »
        </button>
      )}
      
      {/* Mobile overlay */}
      {isMobile && rightPanelVisible && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 5
          }}
          onClick={toggleRightPanel}
        />
      )}
    </div>
  );
};

export type { AppLayoutProps };
export default AppLayout;