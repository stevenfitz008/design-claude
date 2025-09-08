import React from 'react';
import { styled, keyframes } from 'goober';

interface SaveStatusIndicatorProps {
  isSaving?: boolean;
  lastSaved?: Date | null;
  error?: Error | null;
  hasPendingChanges?: boolean;
  saveCount?: number;
  onManualSave?: () => void;
  className?: string;
}

const pulse = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const Container = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(45, 55, 72, 0.9);
  border: 1px solid #495563;
  border-radius: 6px;
  color: #a7b6c2;
  font-size: 12px;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
`;

const StatusIcon = styled('div')<{ $status: 'saving' | 'saved' | 'error' | 'pending' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'saving': return '#f39c12';
      case 'saved': return '#27ae60';
      case 'error': return '#dc3545';
      case 'pending': return '#48aff0';
      default: return '#6c757d';
    }
  }};
  
  ${props => props.$status === 'saving' && `
    animation: ${pulse} 1.5s infinite;
  `}
  
  ${props => props.$status === 'pending' && `
    animation: ${pulse} 2s infinite;
  `}
`;

const StatusText = styled('span')<{ $status: 'saving' | 'saved' | 'error' | 'pending' }>`
  color: ${(props: any) => {
    switch (props.$status) {
      case 'saving': return '#f39c12';
      case 'saved': return '#27ae60';
      case 'error': return '#dc3545';
      case 'pending': return '#48aff0';
      default: return '#a7b6c2';
    }
  }};
  font-weight: 500;
`;

const SaveButton = styled('button')`
  background: #48aff0;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
  
  &:hover {
    background: #3a8bc8;
  }
  
  &:disabled {
    background: #495563;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ErrorDetails = styled('div')`
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #dc3545;
`;

const LastSavedTime = styled('div')`
  color: #8a9ba8;
  font-size: 11px;
`;

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  isSaving = false,
  lastSaved = null,
  error = null,
  hasPendingChanges = false,
  saveCount = 0,
  onManualSave,
  className,
}) => {
  const getStatus = (): 'saving' | 'saved' | 'error' | 'pending' => {
    if (error) return 'error';
    if (isSaving) return 'saving';
    if (hasPendingChanges) return 'pending';
    return 'saved';
  };

  const getStatusText = (): string => {
    if (error) return 'Save failed';
    if (isSaving) return 'Saving...';
    if (hasPendingChanges) return 'Unsaved changes';
    return 'All changes saved';
  };

  const getFormattedLastSaved = (): string => {
    if (!lastSaved) return 'Never';
    
    const now = Date.now();
    const savedTime = lastSaved.getTime();
    const diffMinutes = Math.floor((now - savedTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastSaved.toLocaleString();
  };

  const status = getStatus();

  return (
    <Container className={className}>
      <StatusIcon $status={status} />
      
      <StatusText $status={status}>
        {getStatusText()}
      </StatusText>
      
      {error && (
        <ErrorDetails title={error.message}>
          {error.message}
        </ErrorDetails>
      )}
      
      {!error && lastSaved && (
        <LastSavedTime>
          Last saved: {getFormattedLastSaved()}
        </LastSavedTime>
      )}
      
      {saveCount > 0 && !error && (
        <LastSavedTime>
          ({saveCount} saves)
        </LastSavedTime>
      )}
      
      {(hasPendingChanges || error) && onManualSave && (
        <SaveButton
          onClick={onManualSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Now'}
        </SaveButton>
      )}
    </Container>
  );
};

export default SaveStatusIndicator;