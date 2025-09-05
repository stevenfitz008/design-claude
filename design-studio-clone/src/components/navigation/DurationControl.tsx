import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, NumericInput } from '@blueprintjs/core';
import { styled } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';

interface DurationControlProps {
  duration?: number;
  onDurationChange?: (duration: number) => void;
  minDuration?: number;
  maxDuration?: number;
}

const DurationContainer = styled.div<{ theme: any }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.panelBg};
  border: 1px solid ${props => props.theme.colors.borderColor};
  border-radius: 6px;
  padding: 4px 8px;
  min-width: 120px;
`;

const DurationInput = styled(NumericInput)<{ theme: any }>`
  .bp4-input {
    background-color: transparent !important;
    border: none !important;
    color: ${props => props.theme.colors.textPrimary} !important;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    min-width: 50px;
    padding: 2px 4px !important;
    height: 24px !important;
    
    &:focus {
      box-shadow: none !important;
      background-color: ${props => props.theme.colors.hoverBg} !important;
    }
  }
  
  .bp4-button-group.bp4-vertical > .bp4-button {
    height: 12px !important;
    min-height: 12px !important;
    padding: 0 4px !important;
    min-width: 16px !important;
  }
`;

const UnitLabel = styled.span<{ theme: any }>`
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 500;
`;

export const DurationControl: React.FC<DurationControlProps> = observer(({
  duration = 5.0,
  onDurationChange,
  minDuration = 0.1,
  maxDuration = 30.0
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const handleDurationChange = (valueAsNumber: number) => {
    if (isNaN(valueAsNumber)) return;
    const clampedValue = Math.max(minDuration, Math.min(maxDuration, valueAsNumber));
    onDurationChange?.(clampedValue);
  };

  const formatDuration = (value: number): string => {
    return `${value.toFixed(1)}s`;
  };

  return (
    <DurationContainer theme={theme}>
      <DurationInput
        theme={theme}
        value={duration}
        onValueChange={handleDurationChange}
        min={minDuration}
        max={maxDuration}
        stepSize={0.1}
        majorStepSize={1.0}
        selectAllOnFocus
        fill={false}
        buttonPosition="right"
        clampValueOnBlur
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        placeholder="5.0"
      />
      {!isEditing && <UnitLabel theme={theme}>s</UnitLabel>}
    </DurationContainer>
  );
});