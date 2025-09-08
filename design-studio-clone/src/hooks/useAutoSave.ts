import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { reportsService, type CanvasState } from '../services/reportsService';

interface UseAutoSaveOptions {
  reportId?: string;
  enabled?: boolean;
  interval?: number; // milliseconds
  onSave?: (version: any) => void;
  onError?: (error: Error) => void;
}

interface AutoSaveStatus {
  isEnabled: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  saveCount: number;
}

export const useAutoSave = (options: UseAutoSaveOptions = {}) => {
  const {
    reportId,
    enabled = true,
    interval = 30000, // 30 seconds
    onSave,
    onError,
  } = options;

  // Canvas store state
  const canvasState = useCanvasStore((state) => ({
    elements: state.elements,
    canvasSize: state.canvasSize,
    backgroundColor: state.backgroundColor,
    zoom: state.zoom,
    pan: state.pan,
    showGrid: state.showGrid,
    gridSize: state.gridSize,
    snapToGrid: state.snapToGrid,
    showGuides: state.showGuides,
    snapToGuides: state.snapToGuides,
  }));

  // Auto-save status
  const statusRef = useRef<AutoSaveStatus>({
    isEnabled: enabled,
    isSaving: false,
    lastSaved: null,
    error: null,
    saveCount: 0,
  });

  // Previous state for change detection
  const previousStateRef = useRef<CanvasState | null>(null);
  
  // Auto-save timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pending changes flag
  const pendingChangesRef = useRef(false);

  // Save function
  const saveCanvasState = useCallback(async () => {
    if (!reportId || statusRef.current.isSaving) {
      return;
    }

    try {
      statusRef.current.isSaving = true;
      statusRef.current.error = null;

      console.log('🔄 Auto-saving canvas state...');
      
      const version = await reportsService.autoSaveCanvas(reportId, canvasState);
      
      statusRef.current.lastSaved = new Date();
      statusRef.current.saveCount += 1;
      statusRef.current.isSaving = false;
      pendingChangesRef.current = false;
      
      // Update previous state
      previousStateRef.current = { ...canvasState };

      console.log('✅ Auto-save completed successfully');
      onSave?.(version);
      
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      statusRef.current.error = error as Error;
      statusRef.current.isSaving = false;
      onError?.(error as Error);
    }
  }, [reportId, canvasState, onSave, onError]);

  // Manual save function
  const saveNow = useCallback(async (description?: string) => {
    if (!reportId || statusRef.current.isSaving) {
      return null;
    }

    try {
      statusRef.current.isSaving = true;
      statusRef.current.error = null;

      console.log('💾 Manual save triggered...');
      
      const version = await reportsService.saveCanvasVersion(reportId, {
        canvasState,
        changeDescription: description || 'Manual save',
        autoSaved: false,
      });
      
      statusRef.current.lastSaved = new Date();
      statusRef.current.saveCount += 1;
      statusRef.current.isSaving = false;
      pendingChangesRef.current = false;
      
      // Update previous state
      previousStateRef.current = { ...canvasState };
      
      console.log('✅ Manual save completed successfully');
      onSave?.(version);
      
      return version;
      
    } catch (error) {
      console.error('❌ Manual save failed:', error);
      statusRef.current.error = error as Error;
      statusRef.current.isSaving = false;
      onError?.(error as Error);
      return null;
    }
  }, [reportId, canvasState, onSave, onError]);

  // Check for significant changes
  const hasSignificantChanges = useCallback(() => {
    if (!previousStateRef.current) {
      return true;
    }
    
    return reportsService.hasSignificantChanges(previousStateRef.current, canvasState);
  }, [canvasState]);

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!statusRef.current.isEnabled || !reportId) {
      return;
    }
    
    timerRef.current = setTimeout(() => {
      if (pendingChangesRef.current && hasSignificantChanges()) {
        saveCanvasState();
      }
    }, interval);
  }, [reportId, interval, hasSignificantChanges, saveCanvasState]);

  // Handle canvas state changes
  useEffect(() => {
    if (!statusRef.current.isEnabled || !reportId) {
      return;
    }

    // Mark changes as pending
    if (hasSignificantChanges()) {
      pendingChangesRef.current = true;
      console.log('🔄 Canvas changes detected, scheduling auto-save...');
      scheduleAutoSave();
    }
  }, [canvasState, reportId, hasSignificantChanges, scheduleAutoSave]);

  // Update enabled status
  useEffect(() => {
    statusRef.current.isEnabled = enabled && !!reportId;
    
    if (!statusRef.current.isEnabled && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [enabled, reportId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (pendingChangesRef.current && statusRef.current.isEnabled && reportId) {
        // Fire and forget save on unmount
        reportsService.autoSaveCanvas(reportId, canvasState).catch(console.error);
      }
    };
  }, [reportId, canvasState]);

  return {
    // Status
    isEnabled: statusRef.current.isEnabled,
    isSaving: statusRef.current.isSaving,
    lastSaved: statusRef.current.lastSaved,
    error: statusRef.current.error,
    saveCount: statusRef.current.saveCount,
    hasPendingChanges: pendingChangesRef.current,
    
    // Actions
    saveNow,
    enable: () => {
      statusRef.current.isEnabled = true;
      statusRef.current.error = null;
    },
    disable: () => {
      statusRef.current.isEnabled = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    clearError: () => {
      statusRef.current.error = null;
    },
    
    // Utilities
    getTimeSinceLastSave: () => {
      if (!statusRef.current.lastSaved) return null;
      return Date.now() - statusRef.current.lastSaved.getTime();
    },
    
    getFormattedLastSaved: () => {
      if (!statusRef.current.lastSaved) return 'Never';
      
      const now = Date.now();
      const lastSaved = statusRef.current.lastSaved.getTime();
      const diffMinutes = Math.floor((now - lastSaved) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes === 1) return '1 minute ago';
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      return statusRef.current.lastSaved.toLocaleString();
    },
  };
};

export default useAutoSave;