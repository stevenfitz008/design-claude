import React, { useEffect, useState, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { FaPlus, FaSearch, FaFilter, FaSort, FaEye, FaEyeSlash, FaEdit, FaTrash, FaCopy, FaFileExport, FaFolder, FaUsers, FaLock, FaGlobe } from '@meronex/icons/fa';
import { useReportsStore } from '../../stores/reportsStore';
import type { Report, CreateReportRequest } from '../../services/reportsService';

interface ReportsPanelProps {
  className?: string;
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

const SearchBar: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <div style={{ position: 'relative', marginBottom: '12px' }}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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
      onFocus={(e) => {
        e.target.style.borderColor = '#48aff0';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#5a6c7d';
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
);

const FilterButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 12px',
      backgroundColor: active ? '#48aff0' : 'transparent',
      color: active ? 'white' : '#a7b6c2',
      border: `1px solid ${active ? '#48aff0' : '#495563'}`,
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.borderColor = '#5a6c7d';
        e.currentTarget.style.color = '#f5f8fa';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.borderColor = '#495563';
        e.currentTarget.style.color = '#a7b6c2';
      }
    }}
  >
    {children}
  </button>
);

const ReportCard: React.FC<{
  report: Report;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ report, isSelected, onSelect, onOpen, onEdit, onDelete, onDuplicate }) => (
  <div
    onClick={onSelect}
    style={{
      padding: '12px',
      margin: '8px',
      backgroundColor: isSelected ? 'rgba(72, 175, 240, 0.1)' : '#252a30',
      border: `1px solid ${isSelected ? '#48aff0' : '#495563'}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative'
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
    {/* Report thumbnail or icon */}
    <div style={{
      width: '100%',
      height: '60px',
      backgroundColor: '#495563',
      borderRadius: '4px',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: report.thumbnail 
        ? `url(${report.thumbnail}) center/cover`
        : '#495563'
    }}>
      {!report.thumbnail && (
        <FaFolder size={24} color="#8a9ba8" />
      )}
    </div>
    
    {/* Report info */}
    <div style={{ marginBottom: '8px' }}>
      <h4 style={{
        margin: '0 0 4px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#f5f8fa',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {report.title}
      </h4>
      
      {report.description && (
        <p style={{
          margin: '0 0 6px 0',
          fontSize: '12px',
          color: '#a7b6c2',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {report.description}
        </p>
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#8a9ba8'
      }}>
        <span>{report.pageCount || 0} pages</span>
        <span>•</span>
        <span>v{report.version}</span>
        {report.isPublished && (
          <>
            <span>•</span>
            <span style={{ color: '#48aff0' }}>Published</span>
          </>
        )}
      </div>
    </div>
    
    {/* Status indicators */}
    <div style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      display: 'flex',
      gap: '4px'
    }}>
      {report.isPublic ? (
        <FaGlobe size={12} color="#48aff0" title="Public" />
      ) : (
        <FaLock size={12} color="#8a9ba8" title="Private" />
      )}
      {report.isPublished && (
        <FaEye size={12} color="#48aff0" title="Published" />
      )}
    </div>
    
    {/* Action buttons */}
    <div style={{
      display: 'flex',
      gap: '4px',
      marginTop: '8px'
    }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        style={{
          flex: 1,
          padding: '6px 8px',
          backgroundColor: '#48aff0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2c5282';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#48aff0';
        }}
      >
        Open
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          padding: '6px',
          backgroundColor: 'transparent',
          color: '#a7b6c2',
          border: '1px solid #495563',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title="Edit"
      >
        <FaEdit size={12} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        style={{
          padding: '6px',
          backgroundColor: 'transparent',
          color: '#a7b6c2',
          border: '1px solid #495563',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title="Duplicate"
      >
        <FaCopy size={12} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          padding: '6px',
          backgroundColor: 'transparent',
          color: '#dc3545',
          border: '1px solid #495563',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title="Delete"
      >
        <FaTrash size={12} />
      </button>
    </div>
  </div>
);

const CreateReportDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateReportRequest) => Promise<void>;
  isCreating: boolean;
}> = ({ isOpen, onClose, onCreate, isCreating }) => {
  const [formData, setFormData] = useState<CreateReportRequest>({
    title: '',
    description: '',
    category: 'general',
    tags: [],
    isPublic: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      await onCreate(formData);
      setFormData({
        title: '',
        description: '',
        category: 'general',
        tags: [],
        isPublic: false
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2f343c',
        border: '1px solid #495563',
        borderRadius: '8px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          color: '#f5f8fa',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Create New Report
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: '#a7b6c2',
              fontSize: '14px'
            }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#495563',
                border: '1px solid #5a6c7d',
                borderRadius: '4px',
                color: '#f5f8fa',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: '#a7b6c2',
              fontSize: '14px'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#495563',
                border: '1px solid #5a6c7d',
                borderRadius: '4px',
                color: '#f5f8fa',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: '#a7b6c2',
              fontSize: '14px'
            }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#495563',
                border: '1px solid #5a6c7d',
                borderRadius: '4px',
                color: '#f5f8fa',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
              <option value="research">Research</option>
              <option value="education">Education</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#a7b6c2',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                style={{ accentColor: '#48aff0' }}
              />
              Make this report public
            </label>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#a7b6c2',
                border: '1px solid #495563',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || isCreating}
              style={{
                padding: '8px 16px',
                backgroundColor: formData.title.trim() ? '#48aff0' : '#495563',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: formData.title.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              {isCreating ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ReportsPanel: React.FC<ReportsPanelProps> = observer(({ className }) => {
  const {
    reports,
    stats,
    isLoading,
    isCreating,
    error,
    searchQuery,
    selectedCategory,
    showPublishedOnly,
    showPublicOnly,
    selectedReportIds,
    showCreateDialog,
    fetchReports,
    fetchReportStats,
    createReport,
    deleteReport,
    duplicateReport,
    setSearchQuery,
    setCategory,
    toggleShowPublishedOnly,
    toggleShowPublicOnly,
    toggleReportSelection,
    isReportSelected,
    showCreateReportDialog,
    hideCreateReportDialog,
    showDeleteReportDialog,
    clearError
  } = useReportsStore();

  // Load initial data
  useEffect(() => {
    fetchReports();
    fetchReportStats();
  }, [fetchReports, fetchReportStats]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchReports();
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, showPublishedOnly, showPublicOnly, fetchReports]);

  const handleCreateReport = useCallback(async (data: CreateReportRequest) => {
    try {
      await createReport(data);
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  }, [createReport]);

  const handleOpenReport = useCallback((report: Report) => {
    console.log('Opening report:', report);
    // TODO: Implement report opening logic - navigate to report editor
  }, []);

  const handleEditReport = useCallback((report: Report) => {
    console.log('Editing report:', report);
    // TODO: Implement report editing logic
  }, []);

  const handleDuplicateReport = useCallback(async (report: Report) => {
    try {
      await duplicateReport(report.id, `${report.title} (Copy)`);
    } catch (error) {
      console.error('Failed to duplicate report:', error);
    }
  }, [duplicateReport]);

  const handleDeleteReport = useCallback((report: Report) => {
    showDeleteReportDialog(report.id);
  }, [showDeleteReportDialog]);

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
            Reports
          </h3>
          <button
            onClick={showCreateReportDialog}
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
            New Report
          </button>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search reports..."
        />

        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          <FilterButton
            active={showPublishedOnly}
            onClick={toggleShowPublishedOnly}
          >
            <FaEye size={12} />
            Published
          </FilterButton>
          
          <FilterButton
            active={showPublicOnly}
            onClick={toggleShowPublicOnly}
          >
            <FaGlobe size={12} />
            Public
          </FilterButton>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{
            marginTop: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '12px',
            color: '#8a9ba8'
          }}>
            <div>
              <strong style={{ color: '#f5f8fa' }}>{stats.totalReports}</strong> total
            </div>
            <div>
              <strong style={{ color: '#48aff0' }}>{stats.publishedReports}</strong> published
            </div>
            <div>
              <strong style={{ color: '#f5f8fa' }}>{stats.totalPages}</strong> pages
            </div>
            <div>
              <strong style={{ color: '#8a9ba8' }}>{stats.draftReports}</strong> drafts
            </div>
          </div>
        )}
      </PanelHeader>

      <PanelContent>
        {error && (
          <div style={{
            padding: '12px',
            margin: '8px',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#8a9ba8'
          }}>
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
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
              Create your first report to get started with hierarchical content management.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0px',
            padding: '8px'
          }}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={isReportSelected(report.id)}
                onSelect={() => toggleReportSelection(report.id)}
                onOpen={() => handleOpenReport(report)}
                onEdit={() => handleEditReport(report)}
                onDelete={() => handleDeleteReport(report)}
                onDuplicate={() => handleDuplicateReport(report)}
              />
            ))}
          </div>
        )}
      </PanelContent>

      <CreateReportDialog
        isOpen={showCreateDialog}
        onClose={hideCreateReportDialog}
        onCreate={handleCreateReport}
        isCreating={isCreating}
      />
    </PanelContainer>
  );
});

export type { ReportsPanelProps };