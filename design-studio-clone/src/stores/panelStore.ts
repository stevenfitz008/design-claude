import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type PanelType = 
  | 'templates'
  | 'text'
  | 'photos' 
  | 'icons'
  | 'shapes'
  | 'upload'
  | 'videos'
  | 'background'
  | 'layers'
  | 'resize'
  | 'quotes'
  | 'qrcode'
  | 'ai-image';

export interface PanelState {
  activePanel: PanelType;
  panelHistory: PanelType[];
  searchQuery: string;
  filters: Record<string, any>;
  isCollapsed: boolean;
}

export interface PanelStore extends PanelState {
  // Panel navigation
  setActivePanel: (panel: PanelType) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  
  // Search and filters
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  
  // Panel state
  toggleCollapsed: () => void;
  resetPanel: () => void;
  
  // Panel-specific state getters
  getTemplateFilters: () => { category?: string; premium?: boolean; };
  getPhotoFilters: () => { category?: string; color?: string; orientation?: string; };
}

export const usePanelStore = create<PanelStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      activePanel: 'templates',
      panelHistory: [],
      searchQuery: '',
      filters: {},
      isCollapsed: false,

      // Panel navigation
      setActivePanel: (panel) => {
        set((state) => ({
          activePanel: panel,
          panelHistory: [...state.panelHistory.filter(p => p !== panel), state.activePanel],
          searchQuery: '', // Reset search when switching panels
          filters: {}, // Reset filters when switching panels
        }));
      },

      goBack: () => {
        const { panelHistory } = get();
        if (panelHistory.length > 0) {
          const previousPanel = panelHistory[panelHistory.length - 1];
          const newHistory = panelHistory.slice(0, -1);
          
          set({
            activePanel: previousPanel,
            panelHistory: newHistory,
          });
        }
      },

      canGoBack: () => get().panelHistory.length > 0,

      // Search and filters
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setFilter: (key, value) => {
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      // Panel state
      toggleCollapsed: () => {
        set((state) => ({ isCollapsed: !state.isCollapsed }));
      },

      resetPanel: () => {
        set({
          activePanel: 'templates',
          panelHistory: [],
          searchQuery: '',
          filters: {},
          isCollapsed: false,
        });
      },

      // Panel-specific state getters
      getTemplateFilters: () => {
        const { filters } = get();
        return {
          category: filters.templateCategory,
          premium: filters.templatePremium,
        };
      },

      getPhotoFilters: () => {
        const { filters } = get();
        return {
          category: filters.photoCategory,
          color: filters.photoColor,
          orientation: filters.photoOrientation,
        };
      },
    }),
    {
      name: 'panel-store',
    }
  )
);