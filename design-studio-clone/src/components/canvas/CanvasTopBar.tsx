import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, ButtonGroup, Divider, Navbar } from '@blueprintjs/core';
import { useCanvasStore } from '../../stores/canvasStore';
import useCanvasIntegration from '../../hooks/useCanvasIntegration';
import SaveStatusIndicator from '../reports/SaveStatusIndicator';
import VersionHistoryPanel from '../reports/VersionHistoryPanel';
import { reportsService, type ReportVersion } from '../../services/reportsService';
import type { CanvasElement, TextElement, ImageElement, ShapeElement } from '../../types/canvas';

interface CanvasTopBarProps {
  reportId?: string;
  onReportChange?: (reportId: string | null) => void;
  className?: string;
}

export const CanvasTopBar: React.FC<CanvasTopBarProps> = observer(({ reportId, onReportChange, className }) => {
  // Canvas integration state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { 
    selection, 
    getSelectedElements, 
    transformElements,
    deleteElements,
    duplicateElements,
    moveToFront,
    moveToBack,
    copySelection,
    cutSelection,
    paste,
    selectAll,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    clipboard
  } = useCanvasStore();
  
  // Canvas integration hook
  const canvasIntegration = useCanvasIntegration({
    reportId,
    autoSaveEnabled: true,
    onVersionSaved: (version) => {
      console.log('Version saved:', version);
    },
    onReportLoaded: (response) => {
      console.log('Report loaded:', response);
    },
    onError: (error, context) => {
      console.error(`Canvas integration error (${context}):`, error);
    },
  });
  
  const selectedElements = getSelectedElements();
  const hasSelection = selectedElements.length > 0;
  const isMultiSelection = selectedElements.length > 1;

  // Determine the primary element type for context-sensitive actions
  const getPrimaryElementType = (): string => {
    if (selectedElements.length === 0) return 'none';
    if (selectedElements.length === 1) return selectedElements[0].type;
    
    // For multi-selection, find the most common type
    const typeCounts = selectedElements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  };

  const primaryType = getPrimaryElementType();

  // Reports integration handlers
  const handleOpenReport = async () => {
    const reportId = prompt('Enter Report ID to open:');
    if (reportId) {
      try {
        await canvasIntegration.openReport(reportId);
        onReportChange?.(reportId);
      } catch (error) {
        alert(`Failed to open report: ${error}`);
      }
    }
  };

  const handleSaveReport = async () => {
    console.log('🔄 handleSaveReport called - hasReportOpen:', canvasIntegration.hasReportOpen, 'currentReportId:', canvasIntegration.currentReportId);
    
    if (!canvasIntegration.hasReportOpen) {
      const title = prompt('Enter title for new report:');
      if (title) {
        try {
          console.log('🆕 Creating new report with title:', title);
          const { report } = await canvasIntegration.createReportFromCanvas({
            title,
            description: 'Created from canvas',
            category: 'Design',
          });
          console.log('✅ Report created successfully:', report.id);
          onReportChange?.(report.id);
        } catch (error) {
          console.error('❌ Failed to create report:', error);
          alert(`Failed to create report: ${error}`);
        }
      }
    } else {
      const description = prompt('Version description (optional):');
      try {
        console.log('💾 Saving new version with description:', description);
        await canvasIntegration.saveVersion(description || undefined, false);
        console.log('✅ Version saved successfully');
      } catch (error) {
        console.error('❌ Failed to save version:', error);
        alert(`Failed to save: ${error}`);
      }
    }
  };

  const handleLoadVersion = async (version: ReportVersion) => {
    try {
      await canvasIntegration.loadVersion(version);
      setShowVersionHistory(false);
    } catch (error) {
      alert(`Failed to load version: ${error}`);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    console.log('Version deleted:', versionId);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowReportsMenu(false);
      }
    };

    if (showReportsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReportsMenu]);

  // Common actions available for all states
  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleSelectAll = () => {
    selectAll();
  };

  const handlePaste = () => {
    paste();
  };

  // Selection-based actions
  const handleFlipHorizontal = () => {
    if (!hasSelection) return;
    transformElements(selection, { scaleX: -1 });
  };

  const handleFlipVertical = () => {
    if (!hasSelection) return;
    transformElements(selection, { scaleY: -1 });
  };

  const handleDuplicate = () => {
    if (!hasSelection) return;
    duplicateElements(selection);
  };

  const handleDelete = () => {
    if (!hasSelection) return;
    deleteElements(selection);
  };

  const handleBringToFront = () => {
    if (!hasSelection) return;
    selection.forEach(id => moveToFront(id));
  };

  const handleSendToBack = () => {
    if (!hasSelection) return;
    selection.forEach(id => moveToBack(id));
  };

  const handleCopy = () => {
    if (!hasSelection) return;
    copySelection();
  };

  const handleCut = () => {
    if (!hasSelection) return;
    cutSelection();
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  // Element-specific actions
  const handleTextSpecificAction = () => {
    // Text-specific actions like font formatting, text alignment, etc.
    console.log('Text-specific action for elements:', selectedElements.filter(el => el.type === 'text'));
  };

  const handleImageSpecificAction = () => {
    // Image-specific actions like filters, crop, remove background, etc.
    console.log('Image-specific action for elements:', selectedElements.filter(el => el.type === 'image'));
  };

  const handleShapeSpecificAction = () => {
    // Shape-specific actions like fill, stroke, effects, etc.
    console.log('Shape-specific action for elements:', selectedElements.filter(el => el.type === 'shape'));
  };

  const handleEffects = () => {
    console.log('Apply effects to selected elements:', selectedElements);
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    console.log(`Align ${alignment} for selected elements:`, selectedElements);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    console.log(`Distribute ${direction} for selected elements:`, selectedElements);
  };

  // Render context-sensitive action buttons
  const renderContextActions = () => {
    if (!hasSelection) {
      // Default state - common canvas actions
      return (
        <>
          <Button
            icon="select"
            text="Select All"
            minimal
            small
            onClick={handleSelectAll}
            style={{ fontSize: '11px', minWidth: '70px' }}
          />
          <Button
            icon="duplicate"
            text="Paste"
            minimal
            small
            onClick={handlePaste}
            disabled={clipboard.length === 0}
            style={{ fontSize: '11px', minWidth: '50px' }}
          />
        </>
      );
    }

    const commonActions = (
      <>
        <Button
          icon="duplicate"
          text="Duplicate"
          minimal
          small
          onClick={handleDuplicate}
          style={{ fontSize: '11px', minWidth: '70px' }}
        />
        <Button
          icon="delete"
          text="Delete"
          minimal
          small
          onClick={handleDelete}
          style={{ fontSize: '11px', minWidth: '55px' }}
        />
        <Divider />
        <Button
          icon="swap-horizontal"
          text="Flip H"
          minimal
          small
          onClick={handleFlipHorizontal}
          style={{ fontSize: '11px', minWidth: '50px' }}
        />
        <Button
          icon="swap-vertical"
          text="Flip V"
          minimal
          small
          onClick={handleFlipVertical}
          style={{ fontSize: '11px', minWidth: '50px' }}
        />
      </>
    );

    // Element-specific actions based on primary type
    let specificActions = null;
    
    switch (primaryType) {
      case 'text':
        specificActions = (
          <>
            <Divider />
            <Button
              icon="font"
              text="Font"
              minimal
              small
              onClick={handleTextSpecificAction}
              style={{ fontSize: '11px', minWidth: '45px' }}
            />
            <Button
              icon="align-left"
              text="Align"
              minimal
              small
              onClick={() => handleAlign('left')}
              style={{ fontSize: '11px', minWidth: '50px' }}
            />
          </>
        );
        break;
        
      case 'image':
        specificActions = (
          <>
            <Divider />
            <Button
              icon="media"
              text="Effects"
              minimal
              small
              onClick={handleImageSpecificAction}
              style={{ fontSize: '11px', minWidth: '55px' }}
            />
            <Button
              icon="clean"
              text="Remove BG"
              minimal
              small
              onClick={() => console.log('Remove background')}
              style={{ fontSize: '11px', minWidth: '80px' }}
            />
          </>
        );
        break;
        
      case 'shape':
        specificActions = (
          <>
            <Divider />
            <Button
              icon="style"
              text="Fill"
              minimal
              small
              onClick={handleShapeSpecificAction}
              style={{ fontSize: '11px', minWidth: '40px' }}
            />
            <Button
              icon="path"
              text="Stroke"
              minimal
              small
              onClick={() => console.log('Edit stroke')}
              style={{ fontSize: '11px', minWidth: '50px' }}
            />
          </>
        );
        break;
    }

    // Layer actions for multi-selection or complex arrangements
    const layerActions = (
      <>
        <Divider />
        <Button
          icon="bring-data"
          text="Front"
          minimal
          small
          onClick={handleBringToFront}
          style={{ fontSize: '11px', minWidth: '45px' }}
        />
        <Button
          icon="send-to"
          text="Back"
          minimal
          small
          onClick={handleSendToBack}
          style={{ fontSize: '11px', minWidth: '45px' }}
        />
      </>
    );

    return (
      <>
        <Button
          icon="cross"
          text="Clear"
          minimal
          small
          onClick={handleClearSelection}
          style={{ fontSize: '11px', minWidth: '50px' }}
        />
        <Divider />
        {commonActions}
        {specificActions}
        {layerActions}
      </>
    );
  };

  return (
    <>
    <Navbar
      className={`bp5-dark canvas-top-bar ${className || ''}`}
      style={{
        backgroundColor: '#2f343c',
        borderBottom: '1px solid #495563',
        height: '36px',
        minHeight: '36px',
        boxShadow: 'none',
        padding: '0 12px',
        zIndex: 1000,
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Navbar.Group align="left">
        <ButtonGroup minimal>
          <Button
            icon="undo"
            text="Undo"
            minimal
            small
            disabled={!canUndo()}
            onClick={handleUndo}
            style={{ fontSize: '11px', minWidth: '50px' }}
          />
          <Button
            icon="redo"
            text="Redo"
            minimal
            small
            disabled={!canRedo()}
            onClick={handleRedo}
            style={{ fontSize: '11px', minWidth: '50px' }}
          />
          <Divider />
          <Button
            icon="duplicate"
            text="Copy"
            minimal
            small
            disabled={!hasSelection}
            onClick={handleCopy}
            style={{ fontSize: '11px', minWidth: '45px' }}
          />
          <Button
            icon="cut"
            text="Cut"
            minimal
            small
            disabled={!hasSelection}
            onClick={handleCut}
            style={{ fontSize: '11px', minWidth: '40px' }}
          />
        </ButtonGroup>
      </Navbar.Group>
      
      <Navbar.Group align="center" style={{ flex: 1 }}>
        <ButtonGroup minimal>
          {renderContextActions()}
        </ButtonGroup>
      </Navbar.Group>
      
      <Navbar.Group align="right" style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
        {/* Save Status Indicator */}
        <SaveStatusIndicator
          isSaving={canvasIntegration.autoSave.isSaving || canvasIntegration.isSavingVersion}
          lastSaved={canvasIntegration.autoSave.lastSaved}
          error={canvasIntegration.lastError || canvasIntegration.autoSave.error}
          hasPendingChanges={canvasIntegration.autoSave.hasPendingChanges || canvasIntegration.hasUnsavedChanges}
          saveCount={canvasIntegration.autoSave.saveCount}
          onManualSave={handleSaveReport}
        />
        
        <Divider style={{ height: '20px' }} />
        
        {/* Reports Menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <Button
            icon="projects"
            text="Reports"
            minimal
            small
            onClick={() => setShowReportsMenu(!showReportsMenu)}
            style={{ fontSize: '11px', minWidth: '65px' }}
          />
          
          {showReportsMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: '#2f343c',
              border: '1px solid #495563',
              borderRadius: '6px',
              padding: '8px 0',
              minWidth: '160px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 1100,
            }}>
              <button
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '8px 16px',
                  textAlign: 'left',
                  color: '#a7b6c2',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={handleOpenReport}
                onMouseOver={(e) => { (e.target as HTMLElement).style.background = '#495563'; }}
                onMouseOut={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
              >
                📂 Open Report
              </button>
              <button
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '8px 16px',
                  textAlign: 'left',
                  color: '#a7b6c2',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={handleSaveReport}
                onMouseOver={(e) => { (e.target as HTMLElement).style.background = '#495563'; }}
                onMouseOut={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
              >
                💾 {canvasIntegration.hasReportOpen ? 'Save Version' : 'Save as Report'} {/* Debug: hasReportOpen=${canvasIntegration.hasReportOpen}, reportId=${canvasIntegration.currentReportId} */}
              </button>
              {canvasIntegration.hasReportOpen && (
                <button
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '8px 16px',
                    textAlign: 'left',
                    color: '#a7b6c2',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowVersionHistory(true)}
                  onMouseOver={(e) => { (e.target as HTMLElement).style.background = '#495563'; }}
                  onMouseOut={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
                >
                  📚 Version History
                </button>
              )}
            </div>
          )}
        </div>
        
        {hasSelection && (
          <>
            <Divider style={{ height: '20px' }} />
            <div style={{ 
              fontSize: '11px', 
              color: '#a7b6c2',
              padding: '0 8px',
              minWidth: '80px',
              textAlign: 'right'
            }}>
              {isMultiSelection 
                ? `${selectedElements.length} selected`
                : `${primaryType} selected`
              }
            </div>
          </>
        )}
      </Navbar.Group>
    </Navbar>
    
    {/* Version History Panel */}
    {showVersionHistory && canvasIntegration.currentReportId && (
      <div style={{ 
        position: 'fixed', 
        top: 36, 
        right: 0, 
        bottom: 0, 
        zIndex: 1500,
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        <VersionHistoryPanel
          reportId={canvasIntegration.currentReportId}
          currentVersion={canvasIntegration.currentVersion || undefined}
          onLoadVersion={handleLoadVersion}
          onDeleteVersion={handleDeleteVersion}
          onClose={() => setShowVersionHistory(false)}
        />
      </div>
    )}
    </>
  );
});