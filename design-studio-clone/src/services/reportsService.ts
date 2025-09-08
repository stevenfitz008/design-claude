// Removed axios dependency - using authService.authenticatedFetch for all API calls
import { authService } from './authService';

// Backend API URL configuration
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:3001/api/v1';

console.log('🔧 ReportsService Configuration:', {
  BACKEND_API_URL,
  env: import.meta.env.VITE_BACKEND_API_URL
});

// Type definitions for Reports
export interface Report {
  id: string;
  title: string;
  description?: string;
  author: string;
  tags: string[];
  category: string;
  version: number;
  isPublished: boolean;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  pageCount?: number;
  thumbnail?: string;
}

export interface CreateReportRequest {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateReportRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface ReportSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  isPublic?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Backend API response format (what we actually receive)
export interface BackendReportListResponse {
  data: Report[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportStats {
  totalReports: number;
  publishedReports: number;
  draftReports: number;
  publicReports: number;
  privateReports: number;
  totalPages: number;
  recentActivity: {
    date: string;
    count: number;
  }[];
}

// Canvas integration types
export interface CanvasState {
  elements: any[];
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showGuides: boolean;
  snapToGuides: boolean;
}

export interface SaveCanvasStateRequest {
  canvasState: CanvasState;
  changeDescription?: string;
  autoSaved?: boolean;
  thumbnail?: string; // Base64 encoded thumbnail image
}

export interface ReportVersion {
  id: string;
  reportId: string;
  version: number;
  canvasState: CanvasState;
  changeDescription?: string;
  autoSaved: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundColor?: string;
  elementCount: number;
  createdAt: string;
  createdBy: string;
}

export interface OpenReportResponse {
  reportId: string;
  canvasState: CanvasState;
  version: number;
  versionId: string | null;
}

class ReportsService {
  private handleApiError(error: any, response?: Response): never {
    console.error('Reports API error:', error);
    
    if (response?.status === 401) {
      throw new Error('Authentication required. Please log in.');
    } else if (response?.status === 403) {
      throw new Error('Access forbidden. You do not have permission.');
    } else if (response?.status === 404) {
      throw new Error('Report not found.');
    } else if (response?.status === 409) {
      throw new Error('Report with this name already exists.');
    } else if (response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`API request failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Create new report
  async createReport(data: CreateReportRequest): Promise<Report> {
    try {
      console.log('🎯 Creating report:', data);
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const reportData: Report = await response.json();
      
      console.log('✅ Report created successfully:', reportData);
      return reportData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get reports list with filtering and pagination
  async getReports(params: ReportSearchParams = {}): Promise<ReportListResponse> {
    try {
      const defaultParams: ReportSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      };

      const searchParams = { ...defaultParams, ...params };
      
      // Clean undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, value]) => value !== undefined)
      );

      console.log('🔍 Fetching reports with params:', cleanParams);

      const queryParams = new URLSearchParams();
      Object.entries(cleanParams).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await authService.authenticatedFetch(
        `${BACKEND_API_URL}/reports?${queryParams.toString()}`
      );

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const backendData: BackendReportListResponse = await response.json();

      // Transform backend response to match frontend interface
      const reports = backendData.data || [];
      const totalPages = Math.ceil((backendData.total || 0) / (backendData.pageSize || 1));
      const safeData: ReportListResponse = {
        reports: reports,
        total: backendData.total || 0,
        page: backendData.page || 1,
        limit: backendData.pageSize || 20,
        totalPages: totalPages
      };

      console.log('✅ Reports fetched successfully:', {
        count: reports.length,
        total: safeData.total
      });

      return safeData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get user report statistics
  async getReportStats(): Promise<ReportStats> {
    try {
      console.log('📊 Fetching report statistics...');
      
      const response = await authService.authenticatedFetch(
        `${BACKEND_API_URL}/reports/stats`
      );

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const data: ReportStats = await response.json();
      
      console.log('✅ Report stats fetched successfully:', data);
      return data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get specific report by ID
  async getReport(id: string, includePages = false): Promise<Report> {
    try {
      console.log('🎯 Fetching report:', { id, includePages });
      
      const queryParams = new URLSearchParams();
      if (includePages) {
        queryParams.append('includePages', 'true');
      }
      
      const response = await authService.authenticatedFetch(
        `${BACKEND_API_URL}/reports/${id}?${queryParams.toString()}`
      );

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const reportData: Report = await response.json();
      
      console.log('✅ Report fetched successfully:', reportData);
      return reportData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update report
  async updateReport(id: string, data: UpdateReportRequest): Promise<Report> {
    try {
      console.log('📝 Updating report:', { id, data });
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const reportData: Report = await response.json();
      
      console.log('✅ Report updated successfully:', reportData);
      return reportData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete report
  async deleteReport(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting report:', id);
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }
      
      console.log('✅ Report deleted successfully');
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Duplicate report
  async duplicateReport(id: string, newTitle?: string): Promise<Report> {
    try {
      console.log('📋 Duplicating report:', { id, newTitle });
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/reports/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const reportData: Report = await response.json();
      
      console.log('✅ Report duplicated successfully:', reportData);
      return reportData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Publish/unpublish report
  async togglePublishReport(id: string, isPublished: boolean): Promise<Report> {
    try {
      console.log('📢 Toggling report publish status:', { id, isPublished });
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/reports/${id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished }),
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const reportData: Report = await response.json();
      
      console.log('✅ Report publish status updated:', reportData);
      return reportData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Change report visibility (public/private)
  async setReportVisibility(id: string, isPublic: boolean): Promise<Report> {
    try {
      console.log('👁️ Setting report visibility:', { id, isPublic });
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/reports/${id}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic }),
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const reportData: Report = await response.json();
      
      console.log('✅ Report visibility updated:', reportData);
      return reportData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Health check for reports service
  async isReportsHealthy(): Promise<boolean> {
    try {
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/reports/health/status`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.healthy === true;
    } catch {
      return false;
    }
  }

  // Canvas integration methods

  // Save canvas state as new version
  async saveCanvasVersion(reportId: string, data: SaveCanvasStateRequest): Promise<ReportVersion> {
    try {
      console.log('💾 Saving canvas version for report:', reportId);
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/design-system/reports/${reportId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const versionData: ReportVersion = await response.json();
      
      console.log('✅ Canvas version saved successfully:', versionData);
      return versionData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Auto-save canvas state (optimized for frequent saves)
  async autoSaveCanvas(reportId: string, canvasState: CanvasState): Promise<ReportVersion> {
    try {
      console.log('🔄 Auto-saving canvas for report:', reportId);
      
      const response = await authService.authenticatedFetch(`${BACKEND_API_URL}/design-system/reports/${reportId}/auto-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canvasState,
          changeDescription: 'Auto-save',
          autoSaved: true,
        }),
      });

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const versionData: ReportVersion = await response.json();
      
      console.log('✅ Auto-save completed:', versionData.version);
      return versionData;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Load report into canvas
  async openReportInCanvas(reportId: string, versionId?: string): Promise<OpenReportResponse> {
    try {
      console.log('📂 Loading report into canvas:', { reportId, versionId });
      
      const queryParams = new URLSearchParams();
      if (versionId) {
        queryParams.append('versionId', versionId);
      }
      
      const response = await authService.authenticatedFetch(
        `${BACKEND_API_URL}/design-system/reports/${reportId}/open?${queryParams.toString()}`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const data: OpenReportResponse = await response.json();
      
      console.log('✅ Report loaded into canvas successfully:', data);
      return data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get all versions of a report
  async getReportVersions(reportId: string): Promise<ReportVersion[]> {
    try {
      console.log('📋 Fetching report versions:', reportId);
      
      const response = await authService.authenticatedFetch(
        `${BACKEND_API_URL}/design-system/reports/${reportId}/versions`
      );

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const versions: ReportVersion[] = await response.json();
      
      console.log('✅ Report versions fetched:', versions.length);
      return versions;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get specific version of a report
  async getReportVersion(reportId: string, versionId: string): Promise<ReportVersion> {
    try {
      console.log('🔍 Fetching specific version:', { reportId, versionId });
      
      const response = await authService.authenticatedFetch(
        `${BACKEND_API_URL}/design-system/reports/${reportId}/versions/${versionId}`
      );

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }

      const version: ReportVersion = await response.json();
      
      console.log('✅ Report version fetched successfully:', version);
      return version;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete a specific version
  async deleteReportVersion(reportId: string, versionId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting report version:', { reportId, versionId });
      
      const response = await authService.authenticatedFetch(
        `${BACKEND_API_URL}/design-system/reports/${reportId}/versions/${versionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        this.handleApiError(new Error(`HTTP ${response.status}`), response);
      }
      
      console.log('✅ Report version deleted successfully');
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Canvas state utilities
  
  // Check if canvas state has significant changes (for smart auto-save)
  hasSignificantChanges(oldState: CanvasState | null, newState: CanvasState): boolean {
    if (!oldState) return true;
    
    // Check element count change
    if (oldState.elements.length !== newState.elements.length) {
      return true;
    }
    
    // Check canvas size change
    if (oldState.canvasSize.width !== newState.canvasSize.width || 
        oldState.canvasSize.height !== newState.canvasSize.height) {
      return true;
    }
    
    // Check background color change
    if (oldState.backgroundColor !== newState.backgroundColor) {
      return true;
    }
    
    // Check for element modifications (basic comparison)
    try {
      const oldElementIds = oldState.elements.map(el => el.id).sort();
      const newElementIds = newState.elements.map(el => el.id).sort();
      
      if (JSON.stringify(oldElementIds) !== JSON.stringify(newElementIds)) {
        return true;
      }
    } catch {
      return true; // Assume change if comparison fails
    }
    
    return false;
  }
  
  // Generate canvas state summary for version descriptions
  generateCanvasStateSummary(canvasState: CanvasState): string {
    const elementCount = canvasState.elements?.length || 0;
    const { width, height } = canvasState.canvasSize || { width: 0, height: 0 };
    
    return `${elementCount} elements • ${width}×${height} canvas`;
  }

  // Utility methods
  formatReportTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  validateReportData(data: CreateReportRequest | UpdateReportRequest): string[] {
    const errors: string[] = [];
    
    if ('title' in data && data.title) {
      if (data.title.length < 3) {
        errors.push('Title must be at least 3 characters long');
      }
      if (data.title.length > 100) {
        errors.push('Title must be less than 100 characters');
      }
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    if (data.tags && data.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    return errors;
  }

  // Search utilities
  buildSearchParams(filters: {
    search?: string;
    category?: string;
    tags?: string[];
    published?: boolean;
    public?: boolean;
  }): ReportSearchParams {
    return {
      search: filters.search?.trim() || undefined,
      category: filters.category || undefined,
      tags: filters.tags?.length ? filters.tags : undefined,
      isPublished: filters.published,
      isPublic: filters.public,
    };
  }

  // Version management utilities
  
  // Format version display info
  formatVersionInfo(version: ReportVersion): string {
    const date = new Date(version.createdAt).toLocaleString();
    const type = version.autoSaved ? 'Auto-save' : 'Manual save';
    const description = version.changeDescription || 'No description';
    
    return `v${version.version} • ${type} • ${description} • ${date}`;
  }
  
  // Get version age in human-readable format
  getVersionAge(createdAt: string): string {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(createdAt).toLocaleDateString();
  }
}

export const reportsService = new ReportsService();
export default reportsService;

// Export canvas integration types for use in components
export type {
  CanvasState,
  SaveCanvasStateRequest,
  ReportVersion,
  OpenReportResponse,
};