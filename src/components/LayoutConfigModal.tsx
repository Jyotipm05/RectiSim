import React from 'react';
import {
  X,
  LayoutGrid,
  RotateCcw,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Columns2,
  Rows3,
  Sliders,
  Activity,
  Cpu,
  BarChart2,
  ArrowLeftRight,
  Split,
  Maximize2,
} from 'lucide-react';
import {
  LayoutConfig,
  LayoutRow,
  SectionId,
  SECTION_METADATA,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_LAYOUT_ROWS,
} from '../types/layout';
import { AppTheme } from '../types/circuit';

interface LayoutConfigModalProps {
  isOpen: boolean;
  theme?: AppTheme;
  layout: LayoutConfig;
  onUpdateLayout: (updated: LayoutConfig) => void;
  onResetLayout: () => void;
  onClose: () => void;
}

const SECTION_ICONS: Record<SectionId, React.ReactNode> = {
  oscilloscope: <Activity className="w-4 h-4 text-cyan-400" />,
  schematic: <Cpu className="w-4 h-4 text-emerald-400" />,
  controls: <Sliders className="w-4 h-4 text-amber-400" />,
  analysis: <BarChart2 className="w-4 h-4 text-purple-400" />,
};

export const LayoutConfigModal: React.FC<LayoutConfigModalProps> = ({
  isOpen,
  theme = 'dark',
  layout,
  onUpdateLayout,
  onResetLayout,
  onClose,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Move a row up or down
  const moveRow = (rowIndex: number, direction: 'up' | 'down') => {
    const list = [...layout.rows];
    const newIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    const [item] = list.splice(rowIndex, 1);
    list.splice(newIndex, 0, item);
    onUpdateLayout({ ...layout, rows: list });
  };

  // Split a 2-in-1 row into two separate single-in-a-row rows
  const splitRow = (rowIndex: number) => {
    const row = layout.rows[rowIndex];
    if (row.sections.length < 2) return;

    const list = [...layout.rows];
    const s1 = row.sections[0];
    const s2 = row.sections[1];

    list.splice(
      rowIndex,
      1,
      { id: `row-${s1}`, sections: [s1], splitRatio: 50 },
      { id: `row-${s2}`, sections: [s2], splitRatio: 50 }
    );

    onUpdateLayout({ ...layout, rows: list });
  };

  // Swap the two sections in a 2-in-1 row
  const swapRowSections = (rowIndex: number) => {
    const row = layout.rows[rowIndex];
    if (row.sections.length < 2) return;

    const list = [...layout.rows];
    list[rowIndex] = {
      ...row,
      sections: [row.sections[1], row.sections[0]],
      splitRatio: 100 - row.splitRatio,
    };

    onUpdateLayout({ ...layout, rows: list });
  };

  // Toggle visibility of a section
  const toggleVisibility = (id: SectionId) => {
    onUpdateLayout({
      ...layout,
      visible: {
        ...layout.visible,
        [id]: !layout.visible[id],
      },
    });
  };

  // Apply layout presets
  const applyPreset = (preset: 'classic' | 'allSingle' | 'twoDouble' | 'controlsFirst') => {
    switch (preset) {
      case 'classic':
        onUpdateLayout({
          ...layout,
          rows: [
            { id: 'row-visualizers', sections: ['oscilloscope', 'schematic'], splitRatio: 58 },
            { id: 'row-controls', sections: ['controls'], splitRatio: 50 },
            { id: 'row-analysis', sections: ['analysis'], splitRatio: 50 },
          ],
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
      case 'allSingle':
        onUpdateLayout({
          ...layout,
          rows: [
            { id: 'row-oscilloscope', sections: ['oscilloscope'], splitRatio: 50 },
            { id: 'row-schematic', sections: ['schematic'], splitRatio: 50 },
            { id: 'row-controls', sections: ['controls'], splitRatio: 50 },
            { id: 'row-analysis', sections: ['analysis'], splitRatio: 50 },
          ],
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
      case 'twoDouble':
        onUpdateLayout({
          ...layout,
          rows: [
            { id: 'row-visualizers', sections: ['oscilloscope', 'schematic'], splitRatio: 50 },
            { id: 'row-dash', sections: ['controls', 'analysis'], splitRatio: 50 },
          ],
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
      case 'controlsFirst':
        onUpdateLayout({
          ...layout,
          rows: [
            { id: 'row-controls', sections: ['controls'], splitRatio: 50 },
            { id: 'row-visualizers', sections: ['oscilloscope', 'schematic'], splitRatio: 58 },
            { id: 'row-analysis', sections: ['analysis'], splitRatio: 50 },
          ],
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
          isDark
            ? 'bg-black border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'border-zinc-800' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-wide">Configure Workbench Rows</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Organize sections into single rows or 2-in-1 side-by-side rows with movable divider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white'
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-6">
          {/* Quick Layout Presets */}
          <div className="flex flex-col gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Layout Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'classic', label: 'Classic Lab', desc: 'Scope + Schematic 2-in-1 row with divider, Controls & Analysis single rows' },
                { id: 'allSingle', label: 'All Single Rows', desc: 'All 4 sections stacked full-width individually' },
                { id: 'twoDouble', label: 'Two 2-in-1 Rows', desc: 'Scope + Schematic on row 1, Controls + Analysis on row 2' },
                { id: 'controlsFirst', label: 'Controls on Top', desc: 'Controls single row at top, then Scope + Schematic 2-in-1' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id as any)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-800 hover:border-cyan-500/60 hover:bg-zinc-900'
                      : 'bg-zinc-50 border-zinc-200 hover:border-cyan-500 hover:bg-white'
                  }`}
                >
                  <span className="font-semibold text-xs text-cyan-400 flex items-center justify-between">
                    {p.label}
                  </span>
                  <span className={`text-[10px] leading-tight ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Row Sequence */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Workbench Rows & Combinations
              </span>
              <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {layout.rows.length} Total Rows
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {layout.rows.map((row, rowIndex) => {
                const isDouble = row.sections.length >= 2;

                return (
                  <div
                    key={row.id}
                    className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-colors ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    {/* Row Header info */}
                    <div className="flex items-center justify-between border-b pb-2 border-zinc-800/40">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {rowIndex + 1}
                        </span>
                        <span className="text-xs font-semibold">
                          {isDouble ? '2-in-1 Row (Side-by-Side)' : 'Single-Section Row (100% Full Width)'}
                        </span>
                        {isDouble && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                            Movable Divider: {Math.round(row.splitRatio)}% / {100 - Math.round(row.splitRatio)}%
                          </span>
                        )}
                      </div>

                      {/* Row Reordering Controls */}
                      <div className="flex items-center gap-1">
                        {isDouble && (
                          <>
                            <button
                              type="button"
                              onClick={() => swapRowSections(rowIndex)}
                              className={`p-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                                isDark
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                                  : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                              }`}
                              title="Swap Left and Right sections in this row"
                            >
                              <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                              <span className="text-[10px] hidden sm:inline">Swap</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => splitRow(rowIndex)}
                              className={`p-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                                isDark
                                  ? 'bg-zinc-900 border-zinc-800 text-amber-300 hover:text-white'
                                  : 'bg-white border-zinc-300 text-amber-700 hover:bg-zinc-100'
                              }`}
                              title="Separate this 2-in-1 row into two independent full-width rows"
                            >
                              <Split className="w-3 h-3 text-amber-400" />
                              <span className="text-[10px] hidden sm:inline">Separate</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          disabled={rowIndex === 0}
                          onClick={() => moveRow(rowIndex, 'up')}
                          className={`p-1 rounded border transition-colors disabled:opacity-30 ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                              : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                          }`}
                          title="Move Row Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={rowIndex === layout.rows.length - 1}
                          onClick={() => moveRow(rowIndex, 'down')}
                          className={`p-1 rounded border transition-colors disabled:opacity-30 ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                              : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                          }`}
                          title="Move Row Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Section items inside this row */}
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch pt-1">
                      {row.sections.map((sId, sIdx) => {
                        const meta = SECTION_METADATA[sId];
                        const isVisible = layout.visible[sId];

                        return (
                          <div
                            key={sId}
                            className={`flex-1 flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                              isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-zinc-800/80 shrink-0">
                                {SECTION_ICONS[sId]}
                              </div>
                              <div>
                                <h4 className="font-semibold text-xs sm:text-sm">{meta.name}</h4>
                                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                  {isDouble ? (sIdx === 0 ? 'Left Side' : 'Right Side') : 'Full Width'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleVisibility(sId)}
                              className={`p-1.5 rounded border transition-colors ${
                                isVisible
                                  ? isDark
                                    ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'
                                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                                  : 'border-red-900/60 bg-red-950/40 text-red-400'
                              }`}
                              title={isVisible ? 'Hide Section' : 'Show Section'}
                            >
                              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-t ${
            isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <button
            type="button"
            onClick={onResetLayout}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                : 'border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
