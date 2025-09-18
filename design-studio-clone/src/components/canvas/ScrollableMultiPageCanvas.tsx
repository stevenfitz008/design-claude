import React, { useRef, useEffect, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { usePageStore } from '@/stores/pageStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { usePageThumbnails } from '@/hooks/usePageThumbnails';
import CanvasEngine from './CanvasEngine';

interface ScrollableMultiPageCanvasProps {
  className?: string;
}

/**
 * ScrollableMultiPageCanvas - Polotno-style multi-page canvas system
 * Displays all pages vertically in a scrollable container
 * Each page has its own canvas/stage
 */
export const ScrollableMultiPageCanvas: React.FC<ScrollableMultiPageCanvasProps> = observer(({ className }) => {
  const { pages, currentPageId, setCurrentPageId } = usePageStore();
  const { setElements, setCanvasSize, setBackgroundColor, zoom } = useCanvasStore();
  const { setStageRef } = usePageThumbnails();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Inject custom CSS for enhanced scrolling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .smooth-scroll-container {
        scroll-behavior: smooth !important;
        -webkit-overflow-scrolling: touch;
        overflow-scrolling: touch;
      }

      .smooth-scroll-container::-webkit-scrollbar {
        width: 8px;
        background: rgba(229, 229, 229, 0.5);
      }

      .smooth-scroll-container::-webkit-scrollbar-track {
        background: rgba(229, 229, 229, 0.3);
        border-radius: 4px;
      }

      .smooth-scroll-container::-webkit-scrollbar-thumb {
        background: #48aff0;
        border-radius: 4px;
        transition: background 0.2s ease;
      }

      .smooth-scroll-container::-webkit-scrollbar-thumb:hover {
        background: #2e5bba;
      }

      .page-container {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .page-container:hover {
        transform: translateY(-2px);
        filter: brightness(1.02);
      }

      .page-canvas-container {
        transition: all 0.2s ease-out;
        will-change: transform, box-shadow;
      }

      .page-canvas-container:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle page in view detection for auto-switching active page
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    // Find which page is most centered in the viewport
    let closestPage = null;
    let closestDistance = Infinity;

    pages.forEach((page) => {
      const pageElement = pageRefs.current.get(page.id);
      if (pageElement) {
        const pageRect = pageElement.getBoundingClientRect();
        const pageCenter = pageRect.top + pageRect.height / 2;
        const distance = Math.abs(pageCenter - containerCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = page.id;
        }
      }
    });

    if (closestPage && closestPage !== currentPageId) {
      setCurrentPageId(closestPage);
    }
  }, [pages, currentPageId, setCurrentPageId]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Enhanced smooth scroll to active page with Polotno-style transitions
  useEffect(() => {
    if (!currentPageId) return;

    const pageElement = pageRefs.current.get(currentPageId);
    const container = scrollContainerRef.current;

    if (pageElement && container) {
      // Smooth scroll with enhanced easing
      const animateScroll = () => {
        const containerRect = container.getBoundingClientRect();
        const pageRect = pageElement.getBoundingClientRect();

        // Calculate the target scroll position to center the page perfectly
        const containerCenter = containerRect.height / 2;
        const pageCenter = pageRect.height / 2;
        const targetScrollTop = container.scrollTop + (pageRect.top - containerRect.top) - containerCenter + pageCenter;

        // Enhanced smooth scroll with better easing
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });

        // Update canvas store with new page dimensions immediately for seamless transition
        const currentPage = pages.find(p => p.id === currentPageId);
        if (currentPage) {
          setCanvasSize({ width: currentPage.width, height: currentPage.height });
          setElements(currentPage.elements || []);
          setBackgroundColor(currentPage.backgroundColor);
        }
      };

      // Use requestAnimationFrame for smooth animation timing
      requestAnimationFrame(animateScroll);
    }
  }, [currentPageId, pages, setCanvasSize, setElements, setBackgroundColor]);

  // Store page ref
  const setPageRef = useCallback((pageId: string, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(pageId, element);
    } else {
      pageRefs.current.delete(pageId);
    }
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={`${className} smooth-scroll-container`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: '#f5f5f5', // Polotno Studio exact background color
        scrollBehavior: 'smooth',
        // Enhanced smooth scrolling properties
        WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
        scrollbarWidth: 'thin',
        scrollbarColor: '#48aff0 #e5e5e5'
      }}
    >
      {/* Container without zoom scaling - let CanvasEngine handle zoom */}
      <div
        style={{
          padding: '60px 40px',
          width: '100%',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {pages.map((page, index) => (
        <div
          key={page.id}
          ref={(el) => setPageRef(page.id, el)}
          className="page-container"
          style={{
            marginBottom: index < pages.length - 1 ? '80px' : '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* Page Header */}
          <div style={{
            marginBottom: '12px',
            padding: '8px 16px',
            background: currentPageId === page.id ? '#48aff0' : '#666',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}>
            {page.name}
          </div>

          {/* Individual Page Canvas Container */}
          <div
            onClick={() => setCurrentPageId(page.id)}
            className="page-canvas-container"
            style={{
              width: `${page.width}px`,
              height: `${page.height}px`,
              background: page.backgroundColor || '#ffffff',
              border: currentPageId === page.id ? '2px solid #48aff0' : '1px solid #e0e0e0',
              borderRadius: '0px',
              boxShadow: currentPageId === page.id ?
                '0 4px 16px rgba(72, 175, 240, 0.3)' :
                '0 2px 8px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              overflow: 'hidden', // Keep content contained within page boundaries
              position: 'relative'
            }}
          >
            {/* Only render the active page's canvas engine */}
            {currentPageId === page.id ? (
              <CanvasEngine />
            ) : (
              // Render a placeholder/thumbnail for inactive pages
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: page.backgroundColor || '#ffffff',
                fontSize: '48px',
                color: '#ccc',
                fontWeight: '300'
              }}>
                {page.thumbnail ? (
                  <img
                    src={page.thumbnail}
                    alt={page.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ fontSize: '64px', opacity: 0.3 }}>📄</div>
                    <div style={{
                      fontSize: '16px',
                      color: '#999',
                      textAlign: 'center',
                      maxWidth: '200px'
                    }}>
                      Click to edit {page.name}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Page indicator for active page */}
          {currentPageId === page.id && (
            <div style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '6px',
              height: '60px',
              background: '#48aff0',
              borderRadius: '3px',
              boxShadow: '0 0 8px rgba(72, 175, 240, 0.5)'
            }} />
          )}
        </div>
      ))}

        {/* Scroll instructions at the bottom */}
        <div style={{
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          marginTop: '40px',
          padding: '20px'
        }}>
          Scroll to navigate between pages • Click a page to edit
        </div>
      </div>
    </div>
  );
});

export default ScrollableMultiPageCanvas;