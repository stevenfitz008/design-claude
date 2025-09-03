import React from 'react';
import { observer } from "mobx-react-lite";
// import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import CanvasEngine from '../canvas/CanvasEngine';
import { usePageStore } from '@/stores/pageStore';

interface MainCanvasProps {
  className?: string;
}

// Temporarily using inline styles to fix styled.div error
// const CanvasContainer = styled.div<{ theme: any }>`...
const CanvasContainer: React.FC<{ theme: any; className?: string; children: React.ReactNode }> = ({ theme, className, children }) => (
  <div 
    className={className}
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors?.canvasBg || '#364459',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: 0, // Ensure no padding for edge-to-edge frame
      margin: 0   // Ensure no margin for edge-to-edge frame
    }}
  >
    {children}
  </div>
);

const CanvasArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    padding: 0, // Edge-to-edge for autofit
    margin: 0,  // Edge-to-edge for autofit
    width: '100%', // Ensure full width utilization for autofit
    height: '100%' // Ensure full height utilization for autofit
  }}>
    {children}
  </div>
);

const PagesArea: React.FC<{ theme: any; children: React.ReactNode }> = ({ theme, children }) => (
  <div style={{
    height: '48px', // Reduced from 80px to give more space to canvas
    backgroundColor: theme.colors?.toolbarBg || '#252a30',
    borderTop: `1px solid ${theme.colors?.border || '#495563'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 16px', // Reduced padding for more compact layout
    flexShrink: 0 // Prevent it from shrinking
  }}>
    {children}
  </div>
);

// we need observer to update component automatically on any store changes
export const MainCanvas: React.FC<MainCanvasProps> = observer(({ className }) => {
  const { theme } = useTheme();

  return (
    <CanvasContainer theme={theme} className={className}>
      <CanvasArea>
        <CanvasEngine />
      </CanvasArea>
      <PagesArea theme={theme}>
        <SimplePageCarousel />
      </PagesArea>
    </CanvasContainer>
  );
});

// Simple page carousel component that matches Polotno Studio
const SimplePageCarousel: React.FC = () => {
  const { pages, currentPageId, setCurrentPageId, addPage, removePage } = usePageStore();
  const { theme } = useTheme();

  const handleAddPage = () => {
    addPage({
      name: `Page ${pages.length + 1}`,
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      elements: []
    });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '100%'
    }}>
      {/* Zoom indicator - matches Polotno */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: theme.colors?.text || '#f5f8fa',
        fontSize: '12px'
      }}>
        <span>68%</span>
        <div style={{
          width: '1px',
          height: '16px',
          backgroundColor: theme.colors?.border || '#495563'
        }} />
      </div>

      {/* Pages */}
      <div style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center'
      }}>
        {pages.map((page, index) => (
          <div
            key={page.id}
            onClick={() => setCurrentPageId(page.id)}
            style={{
              width: '48px',
              height: '30px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: currentPageId === page.id ? '2px solid #48aff0' : '1px solid #495563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: '#666',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {index + 1}
          </div>
        ))}
        
        {/* Add page button */}
        <button
          onClick={handleAddPage}
          style={{
            width: '32px',
            height: '28px', // Slightly smaller to fit in reduced height area
            backgroundColor: 'transparent',
            border: '2px dashed #8a9ba8',
            borderRadius: '4px',
            color: '#8a9ba8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

export type { MainCanvasProps };