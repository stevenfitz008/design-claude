import React, { useState, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Button,
  ButtonGroup,
  Card,
  Divider,
  H5,
  Icon,
  Menu,
  MenuItem,
  Popover,
  Dialog,
  FormGroup,
  InputGroup,
  Switch,
  Slider,
} from '@blueprintjs/core';
import { styled } from '@/styles/goober-setup';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement, GroupElement } from '@/types/canvas';

interface LayerPanelProps {
  onClose?: () => void;
}

const PanelContainer = styled('div')`
  width: 300px;
  height: 100%;
  background: var(--panel-bg);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled('div')`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LayerTree = styled('div')`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const LayerItem = styled('div')<{ selected?: boolean; depth?: number }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: pointer;
  margin-left: ${props => (props.depth || 0) * 16}px;
  background: ${props => props.selected ? 'var(--selection-bg)' : 'transparent'};
  
  &:hover {
    background: ${props => props.selected ? 'var(--selection-bg)' : 'var(--hover-bg)'};
  }
`;

const LayerIcon = styled('div')`
  width: 20px;
  height: 20px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  background: var(--icon-bg);
`;

const LayerName = styled('span')`
  flex: 1;
  font-size: 13px;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LayerControls = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${LayerItem}:hover & {
    opacity: 1;
  }
`;

const BlendModeSection = styled('div')`
  padding: 16px;
  border-top: 1px solid var(--border-color);
`;

interface LayerInfo extends CanvasElement {
  children?: LayerInfo[];
  depth: number;
  isGroup?: boolean;
}

const LayerPanel: React.FC<LayerPanelProps> = observer(({ onClose }) => {
  const { 
    elements, 
    selection, 
    selectElement, 
    selectElements,
    clearSelection,
    updateElement,
    deleteElements,
    duplicateElements,
    moveToFront,
    moveToBack,
    moveForward,
    moveBackward
  } = useCanvasStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Organize elements into a hierarchical structure
  const layerTree = useMemo(() => {
    const tree: LayerInfo[] = [];
    const groups = new Map<string, LayerInfo>();
    
    // First pass: create groups
    elements.forEach(element => {
      if (element.type === 'group') {
        const groupElement = element as GroupElement;
        const groupInfo: LayerInfo = {
          ...groupElement,
          children: [],
          depth: 0,
          isGroup: true
        };
        groups.set(element.id, groupInfo);
      }
    });
    
    // Second pass: organize elements
    elements.forEach(element => {
      if (element.type !== 'group') {
        const layerInfo: LayerInfo = {
          ...element,
          depth: element.parentId ? 1 : 0
        };
        
        if (element.parentId && groups.has(element.parentId)) {
          groups.get(element.parentId)!.children!.push(layerInfo);
        } else {
          tree.push(layerInfo);
        }
      }
    });
    
    // Add groups to tree
    groups.forEach(group => {
      tree.push(group);
    });
    
    // Sort by zIndex
    tree.sort((a, b) => b.zIndex - a.zIndex);
    tree.forEach(item => {
      if (item.children) {
        item.children.sort((a, b) => b.zIndex - a.zIndex);
      }
    });
    
    return tree;
  }, [elements]);

  const getLayerIcon = useCallback((element: LayerInfo) => {
    const iconMap: Record<string, string> = {
      text: 'font',
      image: 'media',
      shape: 'shapes',
      icon: 'symbol-diamond',
      group: 'folder-close',
      video: 'video',
      background: 'tint'
    };
    return iconMap[element.type] || 'document';
  }, []);

  const getLayerName = useCallback((element: LayerInfo) => {
    if (element.type === 'text') {
      return (element as any).text?.substring(0, 20) || 'Text Layer';
    }
    if (element.type === 'group') {
      return `Group (${element.children?.length || 0} items)`;
    }
    return `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Layer`;
  }, []);

  const handleLayerClick = useCallback((element: LayerInfo, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      selectElement(element.id, true);
    } else {
      selectElement(element.id, false);
    }
  }, [selectElement]);

  const handleVisibilityToggle = useCallback((elementId: string, visible: boolean) => {
    updateElement(elementId, { visible: !visible });
  }, [updateElement]);

  const handleLockToggle = useCallback((elementId: string, locked: boolean) => {
    updateElement(elementId, { locked: !locked });
  }, [updateElement]);

  const createGroup = useCallback(() => {
    if (selection.length < 2) return;
    
    const selectedElements = elements.filter(el => selection.includes(el.id));
    const bounds = {
      minX: Math.min(...selectedElements.map(el => el.x)),
      minY: Math.min(...selectedElements.map(el => el.y)),
      maxX: Math.max(...selectedElements.map(el => el.x + el.width)),
      maxY: Math.max(...selectedElements.map(el => el.y + el.height))
    };
    
    const groupId = `group_${Date.now()}`;
    const groupElement: GroupElement = {
      id: groupId,
      type: 'group',
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Math.max(...selectedElements.map(el => el.zIndex)) + 1,
      children: selection,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Update selected elements to have the group as parent
    selectedElements.forEach(element => {
      updateElement(element.id, { parentId: groupId });
    });
    
    // Add group to canvas
    (useCanvasStore.getState() as any).addElement(groupElement);
    
    setShowCreateGroup(false);
    setGroupName('');
  }, [elements, selection, updateElement]);

  const duplicateLayer = useCallback((elementId: string) => {
    duplicateElements([elementId]);
  }, [duplicateElements]);

  const deleteLayer = useCallback((elementId: string) => {
    deleteElements([elementId]);
  }, [deleteElements]);

  const moveLayer = useCallback((elementId: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    switch (direction) {
      case 'front':
        moveToFront(elementId);
        break;
      case 'back':
        moveToBack(elementId);
        break;
      case 'forward':
        moveForward(elementId);
        break;
      case 'backward':
        moveBackward(elementId);
        break;
    }
  }, [moveToFront, moveToBack, moveForward, moveBackward]);

  const renderLayerItem = useCallback((layer: LayerInfo): React.ReactNode => {
    const isSelected = selection.includes(layer.id);
    const isExpanded = expandedGroups.has(layer.id);
    
    return (
      <React.Fragment key={layer.id}>
        <LayerItem
          selected={isSelected}
          depth={layer.depth}
          onClick={(e) => handleLayerClick(layer, e)}
        >
          {layer.isGroup && (
            <Button
              minimal
              small
              icon={isExpanded ? 'chevron-down' : 'chevron-right'}
              onClick={(e) => {
                e.stopPropagation();
                const newExpanded = new Set(expandedGroups);
                if (isExpanded) {
                  newExpanded.delete(layer.id);
                } else {
                  newExpanded.add(layer.id);
                }
                setExpandedGroups(newExpanded);
              }}
            />
          )}
          
          <LayerIcon>
            <Icon icon={getLayerIcon(layer)} size={12} />
          </LayerIcon>
          
          <LayerName>{getLayerName(layer)}</LayerName>
          
          <LayerControls>
            <span title={layer.visible ? 'Hide' : 'Show'}>
              <Button
                minimal
                small
                icon={layer.visible ? 'eye-open' : 'eye-off'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisibilityToggle(layer.id, layer.visible);
                }}
              />
            </span>
            
            <span title={layer.locked ? 'Unlock' : 'Lock'}>
              <Button
                minimal
                small
                icon={layer.locked ? 'lock' : 'unlock'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLockToggle(layer.id, layer.locked);
                }}
              />
            </span>
            
            <Popover
              content={
                <Menu>
                  <MenuItem
                    icon="duplicate"
                    text="Duplicate"
                    onClick={() => duplicateLayer(layer.id)}
                  />
                  <MenuItem
                    icon="bring-data"
                    text="Bring to Front"
                    onClick={() => moveLayer(layer.id, 'front')}
                  />
                  <MenuItem
                    icon="send-to-back"
                    text="Send to Back"
                    onClick={() => moveLayer(layer.id, 'back')}
                  />
                  <MenuItem
                    icon="chevron-up"
                    text="Move Forward"
                    onClick={() => moveLayer(layer.id, 'forward')}
                  />
                  <MenuItem
                    icon="chevron-down"
                    text="Move Backward"
                    onClick={() => moveLayer(layer.id, 'backward')}
                  />
                  <Divider />
                  <MenuItem
                    icon="trash"
                    text="Delete"
                    intent="danger"
                    onClick={() => deleteLayer(layer.id)}
                  />
                </Menu>
              }
              placement="bottom-end"
            >
              <Button
                minimal
                small
                icon="more"
                onClick={(e) => e.stopPropagation()}
              />
            </Popover>
          </LayerControls>
        </LayerItem>
        
        {layer.isGroup && isExpanded && layer.children?.map(renderLayerItem)}
      </React.Fragment>
    );
  }, [selection, expandedGroups, getLayerIcon, getLayerName, handleLayerClick, handleVisibilityToggle, handleLockToggle, duplicateLayer, moveLayer, deleteLayer]);

  return (
    <PanelContainer>
      <PanelHeader>
        <H5>Layers</H5>
        <ButtonGroup>
          <span title="Create Group">
            <Button
              icon="folder-new"
              minimal
              small
              disabled={selection.length < 2}
              onClick={() => setShowCreateGroup(true)}
            />
          </span>
          {onClose && (
            <Button
              icon="cross"
              minimal
              small
              onClick={onClose}
            />
          )}
        </ButtonGroup>
      </PanelHeader>
      
      <LayerTree>
        {layerTree.length === 0 ? (
          <Card style={{ margin: '16px', textAlign: 'center', padding: '24px' }}>
            <Icon icon="layers" size={32} color="var(--text-muted)" />
            <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
              No layers yet. Add some elements to the canvas to see them here.
            </p>
          </Card>
        ) : (
          layerTree.map(renderLayerItem)
        )}
      </LayerTree>
      
      {/* Blend Mode Controls for Selected Elements */}
      {selection.length === 1 && (
        <BlendModeSection>
          <H5>Blend Mode</H5>
          <FormGroup label="Opacity">
            <Slider
              min={0}
              max={1}
              stepSize={0.01}
              value={elements.find(el => el.id === selection[0])?.opacity || 1}
              onChange={(value) => updateElement(selection[0], { opacity: value })}
              labelRenderer={(value) => `${Math.round(value * 100)}%`}
            />
          </FormGroup>
        </BlendModeSection>
      )}
      
      {/* Create Group Dialog */}
      <Dialog
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        title="Create Group"
        icon="folder-new"
      >
        <div className="bp5-dialog-body">
          <FormGroup label="Group Name" labelFor="group-name">
            <InputGroup
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              autoFocus
            />
          </FormGroup>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
            {selection.length} elements will be grouped together.
          </p>
        </div>
        <div className="bp5-dialog-footer">
          <div className="bp5-dialog-footer-actions">
            <Button
              onClick={() => setShowCreateGroup(false)}
            >
              Cancel
            </Button>
            <Button
              intent="primary"
              onClick={createGroup}
              disabled={selection.length < 2}
            >
              Create Group
            </Button>
          </div>
        </div>
      </Dialog>
    </PanelContainer>
  );
});

LayerPanel.displayName = 'LayerPanel';

export default LayerPanel;