import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center p-3 rounded-xl border transition-all ${
        isDarkMode 
          ? 'bg-[#1A1D27] hover:bg-white/5 border-white/5 text-emerald-400 shadow-lg shadow-emerald-500/10' 
          : 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-500 shadow-lg shadow-amber-500/10'
      } ${className}`}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDarkMode ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
