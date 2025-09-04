import React, { useEffect, useState, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { 
  FaHistory, 
  FaTag, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle,
  FaDownload,
  FaCode,
  FaEdit,
  FaTrash,
  FaCopy,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaUsers,
  FaClock,
  FaStar,
  FaStarHalf
} from '@meronex/icons/fa';
import { componentsService, type Component, type ComponentVersion } from '../../services/componentsService';

interface ComponentVersionPanelProps {
  className?: string;
  componentId?: string;
}

interface ComponentVersionExtended extends ComponentVersion {
  downloadCount: number;
  usageCount: number;
  issueCount: number;
  isStable: boolean;
  isLatest: boolean;
  isDeprecated: boolean;
  compatibility: 'high' | 'medium' | 'low';
  performance: number; // 1-5 rating
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

const VersionBadge: React.FC<{
  version: ComponentVersionExtended;
}> = ({ version }) => {
  const getBadgeColor = () => {
    if (version.isLatest) return '#48aff0';
    if (version.isStable) return '#28a745';
    if (version.isDeprecated) return '#dc3545';
    return '#8a9ba8';
  };

  const getBadgeText = () => {
    if (version.isLatest) return 'Latest';
    if (version.isStable) return 'Stable';
    if (version.isDeprecated) return 'Deprecated';
    return 'Preview';
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 6px',
      backgroundColor: getBadgeColor(),
      color: 'white',
      borderRadius: '3px',
      fontSize: '10px',
      fontWeight: '500'
    }}>
      {version.isLatest && <FaStar size={8} />}
      {version.isStable && <FaCheck size={8} />}
      {version.isDeprecated && <FaExclamationTriangle size={8} />}
      {getBadgeText()}
    </span>
  );
};

const CompatibilityIndicator: React.FC<{
  level: 'high' | 'medium' | 'low';
}> = ({ level }) => {
  const getColor = () => {
    switch (level) {
      case 'high': return '#28a745';
      case 'medium': return '#ffc107';
      case 'low': return '#dc3545';
      default: return '#8a9ba8';
    }
  };

  const getText = () => {
    switch (level) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  return (
    <span style={{
      color: getColor(),
      fontSize: '11px',
      fontWeight: '500'
    }}>
      {getText()} Compatibility
    </span>
  );
};

const StarRating: React.FC<{
  rating: number;
  maxRating?: number;
}> = ({ rating, maxRating = 5 }) => {
  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    if (i <= rating) {
      stars.push(<FaStar key={i} size={10} color="#ffc107" />);
    } else if (i - 0.5 <= rating) {
      stars.push(<FaStarHalf key={i} size={10} color="#ffc107" />);
    } else {
      stars.push(<FaStar key={i} size={10} color="#495563" />);
    }
  }
  return <div style={{ display: 'flex', gap: '1px' }}>{stars}</div>;
};

const VersionCard: React.FC<{
  version: ComponentVersionExtended;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRollback: () => void;
  onMarkStable: () => void;
}> = ({ version, onSelect, onEdit, onDelete, onRollback, onMarkStable }) => (
  <div
    onClick={onSelect}
    style={{
      padding: '16px',
      margin: '8px',
      backgroundColor: '#252a30',
      border: '1px solid #495563',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative'
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
    {/* Version header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#f5f8fa'
        }}>
          v{version.version}
        </h4>
        <VersionBadge version={version} />
      </div>
      
      <div style={{ fontSize: '11px', color: '#8a9ba8' }}>
        {new Date(version.createdAt).toLocaleDateString()}
      </div>
    </div>
    
    {/* Version description */}
    {version.changeLog && (
      <p style={{
        margin: '0 0 12px 0',
        fontSize: '13px',
        color: '#a7b6c2',
        lineHeight: '1.4'
      }}>
        {version.changeLog}
      </p>
    )}
    
    {/* Metrics */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '12px'
    }}>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px'
        }}>
          <FaDownload size={10} color="#8a9ba8" />
          <span style={{ fontSize: '11px', color: '#8a9ba8' }}>
            {version.downloadCount} downloads
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <FaUsers size={10} color="#8a9ba8" />
          <span style={{ fontSize: '11px', color: '#8a9ba8' }}>
            {version.usageCount} active uses
          </span>
        </div>
      </div>
      
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '11px', color: '#8a9ba8' }}>Performance:</span>
          <StarRating rating={version.performance} />
        </div>
        <CompatibilityIndicator level={version.compatibility} />
      </div>
    </div>
    
    {/* Issues indicator */}
    {version.issueCount > 0 && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '12px',
        padding: '6px 8px',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderRadius: '4px',
        border: '1px solid rgba(220, 53, 69, 0.3)'
      }}>
        <FaExclamationTriangle size={12} color="#dc3545" />
        <span style={{ fontSize: '12px', color: '#dc3545' }}>
          {version.issueCount} known issue{version.issueCount !== 1 ? 's' : ''}
        </span>
      </div>
    )}
    
    {/* Action buttons */}
    <div style={{
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    }}>
      {!version.isLatest && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRollback();
          }}
          style={{
            padding: '4px 8px',
            backgroundColor: '#48aff0',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FaArrowUp size={10} />
          Rollback
        </button>
      )}
      
      {!version.isStable && !version.isDeprecated && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkStable();
          }}
          style={{
            padding: '4px 8px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <FaCheck size={10} />
          Mark Stable
        </button>
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          padding: '4px 8px',
          backgroundColor: 'transparent',
          color: '#a7b6c2',
          border: '1px solid #495563',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
        title="Edit version"
      >
        <FaEdit size={10} />
      </button>
      
      {!version.isLatest && version.usageCount === 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            color: '#dc3545',
            border: '1px solid #495563',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
          title="Delete version"
        >
          <FaTrash size={10} />
        </button>
      )}
    </div>
  </div>
);

export const ComponentVersionPanel: React.FC<ComponentVersionPanelProps> = observer(({ className, componentId }) => {
  const [component, setComponent] = useState<Component | null>(null);
  const [versions, setVersions] = useState<ComponentVersionExtended[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load component and versions
  useEffect(() => {
    const loadData = async () => {
      if (!componentId) {
        setComponent(null);
        setVersions([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Load component details
        const componentData = await componentsService.getComponent(componentId);
        setComponent(componentData);
        
        // Load versions (mock data for demonstration)
        const mockVersions: ComponentVersionExtended[] = [
          {
            id: '1',
            componentId: componentId,
            version: 3,
            changeLog: 'Added responsive design support and improved accessibility features',
            isStable: false,
            createdBy: 'john.doe',
            createdAt: '2025-01-04T00:00:00Z',
            updatedAt: '2025-01-04T00:00:00Z',
            downloadCount: 45,
            usageCount: 12,
            issueCount: 0,
            isLatest: true,
            isDeprecated: false,
            compatibility: 'high',
            performance: 4.5
          },
          {
            id: '2',
            componentId: componentId,
            version: 2,
            changeLog: 'Performance improvements and bug fixes for Safari compatibility',
            isStable: true,
            createdBy: 'jane.smith',
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z',
            downloadCount: 234,
            usageCount: 89,
            issueCount: 1,
            isLatest: false,
            isDeprecated: false,
            compatibility: 'high',
            performance: 4.2
          },
          {
            id: '3',
            componentId: componentId,
            version: 1,
            changeLog: 'Initial release with basic functionality',
            isStable: true,
            createdBy: 'system',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            downloadCount: 567,
            usageCount: 23,
            issueCount: 3,
            isLatest: false,
            isDeprecated: true,
            compatibility: 'medium',
            performance: 3.8
          }
        ];
        
        setVersions(mockVersions);
      } catch (err) {
        console.error('Failed to load component versions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load component versions');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [componentId]);

  const handleVersionSelect = useCallback((version: ComponentVersionExtended) => {
    console.log('Selected version:', version);
  }, []);

  const handleEditVersion = useCallback((version: ComponentVersionExtended) => {
    console.log('Editing version:', version);
  }, []);

  const handleDeleteVersion = useCallback((version: ComponentVersionExtended) => {
    console.log('Deleting version:', version);
  }, []);

  const handleRollback = useCallback((version: ComponentVersionExtended) => {
    console.log('Rolling back to version:', version);
  }, []);

  const handleMarkStable = useCallback((version: ComponentVersionExtended) => {
    console.log('Marking stable version:', version);
  }, []);

  const handleCreateVersion = useCallback(() => {
    console.log('Creating new version for component:', componentId);
  }, [componentId]);

  if (!componentId) {
    return (
      <PanelContainer>
        <PanelContent>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8a9ba8',
            textAlign: 'center',
            padding: '32px'
          }}>
            <FaHistory size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', color: '#bfccd6' }}>No component selected</h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
              Select a component to view its version history and management options.
            </p>
          </div>
        </PanelContent>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer>
      <PanelHeader>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#f5f8fa'
            }}>
              Version History
            </h3>
            {component && (
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#a7b6c2'
              }}>
                {component.name}
              </p>
            )}
          </div>
          <button
            onClick={handleCreateVersion}
            style={{
              padding: '8px 12px',
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
            <FaTag size={12} />
            New Version
          </button>
        </div>

        {/* Summary stats */}
        {versions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            fontSize: '12px',
            color: '#8a9ba8'
          }}>
            <div>
              <strong style={{ color: '#f5f8fa' }}>{versions.length}</strong> versions
            </div>
            <div>
              <strong style={{ color: '#28a745' }}>{versions.filter(v => v.isStable).length}</strong> stable
            </div>
            <div>
              <strong style={{ color: '#dc3545' }}>{versions.filter(v => v.isDeprecated).length}</strong> deprecated
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
              onClick={() => setError(null)}
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
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
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
            <FaHistory size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', color: '#bfccd6' }}>No versions found</h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
              Create the first version of this component to start tracking changes.
            </p>
          </div>
        ) : (
          <div>
            {versions.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                onSelect={() => handleVersionSelect(version)}
                onEdit={() => handleEditVersion(version)}
                onDelete={() => handleDeleteVersion(version)}
                onRollback={() => handleRollback(version)}
                onMarkStable={() => handleMarkStable(version)}
              />
            ))}
          </div>
        )}
      </PanelContent>
    </PanelContainer>
  );
});

export type { ComponentVersionPanelProps };