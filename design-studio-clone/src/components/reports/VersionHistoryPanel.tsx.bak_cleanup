import React, { useState, useEffect } from 'react';
import { styled } from 'goober';
import { reportsService, type ReportVersion } from '../../services/reportsService';

interface VersionHistoryPanelProps {
  reportId: string;
  currentVersion?: number;
  onLoadVersion?: (version: ReportVersion) => void;
  onDeleteVersion?: (versionId: string) => void;
  onClose?: () => void;
}

const Panel = styled('div')`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #2f343c;
  border-left: 1px solid #495563;
  width: 350px;
`;

const Header = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #495563;
  background: #252a30;
`;

const Title = styled('h3')`
  margin: 0;
  color: #f5f8fa;
  font-size: 14px;
  font-weight: 500;
`;

const CloseButton = styled('button')`
  background: none;
  border: none;
  color: #a7b6c2;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 18px;
  line-height: 1;
  
  &:hover {
    color: #f5f8fa;
    background: #495563;
  }
`;

const VersionList = styled('div')`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const VersionItem = styled('div')<{ $isActive?: boolean; $isAutoSaved?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 1px solid ${props => props.$isActive ? '#48aff0' : '#495563'};
  background: ${props => props.$isActive ? 'rgba(72, 175, 240, 0.1)' : '#252a30'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: ${props => props.$isActive ? 'rgba(72, 175, 240, 0.15)' : '#495563'};
    border-color: #48aff0;
  }
  
  ${props => props.$isAutoSaved && `
    border-left: 3px solid #f39c12;
  `}
`;

const VersionHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 6px;
`;

const VersionNumber = styled('span')`
  font-weight: 600;
  color: #48aff0;
  font-size: 13px;
  margin-right: 8px;
`;

const SaveType = styled('span')<{ $autoSaved: boolean }>`
  font-size: 11px;
  color: ${props => props.$autoSaved ? '#f39c12' : '#27ae60'};
  background: ${props => props.$autoSaved ? 'rgba(243, 156, 18, 0.2)' : 'rgba(39, 174, 96, 0.2)'};
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 8px;
`;

const VersionTime = styled('span')`
  font-size: 11px;
  color: #8a9ba8;
  margin-left: auto;
`;

const VersionDescription = styled('div')`
  color: #a7b6c2;
  font-size: 12px;
  margin-bottom: 4px;
  line-height: 1.3;
`;

const VersionStats = styled('div')`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: #8a9ba8;
`;

const Stat = styled('span')`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButtons = styled('div')`
  display: flex;
  gap: 6px;
  margin-top: 8px;
`;

const ActionButton = styled('button')<{ $variant?: 'primary' | 'danger' }>`
  background: ${props => 
    props.$variant === 'primary' ? '#48aff0' :
    props.$variant === 'danger' ? '#dc3545' : '#495563'
  };
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingState = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #8a9ba8;
  font-size: 13px;
`;

const ErrorState = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #dc3545;
  font-size: 13px;
  text-align: center;
`;

const RetryButton = styled('button')`
  background: #48aff0;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 12px;
  
  &:hover {
    background: #3a8bc8;
  }
`;

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  reportId,
  currentVersion,
  onLoadVersion,
  onDeleteVersion,
  onClose,
}) => {
  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportsService.getReportVersions(reportId);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [reportId]);

  const handleLoadVersion = async (version: ReportVersion) => {
    try {
      onLoadVersion?.(version);
    } catch (err) {
      console.error('Failed to load version:', err);
      setError(err instanceof Error ? err.message : 'Failed to load version');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingVersionId(versionId);
      
      await reportsService.deleteReportVersion(reportId, versionId);
      
      // Remove from local state
      setVersions(prev => prev.filter(v => v.id !== versionId));
      
      onDeleteVersion?.(versionId);
    } catch (err) {
      console.error('Failed to delete version:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete version');
    } finally {
      setDeletingVersionId(null);
    }
  };

  const formatCanvasSize = (version: ReportVersion) => {
    const { width, height } = version.canvasState.canvasSize;
    return `${width}×${height}`;
  };

  if (loading) {
    return (
      <Panel>
        <Header>
          <Title>Version History</Title>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </Header>
        <LoadingState>Loading versions...</LoadingState>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel>
        <Header>
          <Title>Version History</Title>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </Header>
        <ErrorState>
          <div>{error}</div>
          <RetryButton onClick={loadVersions}>Retry</RetryButton>
        </ErrorState>
      </Panel>
    );
  }

  return (
    <Panel>
      <Header>
        <Title>Version History ({versions.length})</Title>
        {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
      </Header>
      
      <VersionList>
        {versions.map((version) => (
          <VersionItem
            key={version.id}
            $isActive={version.version === currentVersion}
            $isAutoSaved={version.autoSaved}
            onClick={() => handleLoadVersion(version)}
          >
            <VersionHeader>
              <VersionNumber>v{version.version}</VersionNumber>
              <SaveType $autoSaved={version.autoSaved}>
                {version.autoSaved ? 'Auto' : 'Manual'}
              </SaveType>
              <VersionTime>
                {reportsService.getVersionAge(version.createdAt)}
              </VersionTime>
            </VersionHeader>
            
            <VersionDescription>
              {version.changeDescription || 'No description'}
            </VersionDescription>
            
            <VersionStats>
              <Stat>
                <span>📦</span>
                {version.elementCount} elements
              </Stat>
              <Stat>
                <span>📐</span>
                {formatCanvasSize(version)}
              </Stat>
              {version.backgroundColor && (
                <Stat>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: version.backgroundColor,
                      borderRadius: 2,
                      border: '1px solid #495563'
                    }}
                  />
                  BG
                </Stat>
              )}
            </VersionStats>
            
            <ActionButtons>
              <ActionButton 
                $variant="primary" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadVersion(version);
                }}
              >
                Load
              </ActionButton>
              
              {versions.length > 1 && !version.autoSaved && (
                <ActionButton
                  $variant="danger"
                  disabled={deletingVersionId === version.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVersion(version.id);
                  }}
                >
                  {deletingVersionId === version.id ? 'Deleting...' : 'Delete'}
                </ActionButton>
              )}
            </ActionButtons>
          </VersionItem>
        ))}
        
        {versions.length === 0 && (
          <LoadingState>No versions found</LoadingState>
        )}
      </VersionList>
    </Panel>
  );
};

export default VersionHistoryPanel;