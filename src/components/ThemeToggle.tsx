import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getThemeToggleMeta } from '../lib/themeEngine';

interface ThemeToggleProps {
  variant?: 'compact' | 'segmented';
  className?: string;
}

export function ThemeToggle({
  variant = 'segmented',
  className = '',
}: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const meta = getThemeToggleMeta(theme);

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={meta.ariaLabel}
        title={meta.ariaLabel}
        className={`voya-theme-toggle-compact inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full border text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
          isDark
            ? 'bg-white/5 border-white/15 text-slate-200 hover:bg-white/10 hover:text-white'
            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 shrink-0" />
        )}
        <span className="hidden xl:inline">{meta.shortLabel}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Color theme mode"
      className={`voya-theme-segmented inline-flex items-center gap-1 p-1 rounded-xl border transition-colors shrink-0 ${
        isDark
          ? 'bg-[#0D131F]/80 border-white/10'
          : 'bg-white border-slate-200 shadow-xs'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={!isDark}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[34px] ${
          !isDark
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Sun className="w-3.5 h-3.5 shrink-0" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={isDark}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[34px] ${
          isDark
            ? 'bg-white/12 text-white border border-white/10'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Moon className="w-3.5 h-3.5 shrink-0" />
        <span>Dark</span>
      </button>
    </div>
  );
}
