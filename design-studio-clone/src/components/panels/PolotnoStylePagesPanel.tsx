import React, { useState, useCallback } from 'react';
import { usePageStore } from '@/stores/pageStore';
import { usePageThumbnails } from '@/hooks/usePageThumbnails';
import { FaPlus, FaCopy, FaTrash } from '@meronex/icons/fa';

/**
 * PolotnoStylePagesPanel - Simple pages management interface
 * Shows when "Pages" tool is selected from left toolbar
 * Matches Polotno Studio's page management behavior
 */
export const PolotnoStylePagesPanel: React.FC = () => {
  const {
    pages,
    currentPageId,
    addPage,
    setCurrentPageId,
    removePage,
  } = usePageStore();

  const [hoveredPage, setHoveredPage] = useState<string | null>(null);

  // Handle page selection
  const handlePageSelect = useCallback((pageId: string) => {
    setCurrentPageId(pageId);
  }, [setCurrentPageId]);

  // Handle adding new page
  const handlePageAdd = useCallback(() => {
    const newPage = {
      name: `Page ${pages.length + 1}`,
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      elements: [],
      order: pages.length
    };
    addPage(newPage);
  }, [pages.length, addPage]);

  // Handle page duplication
  const handlePageDuplicate = useCallback((pageId: string) => {
    const pageToClone = pages.find(p => p.id === pageId);
    if (pageToClone) {
      const duplicatedPage = {
        name: `${pageToClone.name} Copy`,
        width: pageToClone.width || 800,
        height: pageToClone.height || 600,
        backgroundColor: pageToClone.backgroundColor,
        elements: [...pageToClone.elements], // Clone elements array
        order: pages.length
      };
      addPage(duplicatedPage);
    }
  }, [pages, addPage]);

  // Handle page deletion
  const handlePageDelete = useCallback((pageId: string) => {
    if (pages.length > 1) { // Don't allow deleting the last page
      removePage(pageId);
    }
  }, [pages.length, removePage]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: '#f5f8fa',
      padding: '16px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '16px'
      }}>
        <h3 style={{
          color: '#f5f8fa',
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Pages
        </h3>
        <p style={{
          color: '#8a9ba8',
          margin: 0,
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          Manage your design pages
        </p>
      </div>

      {/* Pages Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {pages.map((page) => (
            <div
              key={page.id}
              onClick={() => handlePageSelect(page.id)}
              onMouseEnter={() => setHoveredPage(page.id)}
              onMouseLeave={() => setHoveredPage(null)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: hoveredPage === page.id ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: '8px',
                background: page.backgroundColor || '#ffffff',
                border: `2px solid ${currentPageId === page.id ? '#48aff0' : '#495563'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '8px',
                boxShadow: hoveredPage === page.id ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
              }}>
                {page.thumbnail ? (
                  <img
                    src={page.thumbnail}
                    alt={page.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '6px',
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#888',
                    background: '#f8f9fa'
                  }}>
                    {page.order + 1}
                  </div>
                )}

                {/* Action buttons on hover */}
                {hoveredPage === page.id && (
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePageDuplicate(page.id);
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Duplicate page"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(72, 175, 240, 0.9)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                      }}
                    >
                      <FaCopy />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePageDelete(page.id);
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          background: 'rgba(220, 53, 69, 0.9)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Delete page"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(220, 53, 69, 1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(220, 53, 69, 0.9)';
                        }}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                )}

                {/* Active page indicator */}
                {currentPageId === page.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '6px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#48aff0',
                    boxShadow: '0 0 4px rgba(72, 175, 240, 0.6)'
                  }} />
                )}
              </div>

              {/* Page Name */}
              <div style={{
                fontSize: '12px',
                color: currentPageId === page.id ? '#48aff0' : '#a7b6c2',
                textAlign: 'center',
                fontWeight: currentPageId === page.id ? '600' : '400',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '0 4px'
              }}>
                {page.name}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Page Button */}
        <button
          onClick={handlePageAdd}
          style={{
            width: '100%',
            padding: '16px',
            border: '2px dashed #495563',
            borderRadius: '8px',
            background: 'transparent',
            color: '#8a9ba8',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            minHeight: '80px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#48aff0';
            e.currentTarget.style.color = '#48aff0';
            e.currentTarget.style.background = 'rgba(72, 175, 240, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#495563';
            e.currentTarget.style.color = '#8a9ba8';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <FaPlus size={20} />
          Add New Page
        </button>
      </div>
    </div>
  );
};