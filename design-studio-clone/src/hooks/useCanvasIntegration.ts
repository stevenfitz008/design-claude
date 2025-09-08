import { useCallback, useRef, useState } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { reportsService, type CanvasState, type ReportVersion, type OpenReportResponse } from '../services/reportsService';
import useAutoSave from './useAutoSave';
import { generateCanvasThumbnail, generateThumbnailFromDOM } from '../utils/canvasThumbnail';

interface UseCanvasIntegrationOptions {
  reportId?: string;
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number;
  onVersionSaved?: (version: ReportVersion) => void;
  onReportLoaded?: (response: OpenReportResponse) => void;
  onError?: (error: Error, context: string) => void;
}

interface CanvasIntegrationState {
  currentReportId: string | null;
  currentVersion: number | null;
  isLoadingReport: boolean;
  isSavingVersion: boolean;
  lastError: Error | null;
  hasUnsavedChanges: boolean;
}

export const useCanvasIntegration = (options: UseCanvasIntegrationOptions = {}) => {
  const {
    reportId,
    autoSaveEnabled = true,
    autoSaveInterval = 30000,
    onVersionSaved,
    onReportLoaded,
    onError,
  } = options;

  // Canvas store actions
  const {
    elements,
    canvasSize,
    backgroundColor,
    zoom,
    pan,
    showGrid,
    gridSize,
    snapToGrid,
    showGuides,
    snapToGuides,
    clearHistory,
    pushHistory,
    // Actions for loading state
    setCanvasSize,
    setBackgroundColor,
    addElement,
    updateElement,
    deleteElement,
  } = useCanvasStore();

  // Integration state
  const [state, setState] = useState<CanvasIntegrationState>({
    currentReportId: reportId || null,
    currentVersion: null,
    isLoadingReport: false,
    isSavingVersion: false,
    lastError: null,
    hasUnsavedChanges: false,
  });

  // Track if we're currently loading to prevent auto-save conflicts
  const isLoadingRef = useRef(false);

  // Auto-save hook
  const autoSave = useAutoSave({
    reportId: state.currentReportId || undefined,
    enabled: autoSaveEnabled && !isLoadingRef.current,
    interval: autoSaveInterval,
    onSave: (version) => {
      setState(prev => ({ ...prev, hasUnsavedChanges: false }));
      onVersionSaved?.(version);
    },
    onError: (error) => {
      setState(prev => ({ ...prev, lastError: error }));
      onError?.(error, 'auto-save');
    },
  });

  // Get current canvas state
  const getCurrentCanvasState = useCallback((): CanvasState => {
    return {
      elements: elements.map(el => ({
        ...el,
        // Ensure serializable data
        createdAt: el.createdAt || Date.now(),
        updatedAt: el.updatedAt || Date.now(),
      })),
      canvasSize,
      backgroundColor,
      zoom,
      pan,
      showGrid,
      gridSize,
      snapToGrid,
      showGuides,
      snapToGuides,
    };
  }, [elements, canvasSize, backgroundColor, zoom, pan, showGrid, gridSize, snapToGrid, showGuides, snapToGuides]);

  // Load canvas state into store
  const loadCanvasState = useCallback((canvasState: CanvasState) => {
    isLoadingRef.current = true;

    try {
      console.log('🔄 Loading canvas state:', canvasState);

      // Clear current history to prevent conflicts
      clearHistory();

      // Set canvas properties
      if (canvasState.canvasSize) {
        setCanvasSize(canvasState.canvasSize);
      }
      
      if (canvasState.backgroundColor) {
        setBackgroundColor(canvasState.backgroundColor);
      }

      // Clear current elements and load new ones
      // This is a simplified approach - in a full implementation,
      // you'd want to use a bulk update method
      const currentElements = useCanvasStore.getState().elements;
      
      // Clear existing elements
      currentElements.forEach(el => {
        deleteElement(el.id);
      });

      // Add new elements
      canvasState.elements.forEach(element => {
        addElement(element);
      });

      // Set other canvas properties
      useCanvasStore.setState({
        zoom: canvasState.zoom || 1,
        pan: canvasState.pan || { x: 0, y: 0 },
        showGrid: canvasState.showGrid || false,
        gridSize: canvasState.gridSize || 20,
        snapToGrid: canvasState.snapToGrid || false,
        showGuides: canvasState.showGuides || false,
        snapToGuides: canvasState.snapToGuides || false,
      });

      // Push initial state to history
      pushHistory('LOAD_REPORT', 'Loaded report');

      console.log('✅ Canvas state loaded successfully');
    } finally {
      isLoadingRef.current = false;
    }
  }, [clearHistory, setCanvasSize, setBackgroundColor, addElement, deleteElement, pushHistory]);

  // Open report in canvas
  const openReport = useCallback(async (reportId: string, versionId?: string) => {
    setState(prev => ({ 
      ...prev, 
      isLoadingReport: true, 
      lastError: null,
      currentReportId: reportId,
    }));

    try {
      console.log('📂 Opening report in canvas:', { reportId, versionId });

      const response = await reportsService.openReportInCanvas(reportId, versionId);

      // Load the canvas state
      loadCanvasState(response.canvasState);

      // Update integration state
      setState(prev => ({
        ...prev,
        currentReportId: reportId,
        currentVersion: response.version,
        isLoadingReport: false,
        hasUnsavedChanges: false,
      }));

      console.log('✅ Report opened successfully');
      onReportLoaded?.(response);

      return response;
    } catch (error) {
      console.error('❌ Failed to open report:', error);
      const err = error instanceof Error ? error : new Error('Failed to open report');
      
      setState(prev => ({
        ...prev,
        isLoadingReport: false,
        lastError: err,
      }));

      onError?.(err, 'open-report');
      throw err;
    }
  }, [loadCanvasState, onReportLoaded, onError]);

  // Save current canvas state as new version
  const saveVersion = useCallback(async (description?: string, autoSaved = false) => {
    if (!state.currentReportId) {
      throw new Error('No report is currently open');
    }

    setState(prev => ({ ...prev, isSavingVersion: true, lastError: null }));

    try {
      console.log('💾 Saving version:', { description, autoSaved });

      const canvasState = getCurrentCanvasState();
      
      // Generate thumbnail for non-auto-saved versions (manual saves)
      let thumbnail: string | null = null;
      if (!autoSaved) {
        console.log('🖼️ Generating thumbnail...');
        // Try DOM-based thumbnail first (more accurate), fallback to canvas state-based
        thumbnail = await generateThumbnailFromDOM({ width: 300, height: 200 });
        if (!thumbnail) {
          thumbnail = await generateCanvasThumbnail(canvasState, { width: 300, height: 200 });
        }
        if (thumbnail) {
          console.log('✅ Thumbnail generated successfully');
        } else {
          console.warn('⚠️ Failed to generate thumbnail');
        }
      }
      
      const version = await reportsService.saveCanvasVersion(state.currentReportId, {
        canvasState,
        changeDescription: description,
        autoSaved,
        thumbnail: thumbnail || undefined,
      });

      setState(prev => ({
        ...prev,
        currentVersion: version.version,
        isSavingVersion: false,
        hasUnsavedChanges: false,
      }));

      console.log('✅ Version saved successfully');
      onVersionSaved?.(version);

      return version;
    } catch (error) {
      console.error('❌ Failed to save version:', error);
      const err = error instanceof Error ? error : new Error('Failed to save version');
      
      setState(prev => ({
        ...prev,
        isSavingVersion: false,
        lastError: err,
      }));

      onError?.(err, 'save-version');
      throw err;
    }
  }, [state.currentReportId, getCurrentCanvasState, onVersionSaved, onError]);

  // Load specific version
  const loadVersion = useCallback(async (version: ReportVersion) => {
    if (!state.currentReportId) {
      throw new Error('No report is currently open');
    }

    setState(prev => ({ ...prev, isLoadingReport: true, lastError: null }));

    try {
      console.log('🔄 Loading version:', version.version);

      // Load the canvas state
      loadCanvasState(version.canvasState);

      // Update integration state
      setState(prev => ({
        ...prev,
        currentVersion: version.version,
        isLoadingReport: false,
        hasUnsavedChanges: false,
      }));

      console.log('✅ Version loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load version:', error);
      const err = error instanceof Error ? error : new Error('Failed to load version');
      
      setState(prev => ({
        ...prev,
        isLoadingReport: false,
        lastError: err,
      }));

      onError?.(err, 'load-version');
      throw err;
    }
  }, [state.currentReportId, loadCanvasState, onError]);

  // Create new report with current canvas state
  const createReportFromCanvas = useCallback(async (reportData: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) => {
    setState(prev => ({ ...prev, isSavingVersion: true, lastError: null }));

    try {
      console.log('🆕 Creating new report from canvas:', reportData);

      // First create the report
      const report = await reportsService.createReport({
        title: reportData.title,
        description: reportData.description,
        category: reportData.category || 'Design',
        tags: reportData.tags,
      });

      // Then save current canvas state as first version with thumbnail
      const canvasState = getCurrentCanvasState();
      
      // Generate thumbnail for initial version
      console.log('🖼️ Generating thumbnail for new report...');
      let thumbnail: string | null = await generateThumbnailFromDOM({ width: 300, height: 200 });
      if (!thumbnail) {
        thumbnail = await generateCanvasThumbnail(canvasState, { width: 300, height: 200 });
      }
      if (thumbnail) {
        console.log('✅ Thumbnail generated for new report');
      } else {
        console.warn('⚠️ Failed to generate thumbnail for new report');
      }
      
      const version = await reportsService.saveCanvasVersion(report.id, {
        canvasState,
        changeDescription: 'Initial version',
        autoSaved: false,
        thumbnail: thumbnail || undefined,
      });

      setState(prev => ({
        ...prev,
        currentReportId: report.id,
        currentVersion: version.version,
        isSavingVersion: false,
        hasUnsavedChanges: false,
      }));

      console.log('✅ Report created from canvas successfully');
      onVersionSaved?.(version);

      return { report, version };
    } catch (error) {
      console.error('❌ Failed to create report from canvas:', error);
      const err = error instanceof Error ? error : new Error('Failed to create report');
      
      setState(prev => ({
        ...prev,
        isSavingVersion: false,
        lastError: err,
      }));

      onError?.(err, 'create-report');
      throw err;
    }
  }, [getCurrentCanvasState, onVersionSaved, onError]);

  // Close current report
  const closeReport = useCallback(() => {
    if (state.hasUnsavedChanges) {
      const shouldClose = confirm('You have unsaved changes. Are you sure you want to close this report?');
      if (!shouldClose) {
        return false;
      }
    }

    setState({
      currentReportId: null,
      currentVersion: null,
      isLoadingReport: false,
      isSavingVersion: false,
      lastError: null,
      hasUnsavedChanges: false,
    });

    console.log('📝 Report closed');
    return true;
  }, [state.hasUnsavedChanges]);

  // Mark changes as unsaved (called when canvas changes)
  const markUnsavedChanges = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, []);

  return {
    // State
    ...state,
    
    // Auto-save status
    autoSave: {
      isEnabled: autoSave.isEnabled,
      isSaving: autoSave.isSaving,
      lastSaved: autoSave.lastSaved,
      error: autoSave.error,
      saveCount: autoSave.saveCount,
      hasPendingChanges: autoSave.hasPendingChanges,
      getFormattedLastSaved: autoSave.getFormattedLastSaved,
    },

    // Actions
    openReport,
    saveVersion,
    loadVersion,
    createReportFromCanvas,
    closeReport,
    markUnsavedChanges,
    
    // Manual save with auto-save integration
    saveNow: autoSave.saveNow,
    
    // Auto-save controls
    enableAutoSave: autoSave.enable,
    disableAutoSave: autoSave.disable,
    
    // Error handling
    clearError: () => {
      setState(prev => ({ ...prev, lastError: null }));
      autoSave.clearError();
    },
    
    // Utilities
    getCurrentCanvasState,
    hasReportOpen: !!state.currentReportId,
    canSave: !!state.currentReportId && !state.isSavingVersion,
  };
};

export default useCanvasIntegration;