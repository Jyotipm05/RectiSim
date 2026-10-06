import React from 'react';
import { HarmonicComponent, AppTheme } from '../types/circuit';

interface HarmonicsChartProps {
  harmonics: HarmonicComponent[];
  rippleFrequency: number;
  theme?: AppTheme;
}

export const HarmonicsChart: React.FC<HarmonicsChartProps> = ({
  harmonics,
  rippleFrequency,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const maxPct = Math.max(50, ...harmonics.map((h) => h.percentage));

  return (
    <div className={`flex flex-col gap-2 pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Output Voltage Harmonic Spectrum</span>
        <span className={`text-[11px] font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600 font-semibold'}`}>
          Dominant Ripple: {rippleFrequency} Hz
        </span>
      </div>

      <div
        className={`p-2.5 rounded-lg border transition-colors ${
          isDark ? 'bg-black border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        <div className="flex items-end gap-1.5 h-[90px] pt-4 px-2">
          {harmonics.slice(0, 10).map((h) => {
            const barHeight = Math.max(4, (h.percentage / maxPct) * 70);
            const isDominant = h.percentage > 15;

            return (
              <div
                key={h.order}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Tooltip */}
                <div
                  className={`absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity border text-[9px] font-mono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 shadow ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-cyan-300'
                      : 'bg-white border-zinc-300 text-cyan-800'
                  }`}
                >
                  n={h.order}: {h.percentage.toFixed(1)}% ({h.magnitude.toFixed(1)}V)
                </div>

                <div
                  style={{ height: `${barHeight}px` }}
                  className={`w-full rounded-t transition-all ${
                    isDominant
                      ? isDark
                        ? 'bg-cyan-500 group-hover:bg-cyan-400'
                        : 'bg-cyan-600 group-hover:bg-cyan-500'
                      : isDark
                      ? 'bg-zinc-700 group-hover:bg-zinc-500'
                      : 'bg-zinc-300 group-hover:bg-zinc-400'
                  }`}
                />
                <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-700'}`}>
                  {h.order}f
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
