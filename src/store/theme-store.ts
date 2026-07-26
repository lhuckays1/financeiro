import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('finflow-theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark';
};

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
};

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme();
  applyThemeToDOM(initial);

  return {
    theme: initial,
    toggleTheme: () => {
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('finflow-theme', next);
        applyThemeToDOM(next);
        return { theme: next };
      });
    },
    setTheme: (theme) => {
      localStorage.setItem('finflow-theme', theme);
      applyThemeToDOM(theme);
      set({ theme });
    },
  };
});
