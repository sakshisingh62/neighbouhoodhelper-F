import { create } from 'zustand';

// Initialize from localStorage (only in browser)
const initializeDarkMode = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading darkMode from localStorage:', error);
  }
  return false;
};

const useThemeStore = create((set) => ({
  darkMode: initializeDarkMode(),

  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.darkMode;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return { darkMode: newMode };
    }),

  setDarkMode: (mode) => {
    if (mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(mode));
    set({ darkMode: mode });
  },
}));

export default useThemeStore;
