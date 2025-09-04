import React from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import { useCanvasStore } from '@/stores/canvasStore';

interface VisualFeedbackProps {
  zoom: number;
}

export const VisualFeedback: React.FC<VisualFeedbackProps> = ({ zoom }) => {
  const { selection, elements, canUndo, canRedo } = useCanvasStore();

  const selectedElements = elements.filter(el => selection.includes(el.id));

  // Show selection count when multiple elements are selected
  const showSelectionCount = selection.length > 1;

  // Show action hints
  const showActionHints = selection.length > 0;

  return (
    <Group listening={false}>
      {/* Selection count indicator */}
      {showSelectionCount && (
        <Group>
          <Circle
            x={30 / zoom}
            y={30 / zoom}
            radius={16 / zoom}
            fill="#48aff0"
            stroke="#ffffff"
            strokeWidth={2 / zoom}
          />
          <Text
            x={(30 - 8) / zoom}
            y={(30 - 6) / zoom}
            text={selection.length.toString()}
            fontSize={12 / zoom}
            fill="#ffffff"
            fontStyle="bold"
          />
        </Group>
      )}

      {/* Undo/Redo availability indicators */}
      {canUndo() && (
        <Group>
          <Circle
            x={80 / zoom}
            y={30 / zoom}
            radius={12 / zoom}
            fill="#28a745"
            opacity={0.8}
          />
          <Text
            x={(80 - 6) / zoom}
            y={(30 - 4) / zoom}
            text="↶"
            fontSize={10 / zoom}
            fill="#ffffff"
          />
        </Group>
      )}

      {canRedo() && (
        <Group>
          <Circle
            x={110 / zoom}
            y={30 / zoom}
            radius={12 / zoom}
            fill="#17a2b8"
            opacity={0.8}
          />
          <Text
            x={(110 - 6) / zoom}
            y={(30 - 4) / zoom}
            text="↷"
            fontSize={10 / zoom}
            fill="#ffffff"
          />
        </Group>
      )}

      {/* Action hints for selected elements */}
      {showActionHints && (
        <Group>
          <Rect
            x={20 / zoom}
            y={(window.innerHeight - 120) / zoom}
            width={200 / zoom}
            height={80 / zoom}
            fill="#2f343c"
            stroke="#495563"
            strokeWidth={1 / zoom}
            cornerRadius={8 / zoom}
            opacity={0.9}
          />
          
          <Text
            x={30 / zoom}
            y={(window.innerHeight - 110) / zoom}
            text="Quick Actions:"
            fontSize={12 / zoom}
            fill="#f5f8fa"
            fontStyle="bold"
          />
          
          <Text
            x={30 / zoom}
            y={(window.innerHeight - 95) / zoom}
            text="Ctrl+C - Copy"
            fontSize={10 / zoom}
            fill="#a7b6c2"
          />
          
          <Text
            x={30 / zoom}
            y={(window.innerHeight - 80) / zoom}
            text="Ctrl+D - Duplicate"
            fontSize={10 / zoom}
            fill="#a7b6c2"
          />
          
          <Text
            x={30 / zoom}
            y={(window.innerHeight - 65) / zoom}
            text="Del - Delete"
            fontSize={10 / zoom}
            fill="#a7b6c2"
          />
          
          <Text
            x={120 / zoom}
            y={(window.innerHeight - 95) / zoom}
            text="Arrow Keys - Move"
            fontSize={10 / zoom}
            fill="#a7b6c2"
          />
          
          <Text
            x={120 / zoom}
            y={(window.innerHeight - 80) / zoom}
            text="Shift+Arrow - Move 10px"
            fontSize={10 / zoom}
            fill="#a7b6c2"
          />
        </Group>
      )}

      {/* Element type indicators for mixed selections */}
      {selection.length > 1 && (
        <Group>
          {/* Show icons for different element types in selection */}
          {(() => {
            const types = [...new Set(selectedElements.map(el => el.type))];
            return types.map((type, index) => (
              <Group key={type}>
                <Circle
                  x={(250 + index * 30) / zoom}
                  y={30 / zoom}
                  radius={10 / zoom}
                  fill={getTypeColor(type)}
                  opacity={0.8}
                />
                <Text
                  x={(250 + index * 30 - 4) / zoom}
                  y={(30 - 4) / zoom}
                  text={getTypeIcon(type)}
                  fontSize={8 / zoom}
                  fill="#ffffff"
                />
              </Group>
            ));
          })()}
        </Group>
      )}
    </Group>
  );
};

const getTypeColor = (type: string): string => {
  const colors = {
    'text': '#28a745',
    'icon': '#48aff0', 
    'shape': '#ffc107',
    'image': '#dc3545',
    'video': '#6610f2'
  };
  return colors[type as keyof typeof colors] || '#6c757d';
};

const getTypeIcon = (type: string): string => {
  const icons = {
    'text': 'T',
    'icon': '●',
    'shape': '◆',
    'image': '🖼',
    'video': '🎬'
  };
  return icons[type as keyof typeof icons] || '?';
};

VisualFeedback.displayName = 'VisualFeedback';