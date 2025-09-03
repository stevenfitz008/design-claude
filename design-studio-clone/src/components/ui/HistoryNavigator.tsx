import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
// we need observer to update component automatically on any store changes
import { Button, Menu, MenuItem, Popover, Classes } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useCommandStore } from '@/stores/commandStore';
import { useCanvasStore } from '@/stores/canvasStore';

const HistoryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HistoryButton = styled(Button)<{ disabled: boolean }>`
  min-width: 30px !important;
  padding: 4px 8px !important;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
`;

const HistoryList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  min-width: 250px;
`;

const HistoryItem = styled.div<{ isActive: boolean; isFuture: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  background-color: ${props => 
    props.isActive ? 'rgba(0, 123, 255, 0.2)' : 
    props.isFuture ? 'rgba(255, 255, 255, 0.05)' : 
    'transparent'
  };
  opacity: ${props => props.isFuture ? 0.6 : 1};
  border-left: 3px solid ${props => 
    props.isActive ? '#007bff' : 'transparent'
  };
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .history-type {
    font-weight: 600;
    color: #007bff;
    text-transform: capitalize;
  }
  
  .history-description {
    color: rgba(255, 255, 255, 0.8);
    margin-top: 2px;
  }
  
  .history-time {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 2px;
  }
`;

export const HistoryNavigator: React.FC = observer(() => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const { 
    commands, 
    currentIndex, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    clearHistory 
  } = useCommandStore();

  const handleJumpToHistory = (index: number) => {
    const current = currentIndex;
    const target = index;
    
    if (target < current) {
      // Undo to target
      for (let i = current; i > target; i--) {
        undo();
      }
    } else if (target > current) {
      // Redo to target
      for (let i = current; i < target; i++) {
        redo();
      }
    }
    
    setIsHistoryOpen(false);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // < 1 minute
      return `${Math.floor(diff / 1000)}s ago`;
    } else if (diff < 3600000) { // < 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else {
      return new Date(timestamp).toLocaleTimeString();
    }
  };

  const historyMenu = (
    <Menu className={Classes.DARK}>
      <MenuItem
        text="Clear History"
        icon="trash"
        intent="danger"
        onClick={() => {
          clearHistory();
          setIsHistoryOpen(false);
        }}
      />
      <Menu.Divider />
      <HistoryList>
        {commands.length === 0 ? (
          <MenuItem text="No history available" disabled />
        ) : (
          commands.map((command, index) => {
            const isActive = index === currentIndex;
            const isFuture = index > currentIndex;
            
            return (
              <HistoryItem
                key={command.id}
                isActive={isActive}
                isFuture={isFuture}
                onClick={() => handleJumpToHistory(index)}
              >
                <div className="history-type">
                  {command.type.replace(/_/g, ' ')}
                </div>
                <div className="history-description">
                  {command.description}
                </div>
                <div className="history-time">
                  {formatTime(command.timestamp)}
                </div>
              </HistoryItem>
            );
          })
        )}
      </HistoryList>
    </Menu>
  );

  return (
    <HistoryContainer>
      <HistoryButton
        icon="undo"
        minimal
        disabled={!canUndo()}
        onClick={undo}
        title="Undo (Ctrl+Z)"
      />
      
      <HistoryButton
        icon="redo"
        minimal
        disabled={!canRedo()}
        onClick={redo}
        title="Redo (Ctrl+Y)"
      />
      
      <Popover
        content={historyMenu}
        isOpen={isHistoryOpen}
        onInteraction={setIsHistoryOpen}
        placement="bottom-start"
        className={Classes.DARK}
      >
        <HistoryButton
          icon="history"
          minimal
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          title="History Navigator"
        />
      </Popover>
      
      {commands.length > 0 && (
        <span style={{ 
          fontSize: '11px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginLeft: '8px' 
        }}>
          {currentIndex + 1}/{commands.length}
        </span>
      )}
    </HistoryContainer>
  );
});

HistoryNavigator.displayName = 'HistoryNavigator';