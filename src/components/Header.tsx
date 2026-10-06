import React from 'react';
import { CircuitParams, AppTheme } from '../types/circuit';
import { Download, RotateCcw, BookOpen, Sun, Moon, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  params: CircuitParams;
  theme: AppTheme;
  onToggleTheme: () => void;
  onSelectPreset: (preset: Partial<CircuitParams>) => void;
  onReset: () => void;
  onOpenFormulas: () => void;
  onOpenExport: () => void;
  onOpenLayoutConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onSelectPreset,
  onReset,
  onOpenFormulas,
  onOpenExport,
  onOpenLayoutConfig,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`flex items-center justify-between px-4 sm:px-6 py-3.5 backdrop-blur-md border-b shrink-0 sticky top-0 z-30 transition-colors ${
        isDark
          ? 'bg-black/90 border-zinc-800 text-zinc-100'
          : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xs'
      }`}
    >
      {/* Zone 1: Single text element brand wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className={`text-lg font-bold tracking-tight flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block"></span>
          RectiSim
        </a>
        <span
          className={`text-xs hidden lg:inline ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}
        >
          Power Electronics Rectifier Workbench
        </span>
      </div>

      {/* Zone 2: Navigation links / Quick Topology Presets */}
      <nav
        className={`hidden md:flex items-center gap-1.5 text-xs font-medium ${
          isDark ? 'text-zinc-300' : 'text-zinc-600'
        }`}
      >
        <button
          onClick={() =>
            onSelectPreset({ phase: '1phase', config: 'half-wave', deviceType: 'diode', loadType: 'R' })
          }
          className={`px-2.5 py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          1-Ph Half Wave
        </button>
        <button
          onClick={() =>
            onSelectPreset({ phase: '1phase', config: 'full-wave', deviceType: 'thyristor', firingAngle: 45, loadType: 'RL' })
          }
          className={`px-2.5 py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          1-Ph FW Thyristor
        </button>
        <button
          onClick={() =>
            onSelectPreset({ phase: '3phase', config: 'half-wave', deviceType: 'diode', loadType: 'R' })
          }
          className={`px-2.5 py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          3-Ph 3-Pulse
        </button>
        <button
          onClick={() =>
            onSelectPreset({ phase: '3phase', config: 'full-wave', deviceType: 'thyristor', firingAngle: 30, loadType: 'RL' })
          }
          className={`px-2.5 py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          3-Ph 6-Pulse Bridge
        </button>
        <button
          onClick={onOpenFormulas}
          className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            isDark ? 'hover:bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-100 text-cyan-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Theory & Formulas
        </button>
      </nav>

      {/* Zone 3: Primary Actions + Theme Switcher */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 text-amber-300 hover:bg-zinc-800 hover:text-amber-200'
              : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
          }`}
          title={isDark ? 'Switch to White (Light Mode)' : 'Switch to Black (Dark Mode)'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Configure UI Layout Button */}
        {onOpenLayoutConfig && (
          <button
            onClick={onOpenLayoutConfig}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-cyan-300 hover:bg-zinc-800 hover:text-cyan-200'
                : 'bg-zinc-100 border-zinc-200 text-cyan-700 hover:bg-zinc-200 hover:text-cyan-900'
            }`}
            title="Configure UI Layout & Section Positions"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Layout</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
          }`}
          title="Export CSV & Analysis"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          onClick={onReset}
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 ${
            isDark
              ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'bg-zinc-100/60 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
          }`}
          title="Reset Parameters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
