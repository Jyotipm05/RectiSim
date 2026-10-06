import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CircuitParams, AppTheme } from './types/circuit';
import { simulateCircuit } from './utils/simulation';
import { Header } from './components/Header';
import { CircuitControls } from './components/CircuitControls';
import { SchematicViewer } from './components/SchematicViewer';
import { Oscilloscope } from './components/Oscilloscope';
import { AnalysisMetrics } from './components/AnalysisMetrics';
import { FormulaReference } from './components/FormulaReference';
import { ExportSummaryModal } from './components/ExportSummaryModal';
import { LayoutConfigModal } from './components/LayoutConfigModal';
import { LayoutConfig, DEFAULT_LAYOUT_CONFIG, SectionId, RowSpan, SECTION_METADATA } from './types/layout';
import {
  MoveUp,
  MoveDown,
  ChevronDown,
  ChevronUp,
  Maximize2,
  GripVertical,
  LayoutGrid,
  Columns2,
  Rows3,
  Grid2X2,
  Sliders,
  Activity,
  Cpu,
  BarChart2,
  Settings2,
} from 'lucide-react';

const DEFAULT_PARAMS: CircuitParams = {
  deviceType: 'thyristor',
  phase: '1phase',
  config: 'full-wave',
  loadType: 'RL',
  firingAngle: 45,
  sourceVrms: 230,
  frequency: 50,
  resistance: 20,
  inductance: 50,
  capacitance: 220,
};

export default function App() {
  const [params, setParams] = useState<CircuitParams>(DEFAULT_PARAMS);
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.25);
  const [currentTheta, setCurrentTheta] = useState<number>(0);

  // Modals state
  const [isFormulaOpen, setIsFormulaOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);

  // Layout Configuration with local storage persistence
  const [layout, setLayout] = useState<LayoutConfig>(() => {
    try {
      const saved = localStorage.getItem('rectisim_layout_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_LAYOUT_CONFIG,
          ...parsed,
          rowSpan: {
            ...DEFAULT_LAYOUT_CONFIG.rowSpan,
            ...(parsed.rowSpan || {}),
          },
          sectionOrder: parsed.sectionOrder || DEFAULT_LAYOUT_CONFIG.sectionOrder,
          visible: { ...DEFAULT_LAYOUT_CONFIG.visible, ...(parsed.visible || {}) },
          sectionWidths: { ...DEFAULT_LAYOUT_CONFIG.sectionWidths, ...(parsed.sectionWidths || {}) },
          collapsed: { ...DEFAULT_LAYOUT_CONFIG.collapsed, ...(parsed.collapsed || {}) },
        };
      }
    } catch (e) {
      console.error('Failed to parse saved layout config', e);
    }
    return DEFAULT_LAYOUT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('rectisim_layout_config', JSON.stringify(layout));
    } catch (e) {
      console.error('Failed to save layout config', e);
    }
  }, [layout]);

  // Active view tab on mobile screens (Schematic / Waveforms / Analysis)
  const [activeMobileTab, setActiveMobileTab] = useState<'schematic' | 'waveforms' | 'analysis'>('waveforms');

  // Drag and drop state for reordering
  const [draggingSectionId, setDraggingSectionId] = useState<SectionId | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<SectionId | null>(null);
  const [dropIndicator, setDropIndicator] = useState<'before' | 'after' | null>(null);

  // Reorder sections
  const moveSection = (id: SectionId, direction: 'up' | 'down') => {
    const list = [...layout.sectionOrder];
    const index = list.indexOf(id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    const [item] = list.splice(index, 1);
    list.splice(newIndex, 0, item);
    setLayout((prev) => ({ ...prev, sectionOrder: list }));
  };

  const toggleCollapse = (id: SectionId) => {
    setLayout((prev) => ({
      ...prev,
      collapsed: {
        ...prev.collapsed,
        [id]: !prev.collapsed[id],
      },
    }));
  };

  // Toggle row span: single in a row vs multiple in a row
  const toggleRowSpan = (id: SectionId) => {
    const current = layout.rowSpan?.[id] ?? (layout.sectionWidths?.[id] === 'half' ? 'multiple' : 'single');
    const next: RowSpan = current === 'single' ? 'multiple' : 'single';
    setLayout((prev) => ({
      ...prev,
      rowSpan: {
        ...prev.rowSpan,
        [id]: next,
      },
      sectionWidths: {
        ...prev.sectionWidths,
        [id]: next === 'multiple' ? 'half' : 'full',
      },
    }));
  };

  // Drag-and-drop event handlers
  const handleDragStart = (e: React.DragEvent, id: SectionId) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingSectionId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: SectionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggingSectionId || draggingSectionId === id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isBefore = e.clientY - rect.top < rect.height / 2;
    setDragOverSectionId(id);
    setDropIndicator(isBefore ? 'before' : 'after');
  };

  const handleDragLeave = (e: React.DragEvent, id: SectionId) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverSectionId === id) {
        setDragOverSectionId(null);
        setDropIndicator(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: SectionId) => {
    e.preventDefault();
    if (!draggingSectionId || draggingSectionId === targetId) {
      setDraggingSectionId(null);
      setDragOverSectionId(null);
      setDropIndicator(null);
      return;
    }

    const list = [...layout.sectionOrder];
    const sourceIdx = list.indexOf(draggingSectionId);
    if (sourceIdx === -1) return;

    list.splice(sourceIdx, 1);
    let targetIdx = list.indexOf(targetId);
    if (dropIndicator === 'after') {
      targetIdx += 1;
    }
    list.splice(targetIdx, 0, draggingSectionId);

    setLayout((prev) => ({ ...prev, sectionOrder: list }));
    setDraggingSectionId(null);
    setDragOverSectionId(null);
    setDropIndicator(null);
  };

  const handleDragEnd = () => {
    setDraggingSectionId(null);
    setDragOverSectionId(null);
    setDropIndicator(null);
  };

  // Apply layout presets
  const applyPreset = (preset: 'classic' | 'allSingle' | 'allMultiple' | 'controlsFirst' | 'scopeFirst') => {
    switch (preset) {
      case 'classic':
        setLayout((prev) => ({
          ...prev,
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
        }));
        break;
      case 'allSingle':
        setLayout((prev) => ({
          ...prev,
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
        }));
        break;
      case 'allMultiple':
        setLayout((prev) => ({
          ...prev,
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
        }));
        break;
      case 'controlsFirst':
        setLayout((prev) => ({
          ...prev,
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
        }));
        break;
      case 'scopeFirst':
        setLayout((prev) => ({
          ...prev,
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
        }));
        break;
    }
  };

  // Compute simulation result synchronously whenever params change
  const simulationResult = useMemo(() => {
    return simulateCircuit(params);
  }, [params]);

  // RequestAnimationFrame simulation loop
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const deltaMs = timestamp - lastTimeRef.current;
        const visualSpeedScale = 0.25;
        const degDelta = (360 * params.frequency * (deltaMs / 1000)) * playbackSpeed * visualSpeedScale;

        setCurrentTheta((prev) => (prev + degDelta) % 720);
      }
      lastTimeRef.current = timestamp;
      animationFrameIdRef.current = requestAnimationFrame(animate);
    },
    [isPlaying, playbackSpeed, params.frequency]
  );

  useEffect(() => {
    animationFrameIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [animate]);

  const handleParamChange = (updated: Partial<CircuitParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setCurrentTheta(0);
    setPlaybackSpeed(0.25);
  };

  const handleStep = () => {
    setIsPlaying(false);
    setCurrentTheta((prev) => (prev + 5) % 720);
  };

  const currentPoint = useMemo(() => {
    const list = simulationResult.waveforms;
    if (!list || list.length === 0) return null;
    const target = currentTheta % 720;
    let closest = list[0];
    let minDiff = 999;
    for (const pt of list) {
      const diff = Math.abs(pt.thetaDeg - target);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }
    return closest;
  }, [simulationResult.waveforms, currentTheta]);

  const conductingDevices = currentPoint?.conductingDevices || [];
  const instantVout = currentPoint?.vOut || 0;
  const instantIout = currentPoint?.iOut || 0;
  const instantVsA = currentPoint?.vSourceA || 0;
  const isGateActive = Boolean(currentPoint?.gatePulse);

  const isDark = theme === 'dark';

  // Section Component Renderers
  const renderOscilloscopeComponent = () => (
    <Oscilloscope
      waveforms={simulationResult.waveforms}
      params={params}
      theme={theme}
      currentThetaDeg={currentTheta}
      isPlaying={isPlaying}
      playbackSpeed={playbackSpeed}
      vAvg={simulationResult.metrics.vAvg}
      onTogglePlay={() => setIsPlaying(!isPlaying)}
      onSetSpeed={setPlaybackSpeed}
      onStep={handleStep}
      onResetTheta={() => setCurrentTheta(0)}
      onSeekTheta={(theta) => {
        setIsPlaying(false);
        setCurrentTheta(theta);
      }}
    />
  );

  const renderSchematicComponent = () => (
    <SchematicViewer
      params={params}
      theme={theme}
      conductingDevices={conductingDevices}
      instantVout={instantVout}
      instantIout={instantIout}
      instantVsA={instantVsA}
      instantVsB={currentPoint?.vSourceB}
      instantVsC={currentPoint?.vSourceC}
      isPlaying={isPlaying}
      playbackSpeed={playbackSpeed}
      gateActive={isGateActive}
      thetaDeg={currentTheta}
    />
  );

  const renderControlsComponent = () => (
    <CircuitControls params={params} theme={theme} onChange={handleParamChange} />
  );

  const renderAnalysisComponent = () => (
    <AnalysisMetrics
      metrics={simulationResult.metrics}
      params={params}
      theme={theme}
      conductionSummary={simulationResult.conductionSummary}
      harmonics={simulationResult.harmonics}
    />
  );

  // Render Section by SectionId
  const renderSectionContent = (id: SectionId) => {
    switch (id) {
      case 'oscilloscope':
        return renderOscilloscopeComponent();
      case 'schematic':
        return renderSchematicComponent();
      case 'controls':
        return renderControlsComponent();
      case 'analysis':
        return renderAnalysisComponent();
      default:
        return null;
    }
  };

  const getSectionIcon = (id: SectionId) => {
    switch (id) {
      case 'oscilloscope':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'schematic':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'controls':
        return <Sliders className="w-4 h-4 text-amber-400" />;
      case 'analysis':
        return <BarChart2 className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-black text-zinc-100' : 'bg-zinc-100 text-zinc-900'
      }`}
    >
      {/* 3-Zone Clean Header */}
      <Header
        params={params}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onSelectPreset={handleParamChange}
        onReset={handleReset}
        onOpenFormulas={() => setIsFormulaOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenLayoutConfig={() => setIsLayoutModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
        {/* Mobile View Switcher (Visible only on small viewports) */}
        <div
          className={`flex sm:hidden p-1 rounded-lg border transition-colors ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-200 border-zinc-300'
          }`}
        >
          <button
            onClick={() => setActiveMobileTab('waveforms')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
              activeMobileTab === 'waveforms'
                ? isDark
                  ? 'bg-zinc-800 text-cyan-300 font-semibold'
                  : 'bg-white text-cyan-700 font-semibold shadow-xs'
                : isDark
                ? 'text-zinc-400'
                : 'text-zinc-600'
            }`}
          >
            Oscilloscope
          </button>
          <button
            onClick={() => setActiveMobileTab('schematic')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
              activeMobileTab === 'schematic'
                ? isDark
                  ? 'bg-zinc-800 text-cyan-300 font-semibold'
                  : 'bg-white text-cyan-700 font-semibold shadow-xs'
                : isDark
                ? 'text-zinc-400'
                : 'text-zinc-600'
            }`}
          >
            Schematic
          </button>
          <button
            onClick={() => setActiveMobileTab('analysis')}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
              activeMobileTab === 'analysis'
                ? isDark
                  ? 'bg-zinc-800 text-cyan-300 font-semibold'
                  : 'bg-white text-cyan-700 font-semibold shadow-xs'
                : isDark
                ? 'text-zinc-400'
                : 'text-zinc-600'
            }`}
          >
            Analysis
          </button>
        </div>

        {/* Quick UI Layout & Row Presets Bar */}
        <div
          className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 transition-colors ${
            isDark
              ? 'bg-zinc-950/80 border-zinc-800/80 text-zinc-300'
              : 'bg-white border-zinc-200 text-zinc-700 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Section Layout:</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => applyPreset('classic')}
                className={`px-2.5 py-1 rounded-lg border transition-colors ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                }`}
                title="Scope + Schematic side-by-side, Controls & Analysis full row"
              >
                Classic Lab
              </button>
              <button
                type="button"
                onClick={() => applyPreset('allSingle')}
                className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                }`}
                title="All 4 sections single in a row (100% full width)"
              >
                <Rows3 className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">All Single in Row</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('allMultiple')}
                className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                }`}
                title="All sections multiple in a row (2x2 side-by-side grid)"
              >
                <Grid2X2 className="w-3 h-3 text-cyan-400" />
                <span className="hidden md:inline">All Multiple in Row</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('controlsFirst')}
                className={`px-2.5 py-1 rounded-lg border transition-colors hidden lg:inline-flex ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                }`}
                title="Controls single row on top, then Scope & Schematic side-by-side"
              >
                Controls on Top
              </button>
            </div>
          </div>

          {/* Configure Positions & Rows Modal Button */}
          <button
            type="button"
            onClick={() => setIsLayoutModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure Sections & Rows</span>
          </button>
        </div>

        {/* Dynamic Drag-and-Drop Responsive Grid of Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {layout.sectionOrder
            .filter((id) => layout.visible[id])
            .map((id, index) => {
              const meta = SECTION_METADATA[id];
              const isCollapsed = Boolean(layout.collapsed[id]);
              const rowSpan: RowSpan =
                layout.rowSpan?.[id] ??
                (layout.sectionWidths?.[id] === 'half' ? 'multiple' : 'single');
              const isSingleInRow = rowSpan === 'single';

              // Single in a row spans 12 columns (100%), Multiple in a row spans 6 columns (50%)
              const colSpanClass = isSingleInRow
                ? 'col-span-1 lg:col-span-12'
                : 'col-span-1 lg:col-span-6';

              const isBeingDragged = draggingSectionId === id;
              const isDropTargetBefore = dragOverSectionId === id && dropIndicator === 'before';
              const isDropTargetAfter = dragOverSectionId === id && dropIndicator === 'after';

              // Hide sections on mobile view when other mobile tab is chosen
              const isHiddenOnMobile =
                id === 'oscilloscope'
                  ? activeMobileTab !== 'waveforms'
                  : id === 'schematic'
                  ? activeMobileTab !== 'schematic'
                  : id === 'analysis'
                  ? activeMobileTab !== 'analysis'
                  : false;

              return (
                <div
                  key={id}
                  onDragOver={(e) => handleDragOver(e, id)}
                  onDragLeave={(e) => handleDragLeave(e, id)}
                  onDrop={(e) => handleDrop(e, id)}
                  className={`relative flex flex-col gap-2 rounded-2xl p-2 sm:p-2.5 border transition-all duration-150 ${colSpanClass} ${
                    isHiddenOnMobile ? 'hidden sm:flex' : 'flex'
                  } ${
                    isBeingDragged
                      ? 'opacity-40 scale-[0.99] border-dashed border-cyan-400 bg-cyan-950/20'
                      : dragOverSectionId === id
                      ? 'ring-2 ring-cyan-400 bg-cyan-950/10'
                      : isDark
                      ? 'bg-zinc-950/40 border-zinc-800/80'
                      : 'bg-zinc-100/60 border-zinc-200'
                  }`}
                >
                  {/* Drop indicator before */}
                  {isDropTargetBefore && (
                    <div className="absolute -top-3 left-2 right-2 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,1)] z-30 flex items-center justify-center animate-pulse">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold shadow-md uppercase tracking-wider">
                        Drop to place before {meta.name}
                      </span>
                    </div>
                  )}

                  {/* Drop indicator after */}
                  {isDropTargetAfter && (
                    <div className="absolute -bottom-3 left-2 right-2 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,1)] z-30 flex items-center justify-center animate-pulse">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold shadow-md uppercase tracking-wider">
                        Drop to place after {meta.name}
                      </span>
                    </div>
                  )}

                  {/* Card Header Toolbar with Drag Handle & Configurable Row Span Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-xs select-none border-b pb-2 border-zinc-800/40">
                    {/* Left: Drag Handle, Icon, Title, Position Badge */}
                    <div className="flex items-center gap-2">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, id)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-zinc-800/40 hover:bg-cyan-500/10 border border-zinc-700/50 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300 transition-all flex items-center gap-1 shadow-xs group"
                        title="Hold and drag to reorder this section"
                      >
                        <GripVertical className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium hidden sm:inline">Drag</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-semibold">
                        {getSectionIcon(id)}
                        <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{meta.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-800 text-cyan-300'
                              : 'bg-white border-zinc-200 text-cyan-700'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Right: Row Span Toggle (Single / Multiple in a row), Move Up/Down, Collapse */}
                    <div className="flex items-center gap-1.5">
                      {/* Row Span Config Button */}
                      <button
                        type="button"
                        onClick={() => toggleRowSpan(id)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all flex items-center gap-1.5 shadow-xs ${
                          isSingleInRow
                            ? isDark
                              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-950/70 hover:border-amber-700'
                              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                            : isDark
                            ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:bg-cyan-950/70 hover:border-cyan-700'
                            : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100'
                        }`}
                        title={
                          isSingleInRow
                            ? 'Currently Single in a row (100% full width alone). Click to make Multiple in a row (50% side-by-side).'
                            : 'Currently Multiple in a row (50% side-by-side). Click to make Single in a row (100% full width alone).'
                        }
                      >
                        {isSingleInRow ? (
                          <>
                            <Maximize2 className="w-3 h-3 text-amber-400" />
                            <span className="font-semibold">Single in row (100%)</span>
                          </>
                        ) : (
                          <>
                            <Columns2 className="w-3 h-3 text-cyan-400" />
                            <span className="font-semibold">Multiple in row (50%)</span>
                          </>
                        )}
                      </button>

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSection(id, 'up')}
                        className={`p-1 rounded border transition-colors disabled:opacity-30 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                        }`}
                        title="Move Section Up / Earlier"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={index === layout.sectionOrder.length - 1}
                        onClick={() => moveSection(id, 'down')}
                        className={`p-1 rounded border transition-colors disabled:opacity-30 ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                        }`}
                        title="Move Section Down / Later"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Collapse / Expand */}
                      <button
                        type="button"
                        onClick={() => toggleCollapse(id)}
                        className={`p-1 rounded border transition-colors ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                        }`}
                        title={isCollapsed ? 'Expand Section' : 'Collapse Section'}
                      >
                        {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </button>

                      {/* Settings Modal Button */}
                      <button
                        type="button"
                        onClick={() => setIsLayoutModalOpen(true)}
                        className={`p-1 rounded border transition-colors ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-800 text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800'
                            : 'bg-white border-zinc-300 text-cyan-600 hover:bg-zinc-100'
                        }`}
                        title="Configure UI Sections & Rows"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  {!isCollapsed ? (
                    <div>{renderSectionContent(id)}</div>
                  ) : (
                    <div
                      onClick={() => toggleCollapse(id)}
                      className={`p-3 rounded-xl border border-dashed cursor-pointer text-center text-xs transition-colors ${
                        isDark
                          ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          : 'bg-zinc-50 border-zinc-300 text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      {meta.name} is collapsed. Click to expand.
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </main>

      {/* Theory & Formula Reference Modal */}
      <FormulaReference
        isOpen={isFormulaOpen}
        theme={theme}
        onClose={() => setIsFormulaOpen(false)}
      />

      {/* Export Summary Modal */}
      <ExportSummaryModal
        isOpen={isExportOpen}
        theme={theme}
        onClose={() => setIsExportOpen(false)}
        params={params}
        metrics={simulationResult.metrics}
        simulationResult={simulationResult}
      />

      {/* Layout Configuration Modal */}
      <LayoutConfigModal
        isOpen={isLayoutModalOpen}
        theme={theme}
        layout={layout}
        onUpdateLayout={(newLayout) => setLayout(newLayout)}
        onResetLayout={() => setLayout(DEFAULT_LAYOUT_CONFIG)}
        onClose={() => setIsLayoutModalOpen(false)}
      />
    </div>
  );
}
