import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import type { 
  ApiResponse, 
  ApiError, 
  RequestOptions,
  ApiClientConfig,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ProjectData,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  UnsplashPhoto,
  UnsplashSearchParams,
  GoogleFont,
  CloudStorageFile,
  CloudUploadRequest,
  TemplateAsset,
  ExportRequest,
  ExportResponse
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private authToken: string | null = null;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:3001',
      timeout: 10000,
      retries: 3,
      userAgent: 'Design Studio Clone/1.0.0',
      version: 'v1',
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent,
      }
    });

    this.setupInterceptors();
    this.loadAuthToken();
  }

  private setupInterceptors() {
    // Request interceptor for auth tokens
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private loadAuthToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.authToken = token;
    }
  }

  private saveAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
  }

  private clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  private transformError(error: AxiosError): ApiError {
    const apiError = new Error(error.message) as ApiError;
    apiError.code = error.code || 'NETWORK_ERROR';
    apiError.status = error.response?.status || 0;
    apiError.details = error.response?.data;
    return apiError;
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    this.saveAuthToken(response.data.token);
    localStorage.setItem('user_data', JSON.stringify(response.data.user));
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', userData);
    this.saveAuthToken(response.data.token);
    localStorage.setItem('user_data', JSON.stringify(response.data.user));
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearAuthToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.client.post<AuthResponse>('/auth/refresh', {
      refreshToken
    });
    
    this.saveAuthToken(response.data.token);
    return response.data;
  }

  // Project Management Methods
  async getProjects(page = 1, limit = 20): Promise<{ data: ProjectData[], total: number, page: number, pageSize: number }> {
    const response = await this.client.get(`/projects?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getProject(id: string, includeCanvas = true): Promise<ProjectData> {
    const response = await this.client.get(`/projects/${id}?include_canvas=${includeCanvas}`);
    return response.data;
  }

  async createProject(projectData: ProjectCreateRequest): Promise<ProjectData> {
    const response = await this.client.post<ApiResponse<ProjectData>>('/projects', projectData);
    return response.data.data!;
  }

  async updateProject(id: string, updates: ProjectUpdateRequest): Promise<ProjectData> {
    const response = await this.client.put<ApiResponse<ProjectData>>(`/projects/${id}`, updates);
    return response.data.data!;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  async duplicateProject(id: string, newName?: string): Promise<ProjectData> {
    const response = await this.client.post<ApiResponse<ProjectData>>(`/projects/${id}/duplicate`, {
      name: newName
    });
    return response.data.data!;
  }

  async getProjectStats(): Promise<any> {
    const response = await this.client.get('/projects/stats');
    return response.data;
  }

  // Photos/Unsplash Integration
  async searchPhotos(params: UnsplashSearchParams): Promise<{
    total: number;
    total_pages: number;
    page: number;
    per_page: number;
    results: UnsplashPhoto[];
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const response = await this.client.get(`/photos/search?${searchParams}`);
    return response.data;
  }

  async getTrendingPhotos(): Promise<UnsplashPhoto[]> {
    const response = await this.client.get('/photos/trending');
    return response.data.results;
  }

  async downloadPhoto(photoId: string): Promise<void> {
    await this.client.post(`/photos/${photoId}/download`);
  }

  // Fonts Integration
  async getFonts(category?: string, limit = 20): Promise<{
    total: number;
    page: number;
    per_page: number;
    items: GoogleFont[];
  }> {
    const params = new URLSearchParams({ per_page: limit.toString() });
    if (category) {
      params.append('category', category);
    }
    
    const response = await this.client.get(`/fonts?${params}`);
    return response.data;
  }

  async loadFontCSS(family: string, variants: string[]): Promise<string> {
    const response = await this.client.get(`/fonts/${encodeURIComponent(family)}/css`, {
      params: { variants: variants.join(',') }
    });
    return response.data.css_url;
  }

  // Templates
  async getTemplates(category?: string, featured?: boolean): Promise<{
    total: number;
    page: number;
    pageSize: number;
    data: TemplateAsset[];
  }> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (featured !== undefined) params.append('featured', featured.toString());
    
    const response = await this.client.get(`/templates?${params}`);
    return response.data;
  }

  async getTemplate(id: string): Promise<TemplateAsset> {
    const response = await this.client.get(`/templates/${id}`);
    return response.data;
  }

  // File Upload
  async uploadFile(file: File, folder?: string): Promise<CloudStorageFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await this.client.post<ApiResponse<CloudStorageFile>>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data!;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.client.delete(`/uploads/${fileId}`);
  }

  async getStorageInfo(): Promise<any> {
    const response = await this.client.get('/uploads/storage');
    return response.data;
  }

  // Export
  async exportProject(exportData: ExportRequest): Promise<ExportResponse> {
    const response = await this.client.post<ExportResponse>('/exports', exportData);
    return response.data;
  }

  async getExportStatus(exportId: string): Promise<ExportResponse> {
    const response = await this.client.get<ExportResponse>(`/exports/${exportId}`);
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  getStoredUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;