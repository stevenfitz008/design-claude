import React, { useState, useEffect } from 'react';
import { observer } from "mobx-react-lite";
import { Spinner } from '@blueprintjs/core';

// Text template types
export interface TextTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    letterSpacing: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration?: string;
  };
}

// Pre-designed text templates
const TEXT_TEMPLATES: TextTemplate[] = [
  {
    id: 'header-1',
    name: 'Create header',
    category: 'Headers',
    preview: 'Header Text',
    style: {
      fontSize: 48,
      fontFamily: 'Montserrat',
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: -0.5,
      textTransform: 'none'
    }
  },
  {
    id: 'subheader-1',
    name: 'Create sub header',
    category: 'Headers',
    preview: 'Subheader Text',
    style: {
      fontSize: 32,
      fontFamily: 'Montserrat',
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.3,
      letterSpacing: -0.3,
      textTransform: 'none'
    }
  },
  {
    id: 'body-1',
    name: 'Create body text',
    category: 'Body',
    preview: 'Body text goes here',
    style: {
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none'
    }
  },
  {
    id: 'adventure-1',
    name: 'Adventure',
    category: 'Stylized',
    preview: 'ADVENTURE',
    style: {
      fontSize: 36,
      fontFamily: 'Oswald',
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.1,
      letterSpacing: 2,
      textTransform: 'uppercase'
    }
  },
  {
    id: 'congratulations-1',
    name: 'Congratulations',
    category: 'Stylized',
    preview: 'Congratulations!',
    style: {
      fontSize: 28,
      fontFamily: 'Dancing Script',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 0,
      textTransform: 'none'
    }
  },
  {
    id: 'elegant-1',
    name: 'Elegant',
    category: 'Stylized',
    preview: 'Elegant',
    style: {
      fontSize: 32,
      fontFamily: 'Playfair Display',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 1,
      textTransform: 'none'
    }
  },
  {
    id: 'quote-1',
    name: 'Quote text',
    category: 'Quotes',
    preview: '"Inspiring quote"',
    style: {
      fontSize: 24,
      fontFamily: 'Georgia',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none'
    }
  },
  {
    id: 'modern-1',
    name: 'Modern',
    category: 'Modern',
    preview: 'MODERN',
    style: {
      fontSize: 40,
      fontFamily: 'Roboto',
      fontWeight: '900',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.0,
      letterSpacing: 3,
      textTransform: 'uppercase'
    }
  }
];

// Generate more templates for infinite scroll
const generateMoreTemplates = async (page: number, existingTemplates: TextTemplate[]): Promise<TextTemplate[]> => {
  // Simulate loading delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return TEXT_TEMPLATES.map((template, index) => ({
    ...template,
    id: `${template.id}_page${page}_${index}`,
    name: `${template.name} (${page})`,
    style: {
      ...template.style,
      color: page % 2 === 0 ? '#ffffff' : '#48aff0' // Alternate colors for variety
    }
  }));
};

const fetchTextTemplates = async (endpoint: string, isLoadMore = false, page = 1): Promise<{templates: TextTemplate[], hasMore: boolean}> => {
  try {
    console.log('📝 fetchTextTemplates called:', { endpoint, isLoadMore, page });
    
    // For endless scroll testing with generated templates
    if (isLoadMore) {
      const additionalTemplates = await generateMoreTemplates(page, TEXT_TEMPLATES);
      return {
        templates: additionalTemplates,
        hasMore: true
      };
    }
    
    return {
      templates: TEXT_TEMPLATES,
      hasMore: true
    };
  } catch (error) {
    console.error('Failed to fetch text templates:', error);
    return {
      templates: TEXT_TEMPLATES,
      hasMore: true
    };
  }
};

const searchTextTemplates = async (query: string, page = 1): Promise<{templates: TextTemplate[], hasMore: boolean}> => {
  if (!query.trim()) return {templates: [], hasMore: false};
  
  try {
    console.log('🔍 searchTextTemplates called:', { query, page });
    
    // Filter templates based on query
    const filteredTemplates = TEXT_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(query.toLowerCase()) ||
      template.category.toLowerCase().includes(query.toLowerCase()) ||
      template.preview.toLowerCase().includes(query.toLowerCase())
    );
    
    // For pagination, slice the results
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
      templates: TEXT_TEMPLATES.slice(0, 12),
      hasMore: false
    };
  }
};

const getTrendingTextTemplates = async (page = 1): Promise<{templates: TextTemplate[], hasMore: boolean}> => {
  return fetchTextTemplates(`/text-templates/trending?per_page=12&page=${page}`, page > 1, page);
};

interface TextPanelProps {
  onTemplateSelect?: (template: TextTemplate) => void;
}

// we need observer to update component automatically on any store changes
export const TextPanel: React.FC<TextPanelProps> = observer(({ onTemplateSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<TextTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
          setTemplates(results.length > 0 ? results : TEXT_TEMPLATES);
        }
        setHasMore(moreResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search text templates');
        if (!isLoadMore) {
          setTemplates(TEXT_TEMPLATES);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    } else {
      // Show all templates when no search query
      setTemplates(TEXT_TEMPLATES);
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
        setTemplates(results.length > 0 ? results : TEXT_TEMPLATES);
        setPage(1);
      }
      setHasMore(more);
    } catch (err) {
      console.error('Load trending error:', err);
      if (!isLoadMore) {
        setTemplates(TEXT_TEMPLATES);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load all templates by default on component mount
  useEffect(() => {
    console.log('🚀 TextPanel mounted, loading all templates by default...');
    setTemplates(TEXT_TEMPLATES);
    setLoading(false);
    setHasMore(false); // No need for infinite scroll since we load all
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      const sentinel = document.querySelector('#text-scroll-sentinel');

      if (sentinel) {
        observer = new IntersectionObserver(
          (entries) => {
            const target = entries[0];

            if (target.isIntersecting && !loadingMore && !loading && hasMore) {
              console.log('🚀 Text infinite scroll triggered, hasMore:', hasMore);
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
        console.log('📍 Observing text sentinel');
        observer.observe(sentinel);
      } else {
        console.log('❌ Missing text sentinel element');
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
    console.log('Text template selected:', template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleDragStart = (e: React.DragEvent, template: TextTemplate) => {
    console.log('🚀 Drag start for text template:', template.id);
    const dragData = {
      type: 'text',
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
    console.log('📦 Text drag data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    // Also set text data as fallback
    e.dataTransfer.setData('text/plain', template.preview);
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: '#2f343c',
      color: '#f5f8fa',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Search Bar */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #495563'
      }}>
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
            📝
          </div>
          <input
            type="text"
            placeholder="Search text templates..."
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
              <Spinner size={16} />
            </div>
          )}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#8a9ba8',
          textAlign: 'center',
          marginTop: '8px'
        }}>
          Text templates by <span style={{ color: '#48aff0', fontWeight: '500' }}>Design Studio</span>
        </div>
      </div>
      

      {/* Text Templates Grid */}
      <div 
        id="text-scroll-container"
        style={{
          position: 'absolute',
          top: '76px', // Account for search bar only
          bottom: '0px',
          left: '0px',
          right: '0px',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          boxSizing: 'border-box',
          // Enhanced scroll styling
          WebkitScrollbar: {
            width: '6px'
          }
        }}
        // Add CSS for webkit scrollbar
        onMouseOver={(e) => {
          const style = document.createElement('style');
          style.textContent = `
            #text-scroll-container::-webkit-scrollbar {
              width: 6px;
            }
            #text-scroll-container::-webkit-scrollbar-track {
              background: rgba(47, 52, 60, 0.3);
              border-radius: 3px;
            }
            #text-scroll-container::-webkit-scrollbar-thumb {
              background: #495563;
              border-radius: 3px;
              transition: background-color 0.2s ease;
            }
            #text-scroll-container::-webkit-scrollbar-thumb:hover {
              background: #48aff0;
            }
          `;
          if (!document.head.querySelector('#text-scroll-styles')) {
            style.id = 'text-scroll-styles';
            document.head.appendChild(style);
          }
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
                fontSize: Math.min(template.style.fontSize, 24), // Scale down for preview
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
                {template.name}
              </div>
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
});

TextPanel.displayName = 'TextPanel';