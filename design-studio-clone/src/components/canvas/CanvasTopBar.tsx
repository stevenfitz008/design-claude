import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button, ButtonGroup, Divider, Navbar } from '@blueprintjs/core';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement, TextElement, ImageElement, ShapeElement } from '@/types/canvas';

interface CanvasTopBarProps {
  className?: string;
}

export const CanvasTopBar: React.FC<CanvasTopBarProps> = observer(({ className }) => {
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
    canRedo
  } = useCanvasStore();
  
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
            disabled={/* TODO: check if clipboard has content */ false}
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
    <Navbar
      className={className}
      style={{
        backgroundColor: '#2f343c',
        borderBottom: '1px solid #495563',
        height: '36px',
        minHeight: '36px',
        boxShadow: 'none',
        padding: '0 12px'
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
      
      <Navbar.Group align="right">
        {hasSelection && (
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
        )}
      </Navbar.Group>
    </Navbar>
  );
});