import axios from 'axios';
import type { AxiosResponse } from 'axios';

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

class ReportsService {
  private client = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  private handleApiError(error: any): never {
    console.error('Reports API error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. You do not have permission.');
    } else if (error.response?.status === 404) {
      throw new Error('Report not found.');
    } else if (error.response?.status === 409) {
      throw new Error('Report with this name already exists.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else {
      throw new Error(`API request failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Create new report
  async createReport(data: CreateReportRequest): Promise<Report> {
    try {
      console.log('🎯 Creating report:', data);
      
      const response: AxiosResponse<Report> = await this.client.post('/reports', data);
      
      console.log('✅ Report created successfully:', response.data);
      return response.data;
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

      const response: AxiosResponse<ReportListResponse> = await this.client.get('/reports', {
        params: cleanParams,
      });

      console.log('✅ Reports fetched successfully:', {
        count: response.data.reports.length,
        total: response.data.total
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get user report statistics
  async getReportStats(): Promise<ReportStats> {
    try {
      console.log('📊 Fetching report statistics...');
      
      const response: AxiosResponse<ReportStats> = await this.client.get('/reports/stats');
      
      console.log('✅ Report stats fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get specific report by ID
  async getReport(id: string, includePages = false): Promise<Report> {
    try {
      console.log('🎯 Fetching report:', { id, includePages });
      
      const response: AxiosResponse<Report> = await this.client.get(`/reports/${id}`, {
        params: { includePages },
      });
      
      console.log('✅ Report fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update report
  async updateReport(id: string, data: UpdateReportRequest): Promise<Report> {
    try {
      console.log('📝 Updating report:', { id, data });
      
      const response: AxiosResponse<Report> = await this.client.put(`/reports/${id}`, data);
      
      console.log('✅ Report updated successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete report
  async deleteReport(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting report:', id);
      
      await this.client.delete(`/reports/${id}`);
      
      console.log('✅ Report deleted successfully');
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Duplicate report
  async duplicateReport(id: string, newTitle?: string): Promise<Report> {
    try {
      console.log('📋 Duplicating report:', { id, newTitle });
      
      const response: AxiosResponse<Report> = await this.client.post(`/reports/${id}/duplicate`, {
        title: newTitle,
      });
      
      console.log('✅ Report duplicated successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Publish/unpublish report
  async togglePublishReport(id: string, isPublished: boolean): Promise<Report> {
    try {
      console.log('📢 Toggling report publish status:', { id, isPublished });
      
      const response: AxiosResponse<Report> = await this.client.put(`/reports/${id}/publish`, {
        isPublished,
      });
      
      console.log('✅ Report publish status updated:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Change report visibility (public/private)
  async setReportVisibility(id: string, isPublic: boolean): Promise<Report> {
    try {
      console.log('👁️ Setting report visibility:', { id, isPublic });
      
      const response: AxiosResponse<Report> = await this.client.put(`/reports/${id}/visibility`, {
        isPublic,
      });
      
      console.log('✅ Report visibility updated:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Health check for reports service
  async isReportsHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/reports/health/status');
      return response.data.healthy === true;
    } catch {
      return false;
    }
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
}

export const reportsService = new ReportsService();
export default reportsService;