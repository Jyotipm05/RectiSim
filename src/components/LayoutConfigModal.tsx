import React, { useState } from 'react';
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
  Grid2X2,
  Sliders,
  Activity,
  Cpu,
  BarChart2,
  Check,
  Maximize2,
  GripVertical,
} from 'lucide-react';
import {
  LayoutConfig,
  SectionId,
  RowSpan,
  SECTION_METADATA,
  DEFAULT_LAYOUT_CONFIG,
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
  const [draggedId, setDraggedId] = useState<SectionId | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Move a section up or down in the sectionOrder array
  const moveSection = (id: SectionId, direction: 'up' | 'down') => {
    const list = [...layout.sectionOrder];
    const index = list.indexOf(id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    const [item] = list.splice(index, 1);
    list.splice(newIndex, 0, item);
    onUpdateLayout({ ...layout, sectionOrder: list });
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

  // Toggle row span: single in a row vs multiple in a row
  const toggleRowSpan = (id: SectionId) => {
    const current = layout.rowSpan?.[id] ?? (layout.sectionWidths?.[id] === 'half' ? 'multiple' : 'single');
    const next: RowSpan = current === 'single' ? 'multiple' : 'single';
    onUpdateLayout({
      ...layout,
      rowSpan: {
        ...layout.rowSpan,
        [id]: next,
      },
      sectionWidths: {
        ...layout.sectionWidths,
        [id]: next === 'multiple' ? 'half' : 'full',
      },
    });
  };

  // Drag and drop reordering inside modal
  const handleDragStart = (id: SectionId) => {
    setDraggedId(id);
  };

  const handleDrop = (targetId: SectionId) => {
    if (!draggedId || draggedId === targetId) return;
    const list = [...layout.sectionOrder];
    const sourceIdx = list.indexOf(draggedId);
    const targetIdx = list.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const [item] = list.splice(sourceIdx, 1);
    list.splice(targetIdx, 0, item);
    onUpdateLayout({ ...layout, sectionOrder: list });
    setDraggedId(null);
  };

  // Apply a predefined layout configuration
  const applyPreset = (preset: 'classic' | 'allSingle' | 'allMultiple' | 'controlsFirst' | 'scopeFirst') => {
    switch (preset) {
      case 'classic':
        onUpdateLayout({
          ...layout,
          mode: 'custom',
          sectionOrder: ['oscilloscope', 'schematic', 'controls', 'analysis'],
          rowSpan: {
            oscilloscope: 'multiple',
            schematic: 'multiple',
            controls: 'single',
            analysis: 'single',
          },
          sectionWidths: {
            oscilloscope: 'half',
            schematic: 'half',
            controls: 'full',
            analysis: 'full',
          },
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
      case 'allSingle':
        onUpdateLayout({
          ...layout,
          mode: 'custom',
          sectionOrder: ['oscilloscope', 'schematic', 'controls', 'analysis'],
          rowSpan: {
            oscilloscope: 'single',
            schematic: 'single',
            controls: 'single',
            analysis: 'single',
          },
          sectionWidths: {
            oscilloscope: 'full',
            schematic: 'full',
            controls: 'full',
            analysis: 'full',
          },
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
      case 'allMultiple':
        onUpdateLayout({
          ...layout,
          mode: 'custom',
          sectionOrder: ['oscilloscope', 'schematic', 'controls', 'analysis'],
          rowSpan: {
            oscilloscope: 'multiple',
            schematic: 'multiple',
            controls: 'multiple',
            analysis: 'multiple',
          },
          sectionWidths: {
            oscilloscope: 'half',
            schematic: 'half',
            controls: 'half',
            analysis: 'half',
          },
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
      case 'controlsFirst':
        onUpdateLayout({
          ...layout,
          mode: 'custom',
          sectionOrder: ['controls', 'oscilloscope', 'schematic', 'analysis'],
          rowSpan: {
            controls: 'single',
            oscilloscope: 'multiple',
            schematic: 'multiple',
            analysis: 'single',
          },
          sectionWidths: {
            controls: 'full',
            oscilloscope: 'half',
            schematic: 'half',
            analysis: 'full',
          },
          visible: { oscilloscope: true, schematic: true, controls: true, analysis: true },
        });
        break;
      case 'scopeFirst':
        onUpdateLayout({
          ...layout,
          mode: 'custom',
          sectionOrder: ['oscilloscope', 'schematic', 'controls', 'analysis'],
          rowSpan: {
            oscilloscope: 'single',
            schematic: 'single',
            controls: 'multiple',
            analysis: 'multiple',
          },
          sectionWidths: {
            oscilloscope: 'full',
            schematic: 'full',
            controls: 'half',
            analysis: 'half',
          },
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
              <h2 className="font-bold text-base tracking-wide">Configure UI Sections & Rows</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Drag and drop sections to reorder and configure single or multiple in a row
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'classic', label: 'Classic Lab', desc: 'Scope + Schematic side-by-side, Controls & Analysis full row' },
                { id: 'allSingle', label: 'All Single in Row', desc: 'Every section spans 100% full width alone' },
                { id: 'allMultiple', label: 'All Multiple in Row', desc: '2 in a row side-by-side grid for all sections' },
                { id: 'controlsFirst', label: 'Controls on Top', desc: 'Controls full row, then Scope + Schematic side-by-side' },
                { id: 'scopeFirst', label: 'Scope Full on Top', desc: 'Scope & Schematic full rows, Controls & Analysis side-by-side' },
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

          {/* Section Ordering & Row Span Configuration */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Section Positions & Row Spans
              </span>
              <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Drag handles to reorder sequence
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {layout.sectionOrder.map((sectionId, index) => {
                const meta = SECTION_METADATA[sectionId];
                const isVisible = layout.visible[sectionId];
                const rowSpan: RowSpan =
                  layout.rowSpan?.[sectionId] ??
                  (layout.sectionWidths?.[sectionId] === 'half' ? 'multiple' : 'single');

                return (
                  <div
                    key={sectionId}
                    draggable
                    onDragStart={() => handleDragStart(sectionId)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(sectionId)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      draggedId === sectionId ? 'opacity-40 border-cyan-500' : ''
                    } ${
                      !isVisible
                        ? isDark
                          ? 'bg-zinc-950/50 border-zinc-900 opacity-60'
                          : 'bg-zinc-100/50 border-zinc-200 opacity-60'
                        : isDark
                        ? 'bg-zinc-950 border-zinc-800'
                        : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    {/* Left: Drag Handle, Number, Icon & Label */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-cyan-400 transition-colors"
                        title="Drag to reorder position"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>

                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="p-1.5 rounded-lg bg-zinc-800/60 shrink-0">
                        {SECTION_ICONS[sectionId]}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm">{meta.name}</h4>
                          {!isVisible && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {meta.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Right: Row Span Toggle, Up/Down & Visibility */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {/* Row Span Config Button */}
                      <button
                        type="button"
                        onClick={() => toggleRowSpan(sectionId)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                          rowSpan === 'single'
                            ? isDark
                              ? 'bg-amber-950/30 border-amber-800/50 text-amber-300 hover:bg-amber-950/50'
                              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                            : isDark
                            ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:bg-cyan-950/60'
                            : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100'
                        }`}
                        title={
                          rowSpan === 'single'
                            ? 'Configured as Single in a row (100% full width alone). Click to make Multiple in a row (50%).'
                            : 'Configured as Multiple in a row (50% side-by-side). Click to make Single in a row (100%).'
                        }
                      >
                        {rowSpan === 'single' ? (
                          <>
                            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Single in row</span>
                          </>
                        ) : (
                          <>
                            <Columns2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Multiple in row</span>
                          </>
                        )}
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleVisibility(sectionId)}
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

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSection(sectionId, 'up')}
                        className={`p-1.5 rounded border transition-colors disabled:opacity-30 ${
                          isDark
                            ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                        }`}
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={index === layout.sectionOrder.length - 1}
                        onClick={() => moveSection(sectionId, 'down')}
                        className={`p-1.5 rounded border transition-colors disabled:opacity-30 ${
                          isDark
                            ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                        }`}
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
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
