import { create } from 'zustand';

interface AppState {
  isImporting: boolean;
  importProgress: number;
  setImporting: (isImporting: boolean) => void;
  setImportProgress: (progress: number) => void;
  
  // UI Preferences
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set) => ({
  isImporting: false,
  importProgress: 0,
  setImporting: (isImporting) => set({ isImporting }),
  setImportProgress: (importProgress) => set({ importProgress }),
  
  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
