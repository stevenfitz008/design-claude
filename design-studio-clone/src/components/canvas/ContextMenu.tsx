import React, { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { CanvasElement } from '@/types/canvas';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  selectedElements: CanvasElement[];
  onClose: () => void;
}

interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hasSubmenu?: boolean;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, label, onClick, disabled, hasSubmenu }) => (
  <div
    className={`context-menu-item ${disabled ? 'disabled' : ''}`}
    onClick={disabled ? undefined : onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      fontSize: '14px',
      color: disabled ? '#666' : '#e0e0e0',
      backgroundColor: 'transparent',
      cursor: disabled ? 'default' : 'pointer',
      borderRadius: '4px',
      transition: 'background-color 0.15s ease',
      userSelect: 'none',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = '#404040';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    <div style={{ marginRight: '12px', display: 'flex', alignItems: 'center', fontSize: '16px' }}>
      {icon}
    </div>
    <span style={{ flex: 1 }}>{label}</span>
    {hasSubmenu && (
      <div style={{ marginLeft: '8px', fontSize: '12px' }}>▶</div>
    )}
  </div>
);

interface SubMenuProps {
  visible: boolean;
  onSelect: (action: string) => void;
}

const LayeringSubmenu: React.FC<SubMenuProps> = ({ visible, onSelect }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '100%',
        top: '0',
        minWidth: '140px',
        backgroundColor: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1001,
        padding: '4px 0',
      }}
    >
      <ContextMenuItem
        icon="⬆️"
        label="To Front"
        onClick={() => onSelect('toFront')}
      />
      <ContextMenuItem
        icon="↗️"
        label="Forward"
        onClick={() => onSelect('forward')}
      />
      <ContextMenuItem
        icon="↘️"
        label="Backward"
        onClick={() => onSelect('backward')}
      />
      <ContextMenuItem
        icon="⬇️"
        label="To Back"
        onClick={() => onSelect('toBack')}
      />
    </div>
  );
};

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  selectedElements,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showLayeringSubmenu, setShowLayeringSubmenu] = React.useState(false);
  
  const {
    updateElement,
    duplicateElement,
    duplicateElements,
    deleteElement,
    deleteElements,
    moveToFront,
    moveToBack,
    moveForward,
    moveBackward
  } = useCanvasStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [visible, onClose]);

  if (!visible || selectedElements.length === 0) {
    return null;
  }

  const isMultiSelect = selectedElements.length > 1;
  const firstElement = selectedElements[0];
  const isLocked = firstElement.locked;
  const allLocked = selectedElements.every(el => el.locked);
  const anyLocked = selectedElements.some(el => el.locked);

  const handleLockToggle = () => {
    console.log('🔒 Toggling lock for elements:', selectedElements.map(el => el.id));
    selectedElements.forEach(element => {
      updateElement(element.id, { locked: !element.locked });
    });
    onClose();
  };

  const handleDuplicate = () => {
    console.log('📋 Duplicating elements:', selectedElements.map(el => el.id));
    if (isMultiSelect) {
      duplicateElements(selectedElements.map(el => el.id));
    } else {
      duplicateElement(firstElement.id);
    }
    onClose();
  };

  const handleDelete = () => {
    console.log('🗑️ Deleting elements:', selectedElements.map(el => el.id));
    if (isMultiSelect) {
      deleteElements(selectedElements.map(el => el.id));
    } else {
      deleteElement(firstElement.id);
    }
    onClose();
  };

  const handleLayering = (action: string) => {
    console.log('📚 Layering action:', action, 'for elements:', selectedElements.map(el => el.id));
    selectedElements.forEach(element => {
      switch (action) {
        case 'toFront':
          moveToFront(element.id);
          break;
        case 'forward':
          moveForward(element.id);
          break;
        case 'backward':
          moveBackward(element.id);
          break;
        case 'toBack':
          moveToBack(element.id);
          break;
      }
    });
    setShowLayeringSubmenu(false);
    onClose();
  };

  // Calculate menu position (prevent menu from going off-screen)
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 250),
    minWidth: '180px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    padding: '4px 0',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  return (
    <div ref={menuRef} style={menuStyle}>
      {/* Lock/Unlock */}
      <ContextMenuItem
        icon={anyLocked ? "🔓" : "🔒"}
        label={anyLocked ? "Unlock" : "Lock"}
        onClick={handleLockToggle}
      />
      
      {/* Separator */}
      <div style={{ height: '1px', backgroundColor: '#444', margin: '4px 0' }} />
      
      {/* Duplicate */}
      <ContextMenuItem
        icon="📋"
        label="Duplicate"
        onClick={handleDuplicate}
      />
      
      {/* Remove */}
      <ContextMenuItem
        icon="🗑️"
        label="Remove"
        onClick={handleDelete}
      />
      
      {/* Separator */}
      <div style={{ height: '1px', backgroundColor: '#444', margin: '4px 0' }} />
      
      {/* Layering submenu */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setShowLayeringSubmenu(true)}
        onMouseLeave={() => setShowLayeringSubmenu(false)}
      >
        <ContextMenuItem
          icon="📚"
          label="Layering"
          onClick={() => setShowLayeringSubmenu(!showLayeringSubmenu)}
          hasSubmenu={true}
        />
        <LayeringSubmenu
          visible={showLayeringSubmenu}
          onSelect={handleLayering}
        />
      </div>
    </div>
  );
};

export default ContextMenu;