import { create } from 'zustand';

interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: any[];
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PageState {
  pages: Page[];
  currentPageId: string | null;
  
  // Actions
  setPages: (pages: Page[]) => void;
  addPage: (page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  removePage: (id: string) => void;
  setCurrentPageId: (id: string | null) => void;
  getCurrentPage: () => Page | null;
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [
    {
      id: 'default-page',
      name: 'Page 1',
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  currentPageId: 'default-page',
  
  setPages: (pages) => set({ pages }),
  
  addPage: (pageData) => {
    const newPage: Page = {
      ...pageData,
      id: `page_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    set((state) => ({ pages: [...state.pages, newPage] }));
  },
  
  updatePage: (id, updates) => set((state) => ({
    pages: state.pages.map(page => 
      page.id === id 
        ? { ...page, ...updates, updatedAt: new Date() }
        : page
    )
  })),
  
  removePage: (id) => set((state) => {
    const newPages = state.pages.filter(page => page.id !== id);
    const newCurrentPageId = state.currentPageId === id 
      ? (newPages.length > 0 ? newPages[0].id : null)
      : state.currentPageId;
    
    return {
      pages: newPages,
      currentPageId: newCurrentPageId
    };
  }),
  
  setCurrentPageId: (id) => set({ currentPageId: id }),
  
  getCurrentPage: () => {
    const state = get();
    return state.pages.find(page => page.id === state.currentPageId) || null;
  }
}));