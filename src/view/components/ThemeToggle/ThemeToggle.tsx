import { useTheme } from '../../../context/ThemeContext';
import { HiSun, HiMoon } from 'react-icons/hi';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isMonochrome = theme === 'monochrome';

    return (
        <button
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-bg-dark border border-border-dark hover:border-primary/50 transition-all duration-300 group"
            title={isMonochrome ? 'Switch to Color Theme' : 'Switch to Black & White Theme'}
            aria-label="Toggle theme"
        >
            {/* Sun Icon (visible in monochrome mode) */}
            <HiSun
                className={`absolute text-xl transition-all duration-300 ${isMonochrome
                        ? 'opacity-100 rotate-0 scale-100 text-text-light'
                        : 'opacity-0 -rotate-90 scale-0'
                    }`}
            />
            {/* Moon Icon (visible in color mode) */}
            <HiMoon
                className={`absolute text-xl transition-all duration-300 ${isMonochrome
                        ? 'opacity-0 rotate-90 scale-0'
                        : 'opacity-100 rotate-0 scale-100 text-primary'
                    }`}
            />
        </button>
    );
}
