// PlotlyTextPanel - Adapted from Design Studio's TextPanel
// Original: /design-studio-clone/src/components/panels/TextPanel.tsx  
// Adapted for: Plotly.js with identical template system and UX patterns

import React, { useState, useEffect } from 'react';
import { PlotlyRichTextEditor } from '../text-editor/PlotlyRichTextEditor';
import type { TextTemplate } from '../../types/textTemplates';
import type { PlotlyTextElement } from '../../types/plotlyText';
import { DEFAULT_TEXT_TEMPLATES } from '../../types/textTemplates';

// Template search and management functions (same as Design Studio)
const generateMoreTemplates = async (page: number, existingTemplates: TextTemplate[]): Promise<TextTemplate[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return DEFAULT_TEXT_TEMPLATES.map((template, index) => ({
    ...template,
    id: `${template.id}_page${page}_${index}`,
    name: `${template.name} (${page})`,
    style: {
      ...template.style,
      color: page % 2 === 0 ? '#ffffff' : '#48aff0'
    }
  }));
};

const fetchTextTemplates = async (endpoint: string, isLoadMore = false, page = 1): Promise<{templates: TextTemplate[], hasMore: boolean}> => {
  try {
    console.log('📝 fetchTextTemplates called:', { endpoint, isLoadMore, page });
    
    if (isLoadMore) {
      const additionalTemplates = await generateMoreTemplates(page, DEFAULT_TEXT_TEMPLATES);
      return {
        templates: additionalTemplates,
        hasMore: true
      };
    }
    
    return {
      templates: DEFAULT_TEXT_TEMPLATES,
      hasMore: true
    };
  } catch (error) {
    console.error('Failed to fetch text templates:', error);
    return {
      templates: DEFAULT_TEXT_TEMPLATES,
      hasMore: true
    };
  }
};

const searchTextTemplates = async (query: string, page = 1): Promise<{templates: TextTemplate[], hasMore: boolean}> => {
  if (!query.trim()) return {templates: [], hasMore: false};
  
  try {
    console.log('🔍 searchTextTemplates called:', { query, page });
    
    const filteredTemplates = DEFAULT_TEXT_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(query.toLowerCase()) ||
      template.category.toLowerCase().includes(query.toLowerCase()) ||
      template.preview.toLowerCase().includes(query.toLowerCase())
    );
    
    const startIndex = (page - 1) * 12;
    const endIndex = startIndex + 12;
    const pageTemplates = filteredTemplates.slice(startIndex, endIndex);
    
    return {
      templates: pageTemplates,
      hasMore: endIndex < filteredTemplates.length
    };
  } catch (error) {
    console.error('Failed to search text templates:', error);
    return {
      templates: DEFAULT_TEXT_TEMPLATES.slice(0, 12),
      hasMore: false
    };
  }
};

const getTrendingTextTemplates = async (page = 1): Promise<{templates: TextTemplate[], hasMore: boolean}> => {
  return fetchTextTemplates(`/plotly-text-templates/trending?per_page=12&page=${page}`, page > 1, page);
};

interface PlotlyTextPanelProps {
  onTemplateSelect?: (template: TextTemplate) => void;
  onRichTextUpdate?: (html: string, imageData?: string) => void;
  selectedTextElement?: PlotlyTextElement | null;
  onAddTextElement?: (element: Partial<PlotlyTextElement>) => void;
}

export const PlotlyTextPanel: React.FC<PlotlyTextPanelProps> = ({ 
  onTemplateSelect,
  onRichTextUpdate,
  selectedTextElement,
  onAddTextElement
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showRichEditor, setShowRichEditor] = useState(false);
  
  const isTextSelected = selectedTextElement?.type === 'text' || selectedTextElement?.type === 'rich-text';

  const handleSearch = async (query: string, isLoadMore = false) => {
    if (!isLoadMore) {
      setSearchQuery(query);
      setPage(1);
    }

    if (query.trim()) {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const currentPage = isLoadMore ? page + 1 : 1;
        const { templates: results, hasMore: moreResults } = await searchTextTemplates(query, currentPage);

        if (isLoadMore) {
          setTemplates(prev => {
            const existingIds = new Set(prev.map(template => template.id));
            const newTemplates = results.filter(template => !existingIds.has(template.id));
            return [...prev, ...newTemplates];
          });
          setPage(currentPage);
        } else {
          setTemplates(results.length > 0 ? results : DEFAULT_TEXT_TEMPLATES);
        }
        setHasMore(moreResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search text templates');
        if (!isLoadMore) {
          setTemplates(DEFAULT_TEXT_TEMPLATES);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    } else {
      setTemplates(DEFAULT_TEXT_TEMPLATES);
      setLoading(false);
      setHasMore(false);
    }
  };

  const loadTrendingTemplates = async (isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;

    console.log('📝 loadTrendingTemplates called:', { isLoadMore, currentPage: isLoadMore ? page + 1 : 1 });
    
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      console.log('🔄 Calling getTrendingTextTemplates with page:', currentPage);
      const { templates: results, hasMore: more } = await getTrendingTextTemplates(currentPage);
      console.log('✅ getTrendingTextTemplates result:', { resultsCount: results.length, hasMore: more });
      
      if (isLoadMore) {
        setTemplates(prev => {
          const existingIds = new Set(prev.map(template => template.id));
          const newTemplates = results.filter(template => !existingIds.has(template.id));
          return [...prev, ...newTemplates];
        });
        setPage(currentPage);
      } else {
        setTemplates(results.length > 0 ? results : DEFAULT_TEXT_TEMPLATES);
        setPage(1);
      }
      setHasMore(more);
    } catch (err) {
      console.error('Load trending error:', err);
      if (!isLoadMore) {
        setTemplates(DEFAULT_TEXT_TEMPLATES);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load all templates by default on component mount
  useEffect(() => {
    console.log('🚀 PlotlyTextPanel mounted, loading all templates by default...');
    setTemplates(DEFAULT_TEXT_TEMPLATES);
    setLoading(false);
    setHasMore(false);
  }, []);

  // Infinite scroll observer (same as Design Studio)
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      const sentinel = document.querySelector('#plotly-text-scroll-sentinel');

      if (sentinel) {
        observer = new IntersectionObserver(
          (entries) => {
            const target = entries[0];

            if (target.isIntersecting && !loadingMore && !loading && hasMore) {
              console.log('🚀 Plotly text infinite scroll triggered, hasMore:', hasMore);
              if (searchQuery.trim()) {
                handleSearch(searchQuery, true);
              } else {
                loadTrendingTemplates(true);
              }
            }
          },
          {
            threshold: 0.1,
            rootMargin: '100px'
          }
        );
        console.log('📍 Observing plotly text sentinel');
        observer.observe(sentinel);
      } else {
        console.log('❌ Missing plotly text sentinel element');
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [searchQuery, hasMore, loadingMore, loading, page, templates.length]);

  const handleTemplateClick = (template: TextTemplate) => {
    console.log('Plotly text template selected:', template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleDragStart = (e: React.DragEvent, template: TextTemplate) => {
    console.log('🚀 Drag start for Plotly text template:', template.id);
    const dragData = {
      type: 'plotly-text',
      text: template.preview,
      fontSize: template.style.fontSize,
      fontFamily: template.style.fontFamily,
      fontWeight: template.style.fontWeight,
      color: template.style.color,
      textAlign: template.style.textAlign,
      lineHeight: template.style.lineHeight,
      letterSpacing: template.style.letterSpacing,
      textTransform: template.style.textTransform || 'none',
      textDecoration: template.style.textDecoration || 'none'
    };
    console.log('📦 Plotly text drag data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', template.preview);
  };

  const handleRichTextUpdate = (html: string, imageData?: string) => {
    console.log('Plotly rich text updated:', { html, hasImageData: !!imageData });
    
    if (onRichTextUpdate) {
      onRichTextUpdate(html, imageData);
    }
    
    if (!selectedTextElement) {
      // Create new rich text element for Plotly if none selected
      const newTextElement = {
        type: 'rich-text' as const,
        x: 0.5, // Center in paper coordinates
        y: 0.5,
        xref: 'paper',
        yref: 'paper',
        text: html,
        html: html,
        font: {
          family: 'Arial',
          size: 16,
          color: '#ffffff'
        },
        xanchor: 'center' as const,
        yanchor: 'middle' as const,
        align: 'left' as const,
        opacity: 1,
        visible: true,
        editable: true,
        selected: false,
        locked: false,
        richText: true,
        imageData,
        zIndex: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      if (onAddTextElement) {
        onAddTextElement(newTextElement);
      }
      console.log('Created new Plotly rich text element:', newTextElement);
    }
  };

  const handleCreateRichText = () => {
    setShowRichEditor(true);
  };

  const handleCloseRichEditor = () => {
    setShowRichEditor(false);
  };

  // Auto-show rich editor when text is selected
  React.useEffect(() => {
    if (isTextSelected && selectedTextElement) {
      setShowRichEditor(true);
    }
  }, [isTextSelected, selectedTextElement]);

  return (
    <div 
      data-testid="plotly-text-panel"
      style={{
        height: '100%',
        width: '100%',
        background: '#2f343c',
        color: '#f5f8fa',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {/* Header - Same as Design Studio */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #495563'
      }}>
        {/* Rich Text Editor Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <button
            onClick={handleCreateRichText}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: showRichEditor ? '#48aff0' : 'transparent',
              color: showRichEditor ? 'white' : '#f5f8fa',
              border: `1px solid ${showRichEditor ? '#48aff0' : '#495563'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!showRichEditor) {
                e.currentTarget.style.background = '#3a3f47';
                e.currentTarget.style.borderColor = '#48aff0';
              }
            }}
            onMouseLeave={(e) => {
              if (!showRichEditor) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#495563';
              }
            }}
          >
            ✨ Plotly Rich Text Editor
          </button>
          {isTextSelected && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(72, 175, 240, 0.1)',
              border: '1px solid rgba(72, 175, 240, 0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#48aff0',
              fontWeight: '500'
            }}>
              Plotly Text Selected
            </div>
          )}
        </div>

        {/* Search Bar - Same styling as Design Studio */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ 
            color: '#8a9ba8',
            fontSize: '16px',
            flexShrink: 0,
            paddingLeft: '2px'
          }}>
            📈
          </div>
          <input
            type="text"
            placeholder="Search Plotly text templates..."
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              handleSearch(value);
            }}
            style={{
              flex: 1,
              minHeight: '36px',
              backgroundColor: 'rgba(16, 22, 26, 0.3)',
              border: '1px solid #495563',
              borderRadius: '3px',
              padding: '8px 12px',
              color: '#f5f8fa',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#48aff0';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#495563';
            }}
          />
          {loading && (
            <div style={{ flexShrink: 0, paddingRight: '4px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid #495563',
                borderTop: '2px solid #48aff0',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          )}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#8a9ba8',
          textAlign: 'center',
          marginTop: '8px'
        }}>
          Plotly text templates by <span style={{ color: '#48aff0', fontWeight: '500' }}>Design Studio</span>
        </div>
      </div>
      
      {/* Rich Text Editor */}
      {showRichEditor && (
        <div style={{ padding: '0 16px' }}>
          <PlotlyRichTextEditor
            textElement={isTextSelected ? selectedTextElement : undefined}
            onTextUpdate={handleRichTextUpdate}
            onClose={handleCloseRichEditor}
            initialContent={isTextSelected ? selectedTextElement?.html || selectedTextElement?.text : undefined}
          />
        </div>
      )}

      {/* Text Templates Grid - Same styling as Design Studio */}
      <div 
        id="plotly-text-scroll-container"
        style={{
          position: 'absolute',
          top: showRichEditor ? '50%' : '108px',
          bottom: '0px',
          left: '0px',
          right: '0px',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {templates.map((template, index) => (
            <div
              key={template.id}
              draggable={true}
              onClick={() => handleTemplateClick(template)}
              onDragStart={(e) => handleDragStart(e, template)}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'grab',
                background: '#1c2127',
                border: '1px solid #495563',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '120px',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#48aff0';
                e.currentTarget.style.background = '#262b33';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#495563';
                e.currentTarget.style.background = '#1c2127';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Template preview */}
              <div style={{
                ...template.style,
                fontSize: Math.min(template.style.fontSize, 24),
                color: template.style.color,
                fontFamily: template.style.fontFamily,
                fontWeight: template.style.fontWeight,
                textAlign: template.style.textAlign,
                lineHeight: template.style.lineHeight,
                letterSpacing: template.style.letterSpacing,
                textTransform: template.style.textTransform,
                textDecoration: template.style.textDecoration,
                marginBottom: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {template.preview}
              </div>

              {/* Template name */}
              <div style={{
                fontSize: '12px',
                color: '#8a9ba8',
                fontWeight: '500',
                marginTop: '4px'
              }}>
                {template.name} (Plotly)
              </div>
            </div>
          ))}
          
          {/* Infinite scroll sentinel */}
          <div id="plotly-text-scroll-sentinel" style={{ height: '1px' }} />
        </div>
      </div>

      {/* CSS Animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};