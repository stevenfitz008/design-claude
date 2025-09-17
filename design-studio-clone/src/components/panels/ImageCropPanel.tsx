import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';
import { useImageCrop } from '@/hooks/useImageCrop';
import type { ImageElement } from '@/types/canvas';

interface ImageCropPanelProps {
  selectedImageId: string;
}

export const ImageCropPanel: React.FC<ImageCropPanelProps> = observer(({ selectedImageId }) => {
  const { theme } = useTheme();
  const { elements } = useCanvasStore();
  const {
    cropMode,
    startCrop,
    finishCrop,
    cancelCrop,
    resetCrop,
    applyCropRatio
  } = useImageCrop();

  const [selectedRatio, setSelectedRatio] = useState<string>('original');

  const imageElement = elements.find(el => el.id === selectedImageId) as ImageElement;
  
  if (!imageElement || imageElement.type !== 'image') {
    return null;
  }

  const cropRatios = [
    { id: 'original', label: 'Original', ratio: 'original' as const },
    { id: 'square', label: 'Square (1:1)', ratio: 'square' as const },
    { id: 'landscape43', label: 'Landscape (4:3)', ratio: 4/3 },
    { id: 'landscape169', label: 'Landscape (16:9)', ratio: 16/9 },
    { id: 'portrait34', label: 'Portrait (3:4)', ratio: 3/4 },
    { id: 'portrait916', label: 'Portrait (9:16)', ratio: 9/16 },
  ];

  const handleCropStart = () => {
    startCrop(selectedImageId);
  };

  const handleCropRatio = (ratio: number | 'square' | 'portrait' | 'landscape' | 'original') => {
    applyCropRatio(selectedImageId, ratio);
  };

  const handleReset = () => {
    resetCrop(selectedImageId);
    setSelectedRatio('original');
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

      {!cropMode ? (
        <div>
          {/* Crop aspect ratio presets */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme.colors.textMuted,
              fontSize: '12px',
              fontWeight: '500'
            }}>
              Aspect Ratio
            </label>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {cropRatios.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => {
                    setSelectedRatio(ratio.id);
                    handleCropRatio(ratio.ratio);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    border: `1px solid ${selectedRatio === ratio.id ? theme.colors.accent : theme.colors.border}`,
                    backgroundColor: selectedRatio === ratio.id ? theme.colors.accent + '20' : theme.colors.inputBackground,
                    color: selectedRatio === ratio.id ? theme.colors.accent : theme.colors.text,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px'
          }}>
            <button
              onClick={handleCropStart}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: theme.colors.accent,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ✂️ Custom Crop
            </button>
            
            <button
              onClick={handleReset}
              style={{
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
        </div>
      ) : (
        <div>
          {/* Crop mode instructions */}
          <div style={{
            padding: '12px',
            backgroundColor: theme.colors.accent + '15',
            borderRadius: '4px',
            marginBottom: '16px',
            border: `1px solid ${theme.colors.accent}30`
          }}>
            <p style={{
              margin: '0 0 8px 0',
              color: theme.colors.text,
              fontSize: '12px',
              fontWeight: '500'
            }}>
              🎯 Crop Mode Active
            </p>
            <p style={{
              margin: 0,
              color: theme.colors.textMuted,
              fontSize: '11px',
              lineHeight: '1.4'
            }}>
              Drag the handles to adjust the crop area. Double-click inside the crop area or click "Apply" to finish.
            </p>
          </div>

          {/* Crop mode buttons */}
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={finishCrop}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '12px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#51cf66',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ✅ Apply Crop
            </button>
            
            <button
              onClick={cancelCrop}
              style={{
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
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current crop info */}
      {imageElement.cropData && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: theme.colors.inputBackground,
          borderRadius: '4px',
          border: `1px solid ${theme.colors.border}`
        }}>
          <p style={{
            margin: '0 0 4px 0',
            color: theme.colors.textMuted,
            fontSize: '10px',
            fontWeight: '500'
          }}>
            Current Crop
          </p>
          <p style={{
            margin: 0,
            color: theme.colors.text,
            fontSize: '11px',
            fontFamily: 'Monaco, monospace'
          }}>
            {Math.round(imageElement.cropData.width)}×{Math.round(imageElement.cropData.height)} 
            {imageElement.originalWidth && (
              <span style={{ color: theme.colors.textMuted }}>
                {' '}({Math.round((imageElement.cropData.width / imageElement.originalWidth) * 100)}% of original)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
});