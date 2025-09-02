import { useState, useEffect, useCallback } from 'react';
import { ProjectData, ProjectCreateRequest, ProjectUpdateRequest } from '../types/api';
import { apiClient } from '../services/api';

interface ProjectsState {
  projects: ProjectData[];
  currentProject: ProjectData | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export const useProjects = () => {
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    },
  });

  const loadProjects = useCallback(async (page = 1, limit = 20) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await apiClient.getProjects(page, limit);
      
      setState(prev => ({
        ...prev,
        projects: page === 1 ? response.data : [...prev.projects, ...response.data],
        pagination: {
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          hasMore: response.data.length === limit,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load projects',
      }));
      throw error;
    }
  }, []);

  const loadProject = useCallback(async (id: string, includeCanvas = true) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const project = await apiClient.getProject(id, includeCanvas);
      
      setState(prev => ({
        ...prev,
        currentProject: project,
        isLoading: false,
      }));
      
      return project;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load project',
      }));
      throw error;
    }
  }, []);

  const createProject = useCallback(async (projectData: ProjectCreateRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const newProject = await apiClient.createProject(projectData);
      
      setState(prev => ({
        ...prev,
        projects: [newProject, ...prev.projects],
        currentProject: newProject,
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1,
        },
        isLoading: false,
      }));
      
      return newProject;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to create project',
      }));
      throw error;
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: ProjectUpdateRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updatedProject = await apiClient.updateProject(id, updates);
      
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === id ? updatedProject : p),
        currentProject: prev.currentProject?.id === id ? updatedProject : prev.currentProject,
        isLoading: false,
      }));
      
      return updatedProject;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to update project',
      }));
      throw error;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await apiClient.deleteProject(id);
      
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
        currentProject: prev.currentProject?.id === id ? null : prev.currentProject,
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to delete project',
      }));
      throw error;
    }
  }, []);

  const duplicateProject = useCallback(async (id: string, newName?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const duplicatedProject = await apiClient.duplicateProject(id, newName);
      
      setState(prev => ({
        ...prev,
        projects: [duplicatedProject, ...prev.projects],
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1,
        },
        isLoading: false,
      }));
      
      return duplicatedProject;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to duplicate project',
      }));
      throw error;
    }
  }, []);

  const clearCurrentProject = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentProject: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-save functionality
  const autoSave = useCallback(async (projectData: Partial<ProjectUpdateRequest>) => {
    if (state.currentProject) {
      try {
        await apiClient.updateProject(state.currentProject.id, projectData);
        // Update local state without showing loading
        setState(prev => ({
          ...prev,
          currentProject: prev.currentProject ? {
            ...prev.currentProject,
            ...projectData,
            updatedAt: new Date().toISOString(),
          } : prev.currentProject,
        }));
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Could show a toast notification here
      }
    }
  }, [state.currentProject]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    ...state,
    actions: {
      loadProjects,
      loadProject,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      clearCurrentProject,
      clearError,
      autoSave,
    },
  };
};

export default useProjects;