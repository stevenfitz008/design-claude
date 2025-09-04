import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  reportsService,
  type Report, 
  type ReportListResponse, 
  type ReportStats,
  type CreateReportRequest,
  type UpdateReportRequest,
  type ReportSearchParams
} from '../services/reportsService';

export interface ReportsState {
  // Data
  reports: Report[];
  currentReport: Report | null;
  stats: ReportStats | null;
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Pagination & Filtering
  currentPage: number;
  totalPages: number;
  limit: number;
  total: number;
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  showPublishedOnly: boolean;
  showPublicOnly: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt';
  sortOrder: 'asc' | 'desc';
  
  // Selection & UI
  selectedReportIds: string[];
  showCreateDialog: boolean;
  showDeleteDialog: boolean;
  reportToDelete: string | null;
}

export interface ReportsStore extends ReportsState {
  // Data Actions
  fetchReports: (params?: ReportSearchParams) => Promise<void>;
  fetchReportStats: () => Promise<void>;
  fetchReport: (id: string) => Promise<Report>;
  createReport: (data: CreateReportRequest) => Promise<Report>;
  updateReport: (id: string, data: UpdateReportRequest) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  duplicateReport: (id: string, newTitle?: string) => Promise<Report>;
  togglePublishReport: (id: string, isPublished: boolean) => Promise<void>;
  setReportVisibility: (id: string, isPublic: boolean) => Promise<void>;
  
  // UI Actions
  setCurrentReport: (report: Report | null) => void;
  clearError: () => void;
  setError: (error: string) => void;
  
  // Pagination & Filtering
  setSearchQuery: (query: string) => void;
  setCategory: (category: string | null) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  toggleShowPublishedOnly: () => void;
  toggleShowPublicOnly: () => void;
  setSortBy: (sortBy: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  
  // Selection
  selectReport: (id: string) => void;
  selectMultipleReports: (ids: string[]) => void;
  deselectReport: (id: string) => void;
  deselectAllReports: () => void;
  toggleReportSelection: (id: string) => void;
  isReportSelected: (id: string) => boolean;
  
  // Dialogs
  showCreateReportDialog: () => void;
  hideCreateReportDialog: () => void;
  showDeleteReportDialog: (reportId: string) => void;
  hideDeleteReportDialog: () => void;
  
  // Utilities
  getSelectedReports: () => Report[];
  refreshReports: () => Promise<void>;
  searchReports: (query: string) => Promise<void>;
}

export const useReportsStore = create<ReportsStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      reports: [],
      currentReport: null,
      stats: null,
      
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      
      currentPage: 1,
      totalPages: 0,
      limit: 20,
      total: 0,
      searchQuery: '',
      selectedCategory: null,
      selectedTags: [],
      showPublishedOnly: false,
      showPublicOnly: false,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      
      selectedReportIds: [],
      showCreateDialog: false,
      showDeleteDialog: false,
      reportToDelete: null,

      // Data Actions
      fetchReports: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const searchParams: ReportSearchParams = {
            page: state.currentPage,
            limit: state.limit,
            search: state.searchQuery || undefined,
            category: state.selectedCategory || undefined,
            tags: state.selectedTags.length > 0 ? state.selectedTags : undefined,
            isPublished: state.showPublishedOnly ? true : undefined,
            isPublic: state.showPublicOnly ? true : undefined,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            ...params,
          };

          const response: ReportListResponse = await reportsService.getReports(searchParams);
          
          set({
            reports: response.reports,
            currentPage: response.page,
            totalPages: response.totalPages,
            total: response.total,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to fetch reports:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch reports',
            isLoading: false,
          });
        }
      },

      fetchReportStats: async () => {
        set({ error: null });
        try {
          const stats = await reportsService.getReportStats();
          set({ stats });
        } catch (error) {
          console.error('Failed to fetch report stats:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch report statistics',
          });
        }
      },

      fetchReport: async (id) => {
        set({ error: null });
        try {
          const report = await reportsService.getReport(id);
          set({ currentReport: report });
          return report;
        } catch (error) {
          console.error('Failed to fetch report:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      createReport: async (data) => {
        set({ isCreating: true, error: null });
        try {
          const newReport = await reportsService.createReport(data);
          
          // Add to the beginning of the reports list
          set((state) => ({
            reports: [newReport, ...state.reports],
            total: state.total + 1,
            isCreating: false,
            showCreateDialog: false,
            currentReport: newReport,
          }));
          
          return newReport;
        } catch (error) {
          console.error('Failed to create report:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to create report';
          set({
            error: errorMessage,
            isCreating: false,
          });
          throw new Error(errorMessage);
        }
      },

      updateReport: async (id, data) => {
        set({ isUpdating: true, error: null });
        try {
          const updatedReport = await reportsService.updateReport(id, data);
          
          set((state) => ({
            reports: state.reports.map(report => 
              report.id === id ? updatedReport : report
            ),
            currentReport: state.currentReport?.id === id ? updatedReport : state.currentReport,
            isUpdating: false,
          }));
        } catch (error) {
          console.error('Failed to update report:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update report',
            isUpdating: false,
          });
          throw error;
        }
      },

      deleteReport: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          await reportsService.deleteReport(id);
          
          set((state) => ({
            reports: state.reports.filter(report => report.id !== id),
            selectedReportIds: state.selectedReportIds.filter(reportId => reportId !== id),
            currentReport: state.currentReport?.id === id ? null : state.currentReport,
            total: Math.max(0, state.total - 1),
            isDeleting: false,
            showDeleteDialog: false,
            reportToDelete: null,
          }));
        } catch (error) {
          console.error('Failed to delete report:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete report',
            isDeleting: false,
          });
          throw error;
        }
      },

      duplicateReport: async (id, newTitle) => {
        set({ error: null });
        try {
          const duplicatedReport = await reportsService.duplicateReport(id, newTitle);
          
          set((state) => ({
            reports: [duplicatedReport, ...state.reports],
            total: state.total + 1,
          }));
          
          return duplicatedReport;
        } catch (error) {
          console.error('Failed to duplicate report:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate report';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      togglePublishReport: async (id, isPublished) => {
        set({ error: null });
        try {
          const updatedReport = await reportsService.togglePublishReport(id, isPublished);
          
          set((state) => ({
            reports: state.reports.map(report => 
              report.id === id ? updatedReport : report
            ),
            currentReport: state.currentReport?.id === id ? updatedReport : state.currentReport,
          }));
        } catch (error) {
          console.error('Failed to toggle report publish status:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update report publish status',
          });
          throw error;
        }
      },

      setReportVisibility: async (id, isPublic) => {
        set({ error: null });
        try {
          const updatedReport = await reportsService.setReportVisibility(id, isPublic);
          
          set((state) => ({
            reports: state.reports.map(report => 
              report.id === id ? updatedReport : report
            ),
            currentReport: state.currentReport?.id === id ? updatedReport : state.currentReport,
          }));
        } catch (error) {
          console.error('Failed to set report visibility:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to update report visibility',
          });
          throw error;
        }
      },

      // UI Actions
      setCurrentReport: (report) => {
        set({ currentReport: report });
      },

      clearError: () => {
        set({ error: null });
      },

      setError: (error) => {
        set({ error });
      },

      // Pagination & Filtering
      setSearchQuery: (searchQuery) => {
        set({ searchQuery, currentPage: 1 });
      },

      setCategory: (selectedCategory) => {
        set({ selectedCategory, currentPage: 1 });
      },

      setTags: (selectedTags) => {
        set({ selectedTags, currentPage: 1 });
      },

      addTag: (tag) => {
        set((state) => ({
          selectedTags: [...state.selectedTags, tag],
          currentPage: 1,
        }));
      },

      removeTag: (tag) => {
        set((state) => ({
          selectedTags: state.selectedTags.filter(t => t !== tag),
          currentPage: 1,
        }));
      },

      toggleShowPublishedOnly: () => {
        set((state) => ({
          showPublishedOnly: !state.showPublishedOnly,
          currentPage: 1,
        }));
      },

      toggleShowPublicOnly: () => {
        set((state) => ({
          showPublicOnly: !state.showPublicOnly,
          currentPage: 1,
        }));
      },

      setSortBy: (sortBy) => {
        set({ sortBy, currentPage: 1 });
      },

      setSortOrder: (sortOrder) => {
        set({ sortOrder, currentPage: 1 });
      },

      setPage: (currentPage) => {
        set({ currentPage });
      },

      resetFilters: () => {
        set({
          searchQuery: '',
          selectedCategory: null,
          selectedTags: [],
          showPublishedOnly: false,
          showPublicOnly: false,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          currentPage: 1,
        });
      },

      // Selection
      selectReport: (id) => {
        set((state) => ({
          selectedReportIds: [...state.selectedReportIds.filter(reportId => reportId !== id), id],
        }));
      },

      selectMultipleReports: (ids) => {
        set({ selectedReportIds: ids });
      },

      deselectReport: (id) => {
        set((state) => ({
          selectedReportIds: state.selectedReportIds.filter(reportId => reportId !== id),
        }));
      },

      deselectAllReports: () => {
        set({ selectedReportIds: [] });
      },

      toggleReportSelection: (id) => {
        set((state) => ({
          selectedReportIds: state.selectedReportIds.includes(id)
            ? state.selectedReportIds.filter(reportId => reportId !== id)
            : [...state.selectedReportIds, id],
        }));
      },

      isReportSelected: (id) => {
        return get().selectedReportIds.includes(id);
      },

      // Dialogs
      showCreateReportDialog: () => {
        set({ showCreateDialog: true });
      },

      hideCreateReportDialog: () => {
        set({ showCreateDialog: false });
      },

      showDeleteReportDialog: (reportId) => {
        set({ 
          showDeleteDialog: true,
          reportToDelete: reportId,
        });
      },

      hideDeleteReportDialog: () => {
        set({ 
          showDeleteDialog: false,
          reportToDelete: null,
        });
      },

      // Utilities
      getSelectedReports: () => {
        const state = get();
        return state.reports.filter(report => state.selectedReportIds.includes(report.id));
      },

      refreshReports: async () => {
        const state = get();
        await state.fetchReports();
      },

      searchReports: async (query) => {
        set({ searchQuery: query, currentPage: 1 });
        const state = get();
        await state.fetchReports();
      },
    }),
    {
      name: 'reports-store',
    }
  )
);