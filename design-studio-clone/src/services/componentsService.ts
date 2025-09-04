import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Backend API URL configuration
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:3001/api/v1';

// Type definitions for Components
export interface Component {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  definitionId: string;
  defaultProps: Record<string, any>;
  supportedFormats: string[];
  version: number;
  isPublished: boolean;
  tags: string[];
  isSystem: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  previewUrl?: string;
}

export interface ComponentVersion {
  id: string;
  componentId: string;
  version: number;
  definitionId: string;
  changeLog: string;
  props: Record<string, any>;
  isStable: boolean;
  isDeprecated: boolean;
  minVersion?: string;
  maxVersion?: string;
  createdBy: string;
  createdAt: string;
}

export interface ComponentDefinition {
  componentId: string;
  version: number;
  createdBy: string;
  definition: {
    id: string;
    name: string;
    type: string;
    template: {
      html?: string;
      svg?: string;
      canvas?: any[];
      styles: Record<string, any>;
    };
    propsSchema: {
      properties: Record<string, any>;
      required: string[];
    };
    rendering: {
      supportedFormats: string[];
      dependencies: string[];
      performance: Record<string, any>;
    };
    dataBinding?: Record<string, any>;
    interactions?: Record<string, any>;
  };
  metadata: Record<string, any>;
  isActive: boolean;
  isStable: boolean;
}

export interface CreateComponentRequest {
  name: string;
  description?: string;
  type: string;
  category: string;
  defaultProps?: Record<string, any>;
  supportedFormats?: string[];
  tags?: string[];
  isSystem?: boolean;
  template: {
    html?: string;
    svg?: string;
    canvas?: any[];
    styles: Record<string, any>;
  };
  propsSchema: {
    properties: Record<string, any>;
    required: string[];
  };
}

export interface UpdateComponentRequest {
  name?: string;
  description?: string;
  category?: string;
  defaultProps?: Record<string, any>;
  supportedFormats?: string[];
  tags?: string[];
}

export interface CreateVersionRequest {
  changeLog: string;
  props?: Record<string, any>;
  isStable?: boolean;
  template?: {
    html?: string;
    svg?: string;
    canvas?: any[];
    styles: Record<string, any>;
  };
  propsSchema?: {
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ComponentSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  isSystem?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface ComponentListResponse {
  components: Component[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ComponentStats {
  totalComponents: number;
  publishedComponents: number;
  systemComponents: number;
  userComponents: number;
  componentsByType: {
    type: string;
    count: number;
  }[];
  componentsByCategory: {
    category: string;
    count: number;
  }[];
  topUsedComponents: {
    id: string;
    name: string;
    usageCount: number;
  }[];
  recentActivity: {
    date: string;
    count: number;
  }[];
}

export interface ComponentUsage {
  totalUsage: number;
  reportsUsing: number;
  pagesUsing: number;
  usageByDate: {
    date: string;
    count: number;
  }[];
  topReports: {
    reportId: string;
    reportTitle: string;
    usageCount: number;
  }[];
}

export interface ComponentCategory {
  id: string;
  name: string;
  description?: string;
  count: number;
  icon?: string;
}

class ComponentsService {
  private client = axios.create({
    baseURL: BACKEND_API_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  private handleApiError(error: any): never {
    console.error('Components API error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in.');
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden. You do not have permission.');
    } else if (error.response?.status === 404) {
      throw new Error('Component not found.');
    } else if (error.response?.status === 409) {
      throw new Error('Component with this name already exists.');
    } else if (error.response?.status === 422) {
      throw new Error('Invalid component data. Please check your inputs.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else {
      throw new Error(`API request failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Create new component
  async createComponent(data: CreateComponentRequest): Promise<Component> {
    try {
      console.log('🧩 Creating component:', data);
      
      const response: AxiosResponse<Component> = await this.client.post('/components', data);
      
      console.log('✅ Component created successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get components list with filtering and pagination
  async getComponents(params: ComponentSearchParams = {}): Promise<ComponentListResponse> {
    try {
      const defaultParams: ComponentSearchParams = {
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

      console.log('🧩 Fetching components with params:', cleanParams);

      const response: AxiosResponse<ComponentListResponse> = await this.client.get('/components', {
        params: cleanParams,
      });

      console.log('✅ Components fetched successfully:', {
        count: response.data.components.length,
        total: response.data.total
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get component statistics
  async getComponentStats(): Promise<ComponentStats> {
    try {
      console.log('📊 Fetching component statistics...');
      
      const response: AxiosResponse<ComponentStats> = await this.client.get('/components/stats');
      
      console.log('✅ Component stats fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get component categories
  async getComponentCategories(): Promise<ComponentCategory[]> {
    try {
      console.log('📂 Fetching component categories...');
      
      const response: AxiosResponse<ComponentCategory[]> = await this.client.get('/components/categories');
      
      console.log('✅ Component categories fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get specific component by ID
  async getComponent(id: string, includeVersions = false): Promise<Component & { versions?: ComponentVersion[] }> {
    try {
      console.log('🧩 Fetching component:', { id, includeVersions });
      
      const response: AxiosResponse<Component & { versions?: ComponentVersion[] }> = await this.client.get(`/components/${id}`, {
        params: { includeVersions },
      });
      
      console.log('✅ Component fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get component versions
  async getComponentVersions(id: string): Promise<ComponentVersion[]> {
    try {
      console.log('📋 Fetching component versions:', id);
      
      const response: AxiosResponse<ComponentVersion[]> = await this.client.get(`/components/${id}/versions`);
      
      console.log('✅ Component versions fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update component
  async updateComponent(id: string, data: UpdateComponentRequest): Promise<Component> {
    try {
      console.log('📝 Updating component:', { id, data });
      
      const response: AxiosResponse<Component> = await this.client.put(`/components/${id}`, data);
      
      console.log('✅ Component updated successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete component
  async deleteComponent(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting component:', id);
      
      await this.client.delete(`/components/${id}`);
      
      console.log('✅ Component deleted successfully');
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Create new component version
  async createVersion(id: string, data: CreateVersionRequest): Promise<ComponentVersion> {
    try {
      console.log('📋 Creating component version:', { id, data });
      
      const response: AxiosResponse<ComponentVersion> = await this.client.post(`/components/${id}/versions`, data);
      
      console.log('✅ Component version created successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update specific component version
  async updateVersion(id: string, version: number, data: Partial<CreateVersionRequest>): Promise<ComponentVersion> {
    try {
      console.log('📝 Updating component version:', { id, version, data });
      
      const response: AxiosResponse<ComponentVersion> = await this.client.put(`/components/${id}/versions/${version}`, data);
      
      console.log('✅ Component version updated successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get component usage statistics
  async getComponentUsage(id: string): Promise<ComponentUsage> {
    try {
      console.log('📈 Fetching component usage:', id);
      
      const response: AxiosResponse<ComponentUsage> = await this.client.get(`/components/${id}/usage`);
      
      console.log('✅ Component usage fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Test component rendering
  async testComponentRender(id: string, props?: Record<string, any>): Promise<{ html: string; css: string; success: boolean }> {
    try {
      console.log('🧪 Testing component render:', { id, props });
      
      const response: AxiosResponse<{ html: string; css: string; success: boolean }> = await this.client.post(`/components/${id}/test`, {
        props: props || {},
      });
      
      console.log('✅ Component render test completed:', response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Health check for components service
  async isComponentsHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/components/health/status');
      return response.data.healthy === true;
    } catch {
      return false;
    }
  }

  // Utility methods
  formatComponentName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  validateComponentData(data: CreateComponentRequest | UpdateComponentRequest): string[] {
    const errors: string[] = [];
    
    if ('name' in data && data.name) {
      if (data.name.length < 3) {
        errors.push('Component name must be at least 3 characters long');
      }
      if (data.name.length > 100) {
        errors.push('Component name must be less than 100 characters');
      }
    }

    if (data.description && data.description.length > 500) {
      errors.push('Component description must be less than 500 characters');
    }

    if (data.tags && data.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    if ('type' in data && data.type && !this.isValidComponentType(data.type)) {
      errors.push('Invalid component type');
    }

    return errors;
  }

  // Check if component type is valid
  private isValidComponentType(type: string): boolean {
    const validTypes = [
      'text', 'image', 'shape', 'chart', 'table', 
      'form', 'button', 'container', 'layout', 'media',
      'icon', 'widget', 'custom'
    ];
    return validTypes.includes(type);
  }

  // Get default props for component type
  getDefaultPropsForType(type: string): Record<string, any> {
    const defaults: Record<string, Record<string, any>> = {
      text: {
        content: 'Text content',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#333333',
        textAlign: 'left',
      },
      image: {
        src: '',
        alt: 'Image',
        fit: 'cover',
        borderRadius: 0,
      },
      shape: {
        type: 'rectangle',
        fill: '#48aff0',
        stroke: '#2c5282',
        strokeWidth: 1,
        borderRadius: 0,
      },
      chart: {
        type: 'bar',
        data: [],
        width: 400,
        height: 300,
        colors: ['#48aff0', '#2c5282'],
      },
      button: {
        label: 'Button',
        variant: 'primary',
        size: 'medium',
        disabled: false,
      },
    };

    return defaults[type] || {};
  }

  // Get props schema for component type
  getPropsSchemaForType(type: string): { properties: Record<string, any>; required: string[] } {
    const schemas: Record<string, { properties: Record<string, any>; required: string[] }> = {
      text: {
        properties: {
          content: { type: 'string', description: 'Text content' },
          fontSize: { type: 'number', minimum: 8, maximum: 72 },
          fontFamily: { type: 'string' },
          color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
          textAlign: { type: 'string', enum: ['left', 'center', 'right', 'justify'] },
        },
        required: ['content'],
      },
      image: {
        properties: {
          src: { type: 'string', format: 'uri' },
          alt: { type: 'string' },
          fit: { type: 'string', enum: ['cover', 'contain', 'fill', 'scale-down'] },
          borderRadius: { type: 'number', minimum: 0 },
        },
        required: ['src'],
      },
      shape: {
        properties: {
          type: { type: 'string', enum: ['rectangle', 'circle', 'triangle', 'polygon'] },
          fill: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
          stroke: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
          strokeWidth: { type: 'number', minimum: 0 },
          borderRadius: { type: 'number', minimum: 0 },
        },
        required: ['type'],
      },
    };

    return schemas[type] || { properties: {}, required: [] };
  }

  // Convert component to canvas data format
  componentToCanvasData(component: Component) {
    return {
      id: component.id,
      name: component.name,
      type: component.type,
      category: component.category,
      thumbnail: component.thumbnail,
      previewUrl: component.previewUrl,
      defaultProps: component.defaultProps,
      supportedFormats: component.supportedFormats,
      version: component.version,
      isSystem: component.isSystem,
      usageCount: component.usageCount,
      tags: component.tags,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
    };
  }

  // Search utilities
  buildSearchParams(filters: {
    search?: string;
    type?: string;
    category?: string;
    tags?: string[];
    published?: boolean;
    system?: boolean;
  }): ComponentSearchParams {
    return {
      search: filters.search?.trim() || undefined,
      type: filters.type || undefined,
      category: filters.category || undefined,
      tags: filters.tags?.length ? filters.tags : undefined,
      isPublished: filters.published,
      isSystem: filters.system,
    };
  }
}

export const componentsService = new ComponentsService();
export default componentsService;