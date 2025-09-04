import React, { useEffect, useState, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { 
  FaChevronRight, 
  FaChevronDown, 
  FaFolder, 
  FaFile, 
  FaCubes, 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaCopy,
  FaArrowLeft,
  FaArrowUp,
  FaBreadcrumb,
  FaHome,
  FaEye,
  FaEyeSlash
} from '@meronex/icons/fa';
import { useReportsStore } from '../../stores/reportsStore';
import { pagesService, type ReportPage } from '../../services/pagesService';
import { componentsService, type Component } from '../../services/componentsService';
import type { Report } from '../../services/reportsService';

interface HierarchicalPanelProps {
  className?: string;
}

type ViewMode = 'reports' | 'pages' | 'components';
type BreadcrumbItem = {
  id: string;
  name: string;
  type: 'report' | 'page';
  icon: React.ElementType;
};

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

const Breadcrumb: React.FC<{
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}> = ({ items, onNavigate }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: '#495563',
    borderRadius: '4px',
    fontSize: '14px'
  }}>
    <button
      onClick={() => onNavigate(-1)}
      style={{
        padding: '4px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#48aff0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
      }}
      title="Go to Reports"
    >
      <FaHome size={14} />
    </button>
    
    {items.map((item, index) => (
      <React.Fragment key={item.id}>
        <FaChevronRight size={10} color="#8a9ba8" />
        <button
          onClick={() => onNavigate(index)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 6px',
            backgroundColor: index === items.length - 1 ? 'rgba(72, 175, 240, 0.1)' : 'transparent',
            border: index === items.length - 1 ? '1px solid rgba(72, 175, 240, 0.3)' : 'none',
            borderRadius: '3px',
            color: index === items.length - 1 ? '#48aff0' : '#f5f8fa',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <item.icon size={12} />
          <span>{item.name}</span>
        </button>
      </React.Fragment>
    ))}
  </div>
);

const TreeNode: React.FC<{
  item: Report | ReportPage | Component;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  children?: React.ReactNode;
}> = ({ 
  item, 
  level, 
  isExpanded, 
  onToggle, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  children 
}) => {
  const getIcon = () => {
    if ('reportId' in item) return FaFile; // Page
    if ('usageCount' in item) return FaCubes; // Component
    return FaFolder; // Report
  };

  const getItemName = () => {
    if ('title' in item) return item.title;
    if ('name' in item) return item.name;
    return 'Unknown';
  };

  const getItemDetails = () => {
    if ('pageCount' in item) return `${item.pageCount || 0} pages`;
    if ('componentCount' in item) return `${item.componentCount || 0} components`;
    if ('usageCount' in item) return `${item.usageCount} uses`;
    return '';
  };

  const Icon = getIcon();
  const hasChildren = children !== undefined;
  
  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div
        style={{
          padding: '8px 12px',
          margin: '2px 4px',
          backgroundColor: '#252a30',
          border: '1px solid #495563',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1a1d23';
          e.currentTarget.style.borderColor = '#5a6c7d';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#252a30';
          e.currentTarget.style.borderColor = '#495563';
        }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              padding: '2px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#8a9ba8',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
          </button>
        )}
        
        {/* Icon */}
        <Icon size={16} color="#48aff0" />
        
        {/* Content */}
        <div 
          style={{ flex: 1, minWidth: 0 }}
          onClick={onSelect}
        >
          <div style={{
            fontWeight: '600',
            color: '#f5f8fa',
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {getItemName()}
          </div>
          {getItemDetails() && (
            <div style={{
              fontSize: '11px',
              color: '#8a9ba8',
              marginTop: '2px'
            }}>
              {getItemDetails()}
            </div>
          )}
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
            title="Edit"
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
            title="Duplicate"
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
            title="Delete"
          >
            <FaTrash size={10} />
          </button>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && children}
    </div>
  );
};

export const HierarchicalPanel: React.FC<HierarchicalPanelProps> = observer(({ className }) => {
  const reportsStore = useReportsStore();
  const [viewMode, setViewMode] = useState<ViewMode>('reports');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  
  // Local state for pages and components
  const [pages, setPages] = useState<ReportPage[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial reports
  useEffect(() => {
    reportsStore.fetchReports();
  }, []);

  // Load pages when a report is selected
  useEffect(() => {
    if (selectedReportId && viewMode === 'pages') {
      setIsLoadingPages(true);
      pagesService.getReportPages(selectedReportId)
        .then(response => {
          setPages(response.pages);
          setIsLoadingPages(false);
        })
        .catch(error => {
          console.error('Failed to load pages:', error);
          setIsLoadingPages(false);
          setPages([]);
        });
    }
  }, [selectedReportId, viewMode]);

  // Load components when in components view
  useEffect(() => {
    if (viewMode === 'components') {
      setIsLoadingComponents(true);
      // Note: This would need to be implemented in the componentsService
      // For now, using mock data
      setTimeout(() => {
        setComponents([
          {
            id: '1',
            name: 'Title Block',
            description: 'Standard title with subtitle formatting',
            type: 'text',
            category: 'typography',
            definitionId: 'def-1',
            defaultProps: { title: 'Title Here' },
            supportedFormats: ['html', 'pdf'],
            version: 1,
            isPublished: true,
            tags: ['title', 'header'],
            isSystem: true,
            usageCount: 156,
            createdBy: 'system',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ]);
        setIsLoadingComponents(false);
      }, 500);
    }
  }, [viewMode]);

  const handleReportSelect = useCallback((report: Report) => {
    setSelectedReportId(report.id);
    setViewMode('pages');
    setBreadcrumb([
      { id: report.id, name: report.title, type: 'report', icon: FaFolder }
    ]);
  }, []);

  const handlePageSelect = useCallback((page: ReportPage) => {
    setSelectedPageId(page.id);
    setViewMode('components');
    setBreadcrumb(prev => [
      ...prev,
      { id: page.id, name: page.title, type: 'page', icon: FaFile }
    ]);
  }, []);

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    if (index === -1) {
      // Go to reports
      setViewMode('reports');
      setSelectedReportId(null);
      setSelectedPageId(null);
      setBreadcrumb([]);
    } else if (index === 0) {
      // Go to pages
      setViewMode('pages');
      setSelectedPageId(null);
      setBreadcrumb(prev => prev.slice(0, 1));
    }
  }, []);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Filter items based on search
  const filteredReports = reportsStore.reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    component.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (viewMode === 'reports') {
      return (
        <>
          {reportsStore.isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#8a9ba8'
            }}>
              Loading reports...
            </div>
          ) : filteredReports.length === 0 ? (
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
              <FaFolder size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', color: '#bfccd6' }}>No reports found</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                Create your first report to start building hierarchical content.
              </p>
            </div>
          ) : (
            <div>
              {filteredReports.map((report) => (
                <TreeNode
                  key={report.id}
                  item={report}
                  level={0}
                  isExpanded={false}
                  onToggle={() => {}}
                  onSelect={() => handleReportSelect(report)}
                  onEdit={() => console.log('Edit report:', report)}
                  onDelete={() => console.log('Delete report:', report)}
                  onDuplicate={() => reportsStore.duplicateReport(report.id, `${report.title} (Copy)`)}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (viewMode === 'pages') {
      return (
        <>
          {isLoadingPages ? (
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
              <h4 style={{ margin: '0 0 8px 0', color: '#bfccd6' }}>No pages found</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                Add pages to this report to organize your content.
              </p>
            </div>
          ) : (
            <div>
              {filteredPages.map((page) => (
                <TreeNode
                  key={page.id}
                  item={page}
                  level={0}
                  isExpanded={false}
                  onToggle={() => {}}
                  onSelect={() => handlePageSelect(page)}
                  onEdit={() => console.log('Edit page:', page)}
                  onDelete={() => console.log('Delete page:', page)}
                  onDuplicate={() => console.log('Duplicate page:', page)}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (viewMode === 'components') {
      return (
        <>
          {isLoadingComponents ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#8a9ba8'
            }}>
              Loading components...
            </div>
          ) : filteredComponents.length === 0 ? (
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
              <FaCubes size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', color: '#bfccd6' }}>No components found</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                Add components to this page to build your content.
              </p>
            </div>
          ) : (
            <div>
              {filteredComponents.map((component) => (
                <TreeNode
                  key={component.id}
                  item={component}
                  level={0}
                  isExpanded={false}
                  onToggle={() => {}}
                  onSelect={() => console.log('Select component:', component)}
                  onEdit={() => console.log('Edit component:', component)}
                  onDelete={() => console.log('Delete component:', component)}
                  onDuplicate={() => console.log('Duplicate component:', component)}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    return null;
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'reports': return 'Reports';
      case 'pages': return 'Pages';
      case 'components': return 'Components';
      default: return 'Hierarchy';
    }
  };

  const getAddButtonText = () => {
    switch (viewMode) {
      case 'reports': return 'New Report';
      case 'pages': return 'Add Page';
      case 'components': return 'Add Component';
      default: return 'Add Item';
    }
  };

  const handleAddNew = () => {
    switch (viewMode) {
      case 'reports':
        reportsStore.showCreateReportDialog();
        break;
      case 'pages':
        console.log('Add page to report:', selectedReportId);
        break;
      case 'components':
        console.log('Add component to page:', selectedPageId);
        break;
    }
  };

  return (
    <PanelContainer>
      <PanelHeader>
        {/* Breadcrumb Navigation */}
        {breadcrumb.length > 0 && (
          <Breadcrumb 
            items={breadcrumb} 
            onNavigate={handleBreadcrumbNavigate}
          />
        )}

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
            {getViewTitle()}
          </h3>
          <button
            onClick={handleAddNew}
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
            {getAddButtonText()}
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${viewMode}...`}
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

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#8a9ba8'
        }}>
          <span>
            <strong style={{ color: '#f5f8fa' }}>
              {viewMode === 'reports' && filteredReports.length}
              {viewMode === 'pages' && filteredPages.length}
              {viewMode === 'components' && filteredComponents.length}
            </strong> {viewMode}
          </span>
          {viewMode === 'reports' && reportsStore.stats && (
            <span>
              <strong style={{ color: '#48aff0' }}>{reportsStore.stats.publishedReports}</strong> published
            </span>
          )}
        </div>
      </PanelHeader>

      <PanelContent>
        {reportsStore.error && (
          <div style={{
            padding: '12px',
            margin: '8px',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {reportsStore.error}
          </div>
        )}

        {renderContent()}
      </PanelContent>
    </PanelContainer>
  );
});

export type { HierarchicalPanelProps };