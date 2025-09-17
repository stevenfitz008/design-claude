import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTheme } from '@/contexts/ThemeProvider';
import { useSimpleCrop } from '@/hooks/useSimpleCrop';
import type { CropPosition } from '@/utils/cropUtils';
import type { ImageElement } from '@/types/canvas';

interface SimpleCropPanelProps {
  selectedImageId: string;
}

const cropPositions: Array<{ value: CropPosition; label: string }> = [
  { value: 'left-top', label: 'Left Top' },
  { value: 'center-top', label: 'Center Top' },
  { value: 'right-top', label: 'Right Top' },
  { value: 'left-middle', label: 'Left Middle' },
  { value: 'center-middle', label: 'Center Middle' },
  { value: 'right-middle', label: 'Right Middle' },
  { value: 'left-bottom', label: 'Left Bottom' },
  { value: 'center-bottom', label: 'Center Bottom' },
  { value: 'right-bottom', label: 'Right Bottom' },
];

export const SimpleCropPanel: React.FC<SimpleCropPanelProps> = observer(({ selectedImageId }) => {
  const { theme } = useTheme();
  const { applyCropPosition, resetCropForElement } = useSimpleCrop();
  const [selectedPosition, setSelectedPosition] = useState<CropPosition>('center-middle');

  const handlePositionChange = (position: CropPosition) => {
    setSelectedPosition(position);
    applyCropPosition(selectedImageId, position);
  };

  const handleReset = () => {
    setSelectedPosition('center-middle');
    resetCropForElement(selectedImageId);
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: theme.colors.panelBackground,
      borderRadius: '6px',
      border: `1px solid ${theme.colors.border}`,
      marginBottom: '16px'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        color: theme.colors.text,
        fontSize: '14px',
        fontWeight: '600'
      }}>
        🌾 Image Crop
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: theme.colors.textMuted,
          fontSize: '12px',
          fontWeight: '500'
        }}>
          Crop Position
        </label>
        
        <select
          value={selectedPosition}
          onChange={(e) => handlePositionChange(e.target.value as CropPosition)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '12px',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.text,
            cursor: 'pointer'
          }}
        >
          {cropPositions.map((pos) => (
            <option key={pos.value} value={pos.value}>
              {pos.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '500',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: theme.colors.textMuted,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          🔄 Reset
        </button>
      </div>

      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: theme.colors.accent + '15',
        borderRadius: '4px',
        border: `1px solid ${theme.colors.accent}30`
      }}>
        <p style={{
          margin: 0,
          color: theme.colors.textMuted,
          fontSize: '11px',
          lineHeight: '1.4'
        }}>
          💡 <strong>How it works:</strong> The crop position determines which part of the image is visible when the display size doesn't match the original aspect ratio.
        </p>
      </div>
    </div>
  );
});