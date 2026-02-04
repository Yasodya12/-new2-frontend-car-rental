import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'color' | 'monochrome';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'ridehub-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Initialize from localStorage or default to 'color'
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored === 'color' || stored === 'monochrome') {
                return stored;
            }
        }
        return 'color';
    });

    // Apply theme class to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'monochrome') {
            root.classList.add('theme-monochrome');
        } else {
            root.classList.remove('theme-monochrome');
        }
        // Persist to localStorage
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'color' ? 'monochrome' : 'color');
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
