import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Backend API URL configuration
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:3001/api/v1';

// Type definitions for Pages
export interface ReportPage {
  id: string;
  reportId: string;
  title: string;
  description?: string;
  order: number;
  layoutType: 'flexible' | 'grid' | 'fixed' | 'responsive';
  columns: number;
  width: number;
  height: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  componentCount?: number;
  thumbnail?: string;
}

export interface CreatePageRequest {
  reportId: string;
  title: string;
  description?: string;
  layoutType?: 'flexible' | 'grid' | 'fixed' | 'responsive';
  columns?: number;
  width?: number;
  height?: number;
}

export interface UpdatePageRequest {
  title?: string;
  description?: string;
  layoutType?: 'flexible' | 'grid' | 'fixed' | 'responsive';
  columns?: number;
  width?: number;
  height?: number;
}

export interface ReorderPageRequest {
  reportId: string;
  newOrder: number;
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  componentVersion: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  props: Record<string, any>;
  isVisible: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddComponentRequest {
  componentId: string;
  componentVersion: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  props?: Record<string, any>;
  isVisible?: boolean;
  isLocked?: boolean;
}

export interface UpdateComponentInstanceRequest {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  props?: Record<string, any>;
  isVisible?: boolean;
  isLocked?: boolean;
}

export interface PageSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  layoutType?: string;
  sortBy?: 'order' | 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  includeComponents?: boolean;
}

export interface PageListResponse {
  pages: ReportPage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PageStats {
  totalPages: number;
  pagesByLayout: {
    layoutType: string;
    count: number;
  }[];
  averageComponentsPerPage: number;
  recentActivity: {
    date: string;
    count: number;
  }[];
}

class PagesService {
  private client = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  private handleApiError(error: any): never {
    console.error('Pages API error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. You do not have permission.');
    } else if (error.response?.status === 404) {
      throw new Error('Page not found.');
    } else if (error.response?.status === 409) {
      throw new Error('Page order conflict. Please refresh and try again.');
    } else if (error.response?.status === 422) {
      throw new Error('Invalid page data. Please check your inputs.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else {
      throw new Error(`API request failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Create new page
  async createPage(data: CreatePageRequest): Promise<ReportPage> {
    try {
      console.log('📄 Creating page:', data);
      
      const response: AxiosResponse<ReportPage> = await this.client.post('/pages', data);
      
      console.log('✅ Page created successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get pages for a specific report
  async getReportPages(reportId: string, params: PageSearchParams = {}): Promise<PageListResponse> {
    try {
      const defaultParams: PageSearchParams = {
        page: 1,
        limit: 50, // Pages are typically fewer than photos
        sortBy: 'order',
        sortOrder: 'asc',
        includeComponents: false,
      };

      const searchParams = { ...defaultParams, ...params };
      
      // Clean undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, value]) => value !== undefined)
      );

      console.log('📄 Fetching pages for report:', { reportId, params: cleanParams });

      const response: AxiosResponse<PageListResponse> = await this.client.get(`/pages/report/${reportId}`, {
        params: cleanParams,
      });

      console.log('✅ Pages fetched successfully:', {
        count: response.data.pages.length,
        total: response.data.total
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get all pages with filtering
  async getPages(params: PageSearchParams = {}): Promise<PageListResponse> {
    try {
      const defaultParams: PageSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        includeComponents: false,
      };

      const searchParams = { ...defaultParams, ...params };
      
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, value]) => value !== undefined)
      );

      console.log('📄 Fetching pages with params:', cleanParams);

      const response: AxiosResponse<PageListResponse> = await this.client.get('/pages', {
        params: cleanParams,
      });

      console.log('✅ Pages fetched successfully:', {
        count: response.data.pages.length,
        total: response.data.total
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get page statistics
  async getPageStats(): Promise<PageStats> {
    try {
      console.log('📊 Fetching page statistics...');
      
      const response: AxiosResponse<PageStats> = await this.client.get('/pages/stats');
      
      console.log('✅ Page stats fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get specific page by ID
  async getPage(id: string, includeComponents = false): Promise<ReportPage & { components?: ComponentInstance[] }> {
    try {
      console.log('📄 Fetching page:', { id, includeComponents });
      
      const response: AxiosResponse<ReportPage & { components?: ComponentInstance[] }> = await this.client.get(`/pages/${id}`, {
        params: { includeComponents },
      });
      
      console.log('✅ Page fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update page
  async updatePage(id: string, data: UpdatePageRequest): Promise<ReportPage> {
    try {
      console.log('📝 Updating page:', { id, data });
      
      const response: AxiosResponse<ReportPage> = await this.client.put(`/pages/${id}`, data);
      
      console.log('✅ Page updated successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete page
  async deletePage(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting page:', id);
      
      await this.client.delete(`/pages/${id}`);
      
      console.log('✅ Page deleted successfully');
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Duplicate page
  async duplicatePage(id: string, newTitle?: string): Promise<ReportPage> {
    try {
      console.log('📋 Duplicating page:', { id, newTitle });
      
      const response: AxiosResponse<ReportPage> = await this.client.post(`/pages/${id}/duplicate`, {
        title: newTitle,
      });
      
      console.log('✅ Page duplicated successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Reorder page within report
  async reorderPage(id: string, data: ReorderPageRequest): Promise<ReportPage> {
    try {
      console.log('🔄 Reordering page:', { id, data });
      
      const response: AxiosResponse<ReportPage> = await this.client.put(`/pages/reports/${data.reportId}/reorder`, {
        pageId: id,
        newOrder: data.newOrder,
      });
      
      console.log('✅ Page reordered successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Add component to page
  async addComponentToPage(pageId: string, data: AddComponentRequest): Promise<ComponentInstance> {
    try {
      console.log('🧩 Adding component to page:', { pageId, data });
      
      const response: AxiosResponse<ComponentInstance> = await this.client.post(`/pages/${pageId}/components`, data);
      
      console.log('✅ Component added to page successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update component instance on page
  async updateComponentInstance(pageId: string, componentInstanceId: string, data: UpdateComponentInstanceRequest): Promise<ComponentInstance> {
    try {
      console.log('📝 Updating component instance:', { pageId, componentInstanceId, data });
      
      const response: AxiosResponse<ComponentInstance> = await this.client.put(`/pages/${pageId}/components/${componentInstanceId}`, data);
      
      console.log('✅ Component instance updated successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Remove component from page
  async removeComponentFromPage(pageId: string, componentInstanceId: string): Promise<void> {
    try {
      console.log('🗑️ Removing component from page:', { pageId, componentInstanceId });
      
      await this.client.delete(`/pages/${pageId}/components/${componentInstanceId}`);
      
      console.log('✅ Component removed from page successfully');
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Health check for pages service
  async isPagesHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/pages/health/status');
      return response.data.healthy === true;
    } catch {
      return false;
    }
  }

  // Utility methods
  formatPageTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  validatePageData(data: CreatePageRequest | UpdatePageRequest): string[] {
    const errors: string[] = [];
    
    if ('title' in data && data.title) {
      if (data.title.length < 3) {
        errors.push('Page title must be at least 3 characters long');
      }
      if (data.title.length > 100) {
        errors.push('Page title must be less than 100 characters');
      }
    }

    if (data.description && data.description.length > 300) {
      errors.push('Page description must be less than 300 characters');
    }

    if (data.columns && (data.columns < 1 || data.columns > 12)) {
      errors.push('Page columns must be between 1 and 12');
    }

    if (data.width && (data.width < 100 || data.width > 10000)) {
      errors.push('Page width must be between 100 and 10000 pixels');
    }

    if (data.height && (data.height < 100 || data.height > 10000)) {
      errors.push('Page height must be between 100 and 10000 pixels');
    }

    return errors;
  }

  // Get default page dimensions based on layout type
  getDefaultDimensions(layoutType: 'flexible' | 'grid' | 'fixed' | 'responsive') {
    const defaults = {
      flexible: { width: 1200, height: 800, columns: 1 },
      grid: { width: 1200, height: 800, columns: 3 },
      fixed: { width: 800, height: 600, columns: 1 },
      responsive: { width: 1200, height: 800, columns: 2 },
    };

    return defaults[layoutType] || defaults.flexible;
  }

  // Calculate optimal component positions to avoid overlaps
  calculateOptimalPosition(
    existingComponents: ComponentInstance[],
    newComponent: { width: number; height: number },
    pageWidth: number,
    pageHeight: number
  ): { x: number; y: number } {
    const padding = 20;
    let x = padding;
    let y = padding;

    // Simple grid-based positioning
    const rows = Math.floor(pageHeight / (newComponent.height + padding));
    const cols = Math.floor(pageWidth / (newComponent.width + padding));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const testX = col * (newComponent.width + padding) + padding;
        const testY = row * (newComponent.height + padding) + padding;

        // Check if this position overlaps with existing components
        const overlaps = existingComponents.some(comp => 
          testX < comp.x + comp.width &&
          testX + newComponent.width > comp.x &&
          testY < comp.y + comp.height &&
          testY + newComponent.height > comp.y
        );

        if (!overlaps) {
          return { x: testX, y: testY };
        }
      }
    }

    // Fallback: place at top-left with slight offset
    return { x: padding, y: padding };
  }

  // Convert page to canvas data format
  pageToCanvasData(page: ReportPage) {
    return {
      id: page.id,
      title: page.title,
      width: page.width,
      height: page.height,
      layoutType: page.layoutType,
      columns: page.columns,
      version: page.version,
      componentCount: page.componentCount || 0,
      thumbnail: page.thumbnail,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }
}

export const pagesService = new PagesService();
export default pagesService;