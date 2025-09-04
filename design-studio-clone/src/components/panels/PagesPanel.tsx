import React, { useEffect, useState, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { 
  FaPlus, 
  FaSearch, 
  FaFile, 
  FaGripVertical, 
  FaEdit, 
  FaTrash, 
  FaCopy, 
  FaEye, 
  FaEyeSlash,
  FaSort,
  FaFilter,
  FaColumns,
  FaExpand,
  FaCubes,
  FaChartBar,
  FaLayerGroup
} from '@meronex/icons/fa';
import { pagesService, type ReportPage, type CreatePageRequest, type PageListResponse } from '../../services/pagesService';
import { useReportsStore } from '../../stores/reportsStore';

interface PagesPanelProps {
  className?: string;
  reportId?: string; // Current report context
  onPageSelect?: (page: ReportPage) => void;
  onPageOpen?: (page: ReportPage) => void;
}

const PanelContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    height: '100%',
    width: '100%',
    backgroundColor: '#2f343c',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
    {children}
  </div>
);

const PanelHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    padding: '16px',
    borderBottom: '1px solid #495563',
    backgroundColor: '#252a30',
    flexShrink: 0
  }}>
    {children}
  </div>
);

const PanelContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    flex: 1,
    overflow: 'auto',
    minHeight: 0
  }}>
    {children}
  </div>
);

const PageItem: React.FC<{
  page: ReportPage;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isSelected?: boolean;
}> = ({ page, onSelect, onEdit, onDelete, onDuplicate, isSelected = false }) => (
  <div
    onClick={onSelect}
    style={{
      padding: '12px',
      margin: '4px 8px',
      backgroundColor: isSelected ? 'rgba(72, 175, 240, 0.1)' : '#252a30',
      border: `1px solid ${isSelected ? '#48aff0' : '#495563'}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}
    onMouseEnter={(e) => {
      if (!isSelected) {
        e.currentTarget.style.backgroundColor = '#1a1d23';
        e.currentTarget.style.borderColor = '#5a6c7d';
      }
    }}
    onMouseLeave={(e) => {
      if (!isSelected) {
        e.currentTarget.style.backgroundColor = '#252a30';
        e.currentTarget.style.borderColor = '#495563';
      }
    }}
  >
    {/* Drag handle */}
    <FaGripVertical size={12} color="#8a9ba8" style={{ cursor: 'grab' }} />
    
    {/* Page icon */}
    <div style={{
      width: '32px',
      height: '40px',
      backgroundColor: '#495563',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <FaFile size={16} color="#8a9ba8" />
    </div>
    
    {/* Page info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '4px'
      }}>
        <span style={{
          fontSize: '12px',
          color: '#8a9ba8',
          background: '#495563',
          padding: '1px 6px',
          borderRadius: '2px',
          fontWeight: '500'
        }}>
          {page.order}
        </span>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#f5f8fa',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {page.title}
        </h4>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#8a9ba8'
      }}>
        <span>{page.width}×{page.height}px</span>
        <span>•</span>
        <span>{page.layoutType}</span>
        {page.componentCount !== undefined && (
          <>
            <span>•</span>
            <span>{page.componentCount} components</span>
          </>
        )}
      </div>
    </div>
    
    {/* Action buttons */}
    <div style={{
      display: 'flex',
      gap: '2px',
      opacity: 0.7
    }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          padding: '4px',
          backgroundColor: 'transparent',
          color: '#a7b6c2',
          border: 'none',
          borderRadius: '2px',
          cursor: 'pointer'
        }}
        title="Edit page"
      >
        <FaEdit size={10} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        style={{
          padding: '4px',
          backgroundColor: 'transparent',
          color: '#a7b6c2',
          border: 'none',
          borderRadius: '2px',
          cursor: 'pointer'
        }}
        title="Duplicate page"
      >
        <FaCopy size={10} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          padding: '4px',
          backgroundColor: 'transparent',
          color: '#dc3545',
          border: 'none',
          borderRadius: '2px',
          cursor: 'pointer'
        }}
        title="Delete page"
      >
        <FaTrash size={10} />
      </button>
    </div>
  </div>
);

export const PagesPanel: React.FC<PagesPanelProps> = observer(({ className, reportId }) => {
  const [pages, setPages] = useState<ReportPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'updatedAt'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLayoutType, setSelectedLayoutType] = useState<string>('');
  const [pageStats, setPageStats] = useState<{ totalPages: number; byLayout: Record<string, number> }>({ totalPages: 0, byLayout: {} });
  
  const reportsStore = useReportsStore();
  const currentReport = reportId ? reportsStore.reports.find(r => r.id === reportId) : reportsStore.currentReport;

  // Load pages when reportId changes
  useEffect(() => {
    const loadPages = async () => {
      if (!reportId) {
        setPages([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await pagesService.getReportPages(reportId, {
          sortBy,
          sortOrder,
          search: searchQuery || undefined,
          layoutType: selectedLayoutType || undefined
        });
        
        setPages(response.pages);
        setPageStats({
          totalPages: response.total,
          byLayout: response.pages.reduce((acc, page) => {
            acc[page.layoutType] = (acc[page.layoutType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });
      } catch (err) {
        console.error('Failed to load pages:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pages');
        setPages([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPages();
  }, [reportId, sortBy, sortOrder, searchQuery, selectedLayoutType]);

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPage = useCallback((page: ReportPage) => {
    setSelectedPageId(page.id);
    onPageSelect?.(page);
    console.log('Selected page:', page);
  }, [onPageSelect]);

  const handleEditPage = useCallback((page: ReportPage) => {
    console.log('Editing page:', page);
  }, []);

  const handleDeletePage = useCallback((page: ReportPage) => {
    setPageToDelete(page.id);
    setShowDeleteDialog(true);
  }, []);
  
  const confirmDeletePage = useCallback(async () => {
    if (!pageToDelete) return;
    
    try {
      await pagesService.deletePage(pageToDelete);
      setPages(prev => prev.filter(page => page.id !== pageToDelete));
      if (selectedPageId === pageToDelete) {
        setSelectedPageId(null);
      }
      setShowDeleteDialog(false);
      setPageToDelete(null);
    } catch (err) {
      console.error('Failed to delete page:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete page');
    }
  }, [pageToDelete, selectedPageId]);

  const handleDuplicatePage = useCallback(async (page: ReportPage) => {
    try {
      const duplicatedPage = await pagesService.duplicatePage(page.id, `${page.title} (Copy)`);
      setPages(prev => [...prev, duplicatedPage].sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error('Failed to duplicate page:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate page');
    }
  }, []);

  const handleAddPage = useCallback(() => {
    setShowCreateDialog(true);
  }, []);
  
  const handleCreatePage = useCallback(async (data: CreatePageRequest) => {
    if (!reportId) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const newPage = await pagesService.createPage({
        ...data,
        reportId
      });
      
      setPages(prev => [...prev, newPage].sort((a, b) => a.order - b.order));
      setShowCreateDialog(false);
      setSelectedPageId(newPage.id);
      onPageSelect?.(newPage);
    } catch (err) {
      console.error('Failed to create page:', err);
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setIsCreating(false);
    }
  }, [reportId, onPageSelect]);
  
  const handleOpenPage = useCallback((page: ReportPage) => {
    onPageOpen?.(page);
  }, [onPageOpen]);

  return (
    <PanelContainer>
      <PanelHeader>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#f5f8fa'
          }}>
            Pages
          </h3>
          <button
            onClick={handleAddPage}
            style={{
              padding: '8px',
              backgroundColor: '#48aff0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
          >
            <FaPlus size={12} />
            Add Page
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: '#495563',
              border: '1px solid #5a6c7d',
              borderRadius: '4px',
              color: '#f5f8fa',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <FaSearch
            size={14}
            color="#8a9ba8"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Report context indicator */}
        {reportId && (
          <div style={{
            fontSize: '12px',
            color: '#8a9ba8',
            marginBottom: '8px'
          }}>
            Report: <span style={{ color: '#48aff0' }}>{reportId}</span>
          </div>
        )}

        {/* Pages count */}
        <div style={{
          fontSize: '12px',
          color: '#8a9ba8'
        }}>
          {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''}
        </div>
      </PanelHeader>

      <PanelContent>
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#8a9ba8'
          }}>
            Loading pages...
          </div>
        ) : filteredPages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#8a9ba8',
            textAlign: 'center',
            padding: '32px'
          }}>
            <FaFile size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', color: '#bfccd6' }}>
              {searchQuery ? 'No matching pages' : 'No pages found'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
              {searchQuery 
                ? `No pages match "${searchQuery}"`
                : 'Add your first page to start building your report structure.'
              }
            </p>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {filteredPages.map((page) => (
              <PageItem
                key={page.id}
                page={page}
                isSelected={selectedPageId === page.id}
                onSelect={() => handleSelectPage(page.id)}
                onEdit={() => handleEditPage(page)}
                onDelete={() => handleDeletePage(page)}
                onDuplicate={() => handleDuplicatePage(page)}
              />
            ))}
          </div>
        )}
      </PanelContent>
    </PanelContainer>
  );
});

export type { PagesPanelProps };