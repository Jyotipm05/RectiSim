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
import {
  LayoutConfig,
  LayoutRow,
  DEFAULT_LAYOUT_CONFIG,
  SectionId,
  SECTION_METADATA,
  normalizeLayoutConfig,
} from './types/layout';
import {
  MoveUp,
  MoveDown,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LayoutGrid,
  Columns2,
  Rows3,
  Sliders,
  Activity,
  Cpu,
  BarChart2,
  Settings2,
  Split,
  ArrowLeftRight,
  Plus,
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

const ALL_SECTION_IDS: SectionId[] = ['oscilloscope', 'schematic', 'controls', 'analysis'];

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

  // Layout Configuration with local storage persistence and schema normalization
  const [layout, setLayout] = useState<LayoutConfig>(() => {
    try {
      const saved = localStorage.getItem('rectisim_layout_config');
      if (saved) {
        return normalizeLayoutConfig(JSON.parse(saved));
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

  // --- Bulletproof Drag & Drop Engine (Movable Divider & Section Drag) ---
  const [draggingSectionInfo, setDraggingSectionInfo] = useState<{
    sectionId: SectionId;
    fromRowId: string;
  } | null>(null);
  const [dragCursor, setDragCursor] = useState<{ x: number; y: number } | null>(null);

  // Hover combine target state (when hovering directly over a single-in-a-row section card)
  const [hoverCombineTarget, setHoverCombineTarget] = useState<{
    targetRowId: string;
    targetSectionId: SectionId;
    side: 'left' | 'right';
  } | null>(null);

  // Hover inter-row drop target state (start of page, between rows, or end of page)
  const [hoverInterRowIndex, setHoverInterRowIndex] = useState<number | null>(null);

  // Active draggable divider for 2-in-1 rows
  const [activeDraggingRowId, setActiveDraggingRowId] = useState<string | null>(null);
  const rowContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Combine dropdown popover state
  const [activeCombineMenuSection, setActiveCombineMenuSection] = useState<SectionId | null>(null);

  const [isLgScreen, setIsLgScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => setIsLgScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Movable Divider for 2-in-1 rows (Adjustable to both sides) ---
  const startDividerDrag = (
    e: React.MouseEvent | React.TouchEvent | React.PointerEvent,
    rowId: string
  ) => {
    e.preventDefault();
    setActiveDraggingRowId(rowId);

    const container = rowContainerRefs.current[rowId];
    if (!container) return;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const totalWidth = rect.width;
      if (totalWidth <= 0) return;
      const offset = clientX - rect.left;
      // Clamp split ratio between 20% and 80% to ensure both sides remain usable
      const newRatio = Math.min(80, Math.max(20, (offset / totalWidth) * 100));

      setLayout((prev) => ({
        ...prev,
        rows: prev.rows.map((r) =>
          r.id === rowId ? { ...r, splitRatio: newRatio } : r
        ),
      }));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setActiveDraggingRowId(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
  };

  // Reset split ratio of a 2-in-1 row on double click
  const resetRowSplit = (rowId: string) => {
    setLayout((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => {
        if (r.id === rowId) {
          const isScopeSchematic =
            r.sections.includes('oscilloscope') && r.sections.includes('schematic');
          return { ...r, splitRatio: isScopeSchematic ? 58 : 50 };
        }
        return r;
      }),
    }));
  };

  // Move entire row up or down
  const moveRow = (rowIndex: number, direction: 'up' | 'down') => {
    const list = [...layout.rows];
    const newIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    const [item] = list.splice(rowIndex, 1);
    list.splice(newIndex, 0, item);
    setLayout((prev) => ({ ...prev, rows: list }));
  };

  // Split a 2-in-1 row into two separate single-in-a-row rows (Disables 2-in-1 row)
  const splitRow = (rowId: string, sectionToExtract?: SectionId) => {
    setLayout((prev) => {
      const list: LayoutRow[] = [];
      for (const r of prev.rows) {
        if (r.id === rowId && r.sections.length === 2) {
          const s1 = r.sections[0];
          const s2 = r.sections[1];
          if (sectionToExtract && sectionToExtract === s1) {
            list.push({ id: `row-${s2}`, sections: [s2], splitRatio: 50 });
            list.push({ id: `row-${s1}`, sections: [s1], splitRatio: 50 });
          } else {
            list.push({ id: `row-${s1}`, sections: [s1], splitRatio: 50 });
            list.push({ id: `row-${s2}`, sections: [s2], splitRatio: 50 });
          }
        } else {
          list.push(r);
        }
      }
      return { ...prev, rows: list };
    });
  };

  // Swap sections inside a 2-in-1 row
  const swapRowSections = (rowId: string) => {
    setLayout((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => {
        if (r.id === rowId && r.sections.length === 2) {
          return {
            ...r,
            sections: [r.sections[1], r.sections[0]],
            splitRatio: 100 - r.splitRatio,
          };
        }
        return r;
      }),
    }));
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

  // Combine two sections directly (1-click helper)
  const combineSectionsDirectly = (sectionA: SectionId, sectionB: SectionId) => {
    setLayout((prev) => {
      // 1. Remove sectionB from its existing row
      const newRows: LayoutRow[] = [];
      for (const r of prev.rows) {
        const remaining = r.sections.filter((s) => s !== sectionB);
        if (remaining.length > 0) {
          newRows.push({ ...r, sections: remaining, splitRatio: 50 });
        }
      }

      // 2. Add sectionB to the row that contains sectionA
      const combinedRows = newRows.map((r) => {
        if (r.sections.includes(sectionA) && r.sections.length === 1) {
          const pair: SectionId[] = [sectionA, sectionB];
          const isScopeSchematic = pair.includes('oscilloscope') && pair.includes('schematic');
          return {
            ...r,
            sections: pair,
            splitRatio: isScopeSchematic ? (pair[0] === 'oscilloscope' ? 58 : 42) : 50,
          };
        }
        return r;
      });

      return { ...prev, rows: combinedRows };
    });
    setActiveCombineMenuSection(null);
  };

  // --- Drop Execution Handlers ---
  const handleDropInterRow = (sectionId: SectionId, fromRowId: string, targetIndex: number) => {
    setLayout((prev) => {
      // 1. Remove sectionId from source row
      const newRows: LayoutRow[] = [];
      let sourceIndex = -1;
      let wasDouble = false;

      for (let i = 0; i < prev.rows.length; i++) {
        const r = prev.rows[i];
        if (r.id === fromRowId) {
          sourceIndex = i;
          if (r.sections.length >= 2) {
            wasDouble = true;
          }
          const remaining = r.sections.filter((s) => s !== sectionId);
          if (remaining.length > 0) {
            // The other section remains as a single row (2-in-1 row is dissolved!)
            newRows.push({ ...r, sections: remaining, splitRatio: 50 });
          }
        } else {
          newRows.push(r);
        }
      }

      // 2. Insert as a new single-section row at targetIndex
      const newRow: LayoutRow = {
        id: `row-${sectionId}-${Date.now()}`,
        sections: [sectionId],
        splitRatio: 50,
      };

      let insertIndex = targetIndex;
      if (!wasDouble && sourceIndex !== -1 && targetIndex > sourceIndex) {
        insertIndex = Math.max(0, targetIndex - 1);
      }
      const clampedIndex = Math.min(newRows.length, Math.max(0, insertIndex));
      newRows.splice(clampedIndex, 0, newRow);

      return { ...prev, rows: newRows };
    });
  };

  const handleDropCombine = (
    sectionId: SectionId,
    fromRowId: string,
    targetRowId: string,
    targetSectionId: SectionId,
    side: 'left' | 'right'
  ) => {
    if (sectionId === targetSectionId) return;

    setLayout((prev) => {
      // 1. Remove sectionId from source row (if it was in a 2-in-1 row, the remaining section becomes a single row)
      const newRows: LayoutRow[] = [];
      for (const r of prev.rows) {
        if (r.id === fromRowId) {
          const remaining = r.sections.filter((s) => s !== sectionId);
          if (remaining.length > 0) {
            newRows.push({ ...r, sections: remaining, splitRatio: 50 });
          }
        } else {
          newRows.push(r);
        }
      }

      // 2. Combine into targetRow (creates a 2-in-1 row with movable divider!)
      const combinedRows = newRows.map((r) => {
        if (r.id === targetRowId && r.sections.length === 1) {
          const pair: SectionId[] =
            side === 'left' ? [sectionId, targetSectionId] : [targetSectionId, sectionId];
          const isScopeSchematic = pair.includes('oscilloscope') && pair.includes('schematic');
          return {
            ...r,
            sections: pair,
            splitRatio: isScopeSchematic ? (pair[0] === 'oscilloscope' ? 58 : 42) : 50,
          };
        }
        return r;
      });

      return { ...prev, rows: combinedRows };
    });
  };

  // --- Immediate Section Drag Handler ---
  const startSectionDrag = (
    e: React.PointerEvent | React.MouseEvent,
    sectionId: SectionId,
    fromRowId: string
  ) => {
    if ('button' in e && e.button !== 0) return; // Primary mouse button only
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    setDraggingSectionInfo({ sectionId, fromRowId });
    setDragCursor({ x: startX, y: startY });

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    const getDropTarget = (cx: number, cy: number) => {
      const elements = document.elementsFromPoint(cx, cy);

      // Check if hovering over a combine target (single-row section card)
      for (const el of elements) {
        if (el.hasAttribute('data-drop-type-combine')) {
          const tRowId = el.getAttribute('data-row-id');
          const tSectionId = el.getAttribute('data-section-id') as SectionId;
          if (tRowId && tSectionId && tSectionId !== sectionId) {
            const rect = el.getBoundingClientRect();
            const isLeft = cx < rect.left + rect.width / 2;
            return {
              type: 'combine' as const,
              targetRowId: tRowId,
              targetSectionId: tSectionId,
              side: isLeft ? ('left' as const) : ('right' as const),
            };
          }
        }
      }

      // Check if hovering over an inter-row drop zone
      for (const el of elements) {
        if (el.hasAttribute('data-drop-type-inter-row')) {
          const idxStr = el.getAttribute('data-drop-index');
          if (idxStr !== null) {
            return {
              type: 'inter-row' as const,
              targetIndex: parseInt(idxStr, 10),
            };
          }
        }
      }

      return null;
    };

    let latestTarget: ReturnType<typeof getDropTarget> = null;

    const onPointerMove = (ev: PointerEvent | MouseEvent) => {
      setDragCursor({ x: ev.clientX, y: ev.clientY });
      const target = getDropTarget(ev.clientX, ev.clientY);
      latestTarget = target;
      if (target?.type === 'combine') {
        setHoverCombineTarget({
          targetRowId: target.targetRowId,
          targetSectionId: target.targetSectionId,
          side: target.side,
        });
        setHoverInterRowIndex(null);
      } else if (target?.type === 'inter-row') {
        setHoverInterRowIndex(target.targetIndex);
        setHoverCombineTarget(null);
      } else {
        setHoverCombineTarget(null);
        setHoverInterRowIndex(null);
      }
    };

    const onPointerUp = (ev: PointerEvent | MouseEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      const finalTarget = latestTarget || getDropTarget(ev.clientX, ev.clientY);

      if (finalTarget) {
        if (finalTarget.type === 'combine') {
          handleDropCombine(
            sectionId,
            fromRowId,
            finalTarget.targetRowId,
            finalTarget.targetSectionId,
            finalTarget.side
          );
        } else if (finalTarget.type === 'inter-row') {
          handleDropInterRow(sectionId, fromRowId, finalTarget.targetIndex);
        }
      }

      setDraggingSectionInfo(null);
      setDragCursor(null);
      setHoverCombineTarget(null);
      setHoverInterRowIndex(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
  };

  // Apply layout presets
  const applyPreset = (preset: 'classic' | 'allSingle' | 'twoDouble' | 'controlsFirst') => {
    switch (preset) {
      case 'classic':
        setLayout((prev) => ({
          ...prev,
          rows: [
            { id: 'row-visualizers', sections: ['oscilloscope', 'schematic'], splitRatio: 58 },
            { id: 'row-controls', sections: ['controls'], splitRatio: 50 },
            { id: 'row-analysis', sections: ['analysis'], splitRatio: 50 },
          ],
        }));
        break;
      case 'allSingle':
        setLayout((prev) => ({
          ...prev,
          rows: [
            { id: 'row-oscilloscope', sections: ['oscilloscope'], splitRatio: 50 },
            { id: 'row-schematic', sections: ['schematic'], splitRatio: 50 },
            { id: 'row-controls', sections: ['controls'], splitRatio: 50 },
            { id: 'row-analysis', sections: ['analysis'], splitRatio: 50 },
          ],
        }));
        break;
      case 'twoDouble':
        setLayout((prev) => ({
          ...prev,
          rows: [
            { id: 'row-visualizers', sections: ['oscilloscope', 'schematic'], splitRatio: 50 },
            { id: 'row-dash', sections: ['controls', 'analysis'], splitRatio: 50 },
          ],
        }));
        break;
      case 'controlsFirst':
        setLayout((prev) => ({
          ...prev,
          rows: [
            { id: 'row-controls', sections: ['controls'], splitRatio: 50 },
            { id: 'row-visualizers', sections: ['oscilloscope', 'schematic'], splitRatio: 58 },
            { id: 'row-analysis', sections: ['analysis'], splitRatio: 50 },
          ],
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

  // Helper component to render an inter-row drop zone (for dropping at start of page, end of page, or in-between rows)
  const renderInterRowDropZone = (dropIndex: number, label: string) => {
    if (!draggingSectionInfo) return null;

    const isHovered = hoverInterRowIndex === dropIndex;

    return (
      <div
        data-drop-type-inter-row="true"
        data-drop-index={dropIndex}
        className={`w-full py-3 px-4 rounded-xl border-2 border-dashed transition-all duration-150 flex items-center justify-center gap-2 select-none ${
          isHovered
            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 scale-[1.01] shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-2 ring-cyan-400'
            : isDark
            ? 'border-zinc-800/80 bg-zinc-950/40 text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-300'
            : 'border-zinc-300/80 bg-white/60 text-zinc-500 hover:border-cyan-500 hover:text-cyan-700'
        }`}
      >
        <Plus className={`w-4 h-4 ${isHovered ? 'text-cyan-300 animate-spin' : 'text-cyan-400'}`} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-black text-zinc-100' : 'bg-zinc-100 text-zinc-900'
      }`}
    >
      {/* Floating Drag Preview that follows the cursor */}
      {dragCursor && draggingSectionInfo && (
        <div
          style={{
            left: dragCursor.x + 14,
            top: dragCursor.y + 14,
            transform: 'translate3d(0, 0, 0)',
          }}
          className="fixed pointer-events-none z-50 px-3.5 py-2 rounded-xl bg-cyan-950/95 border-2 border-cyan-400 text-cyan-100 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 backdrop-blur-md select-none animate-pulse"
        >
          <GripVertical className="w-4 h-4 text-cyan-400" />
          {getSectionIcon(draggingSectionInfo.sectionId)}
          <span className="font-bold text-xs">
            {SECTION_METADATA[draggingSectionInfo.sectionId].name}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold">
            Drop to Place
          </span>
        </div>
      )}

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

        {/* Quick UI Row Presets Bar */}
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
              <span className="hidden sm:inline">Workbench Rows:</span>
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
                title="Scope + Schematic 2-in-1 row with movable divider, Controls & Analysis full row"
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
                title="All sections separate single rows (100% full width)"
              >
                <Rows3 className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">All Single Rows</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('twoDouble')}
                className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                }`}
                title="Two 2-in-1 rows: Scope+Schematic on row 1, Controls+Analysis on row 2"
              >
                <Columns2 className="w-3 h-3 text-cyan-400" />
                <span className="hidden md:inline">Two 2-in-1 Rows</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('controlsFirst')}
                className={`px-2.5 py-1 rounded-lg border transition-colors hidden lg:inline-flex ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                }`}
                title="Controls single row on top, then Scope & Schematic 2-in-1 row"
              >
                Controls on Top
              </button>
            </div>
          </div>

          {/* Configure Sections & Rows Modal Button */}
          <button
            type="button"
            onClick={() => setIsLayoutModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure Rows</span>
          </button>
        </div>

        {/* Top Drop Zone (Start of Page) when dragging */}
        {renderInterRowDropZone(0, 'Drop here to place as a new row at the start of the page')}

        {/* Dynamic Rows Container */}
        <div className="flex flex-col gap-5">
          {layout.rows.map((row, rowIndex) => {
            const isDouble = row.sections.length >= 2;

            return (
              <React.Fragment key={row.id}>
                {/* 2-in-1 Row or Single Row */}
                {isDouble ? (
                  /* 2-in-1 Row with Movable Divider */
                  <div
                    ref={(el) => {
                      rowContainerRefs.current[row.id] = el;
                    }}
                    className={`flex flex-col lg:flex-row gap-4 lg:gap-0 relative items-stretch rounded-2xl p-2 sm:p-2.5 border transition-all ${
                      isDark ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-zinc-100/60 border-zinc-200'
                    }`}
                  >
                    {/* Left Section of 2-in-1 Row */}
                    {(() => {
                      const leftId = row.sections[0];
                      const leftMeta = SECTION_METADATA[leftId];
                      const isLeftCollapsed = Boolean(layout.collapsed[leftId]);
                      const isBeingDragged = draggingSectionInfo?.sectionId === leftId;

                      const isHiddenMobile =
                        leftId === 'oscilloscope'
                          ? activeMobileTab !== 'waveforms'
                          : leftId === 'schematic'
                          ? activeMobileTab !== 'schematic'
                          : leftId === 'analysis'
                          ? activeMobileTab !== 'analysis'
                          : false;

                      return (
                        <div
                          className={`flex flex-col min-w-0 ${
                            activeDraggingRowId === row.id
                              ? 'transition-none'
                              : 'transition-[width] duration-150'
                          } ${isHiddenMobile ? 'hidden sm:flex' : 'flex'} ${
                            isBeingDragged
                              ? 'opacity-30 scale-[0.99] border-dashed border-cyan-400'
                              : ''
                          }`}
                          style={{
                            width: isLgScreen ? `calc(${row.splitRatio}% - 8px)` : '100%',
                          }}
                        >
                          {/* Left Section Header */}
                          <div className="flex items-center justify-between px-2 py-1 text-xs select-none border-b pb-1.5 border-zinc-800/40 mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                onPointerDown={(e) => startSectionDrag(e, leftId, row.id)}
                                onMouseDown={(e) => startSectionDrag(e, leftId, row.id)}
                                className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-zinc-800/40 hover:bg-cyan-500/10 border border-zinc-700/50 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300 transition-all flex items-center gap-1 shadow-xs group touch-none"
                                title="Hold and drag out to drop between rows or at start/end of page to make a single row"
                              >
                                <GripVertical className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-medium hidden sm:inline">Drag to move</span>
                              </div>

                              <div className="flex items-center gap-1.5 font-semibold">
                                {getSectionIcon(leftId)}
                                <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
                                  {leftMeta.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-cyan-950/40 border-cyan-800/40 text-cyan-300">
                                  {Math.round(row.splitRatio)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => swapRowSections(row.id)}
                                className={`p-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                                  isDark
                                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                                }`}
                                title="Swap Left and Right positions in this 2-in-1 row"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                              </button>

                              <button
                                type="button"
                                onClick={() => splitRow(row.id, leftId)}
                                className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                                  isDark
                                    ? 'bg-zinc-900 border-zinc-800 text-amber-300 hover:text-white'
                                    : 'bg-white border-zinc-300 text-amber-700 hover:bg-zinc-100'
                                }`}
                                title="Disable 2-in-1 row: separate into independent single rows"
                              >
                                <Split className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] hidden sm:inline">Separate Row</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleCollapse(leftId)}
                                className={`p-1 rounded border transition-colors ${
                                  isDark
                                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                                }`}
                                title={isLeftCollapsed ? 'Expand' : 'Collapse'}
                              >
                                {isLeftCollapsed ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {!isLeftCollapsed ? (
                            renderSectionContent(leftId)
                          ) : (
                            <div
                              onClick={() => toggleCollapse(leftId)}
                              className="p-3 rounded-xl border border-dashed text-center text-xs cursor-pointer text-zinc-500 hover:text-zinc-300"
                            >
                              {leftMeta.name} is collapsed. Click to expand.
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Interactive Movable Divider between Left and Right Sections */}
                    <button
                      type="button"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Adjust 2-in-1 section widths"
                      aria-valuenow={Math.round(row.splitRatio)}
                      aria-valuemin={20}
                      aria-valuemax={80}
                      title="Hold and drag to move divider between sections. Double-click to reset."
                      onMouseDown={(e) => startDividerDrag(e, row.id)}
                      onTouchStart={(e) => startDividerDrag(e, row.id)}
                      onDoubleClick={() => resetRowSplit(row.id)}
                      className={`hidden lg:flex items-center justify-center w-4 shrink-0 cursor-col-resize select-none relative group z-20 focus:outline-hidden touch-none ${
                        activeDraggingRowId === row.id ? 'cursor-col-resize' : ''
                      }`}
                    >
                      {/* Guide line */}
                      <div
                        className={`w-0.5 h-full transition-colors ${
                          activeDraggingRowId === row.id
                            ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                            : isDark
                            ? 'bg-zinc-800 group-hover:bg-cyan-500/80'
                            : 'bg-zinc-300 group-hover:bg-cyan-600'
                        }`}
                      />

                      {/* Central tactile grab handle pill with dots */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 px-1 py-3 rounded-full border flex flex-col items-center justify-center gap-1 transition-all ${
                          activeDraggingRowId === row.id
                            ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] scale-110'
                            : isDark
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-400 group-hover:border-cyan-500/60 group-hover:text-cyan-300 group-hover:scale-105'
                            : 'bg-white border-zinc-300 text-zinc-600 group-hover:border-cyan-500 group-hover:text-cyan-700 group-hover:scale-105 shadow-xs'
                        }`}
                      >
                        <div className="w-1 h-1 rounded-full bg-current" />
                        <div className="w-1 h-1 rounded-full bg-current" />
                        <div className="w-1 h-1 rounded-full bg-current" />
                      </div>
                    </button>

                    {/* Right Section of 2-in-1 Row */}
                    {(() => {
                      const rightId = row.sections[1];
                      const rightMeta = SECTION_METADATA[rightId];
                      const isRightCollapsed = Boolean(layout.collapsed[rightId]);
                      const isBeingDragged = draggingSectionInfo?.sectionId === rightId;

                      const isHiddenMobile =
                        rightId === 'oscilloscope'
                          ? activeMobileTab !== 'waveforms'
                          : rightId === 'schematic'
                          ? activeMobileTab !== 'schematic'
                          : rightId === 'analysis'
                          ? activeMobileTab !== 'analysis'
                          : false;

                      return (
                        <div
                          className={`flex flex-col min-w-0 ${
                            activeDraggingRowId === row.id
                              ? 'transition-none'
                              : 'transition-[width] duration-150'
                          } ${isHiddenMobile ? 'hidden sm:flex' : 'flex'} ${
                            isBeingDragged
                              ? 'opacity-30 scale-[0.99] border-dashed border-cyan-400'
                              : ''
                          }`}
                          style={{
                            width: isLgScreen ? `calc(${100 - row.splitRatio}% - 8px)` : '100%',
                          }}
                        >
                          {/* Right Section Header */}
                          <div className="flex items-center justify-between px-2 py-1 text-xs select-none border-b pb-1.5 border-zinc-800/40 mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                onPointerDown={(e) => startSectionDrag(e, rightId, row.id)}
                                onMouseDown={(e) => startSectionDrag(e, rightId, row.id)}
                                className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-zinc-800/40 hover:bg-cyan-500/10 border border-zinc-700/50 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300 transition-all flex items-center gap-1 shadow-xs group touch-none"
                                title="Hold and drag out to drop between rows or at start/end of page to make a single row"
                              >
                                <GripVertical className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-medium hidden sm:inline">Drag to move</span>
                              </div>

                              <div className="flex items-center gap-1.5 font-semibold">
                                {getSectionIcon(rightId)}
                                <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
                                  {rightMeta.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-cyan-950/40 border-cyan-800/40 text-cyan-300">
                                  {100 - Math.round(row.splitRatio)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => splitRow(row.id, rightId)}
                                className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                                  isDark
                                    ? 'bg-zinc-900 border-zinc-800 text-amber-300 hover:text-white'
                                    : 'bg-white border-zinc-300 text-amber-700 hover:bg-zinc-100'
                                }`}
                                title="Disable 2-in-1 row: separate into independent single rows"
                              >
                                <Split className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] hidden sm:inline">Separate Row</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleCollapse(rightId)}
                                className={`p-1 rounded border transition-colors ${
                                  isDark
                                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                                }`}
                                title={isRightCollapsed ? 'Expand' : 'Collapse'}
                              >
                                {isRightCollapsed ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {!isRightCollapsed ? (
                            renderSectionContent(rightId)
                          ) : (
                            <div
                              onClick={() => toggleCollapse(rightId)}
                              className="p-3 rounded-xl border border-dashed text-center text-xs cursor-pointer text-zinc-500 hover:text-zinc-300"
                            >
                              {rightMeta.name} is collapsed. Click to expand.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Single Section Row (100% Full Width) */
                  (() => {
                    const sectionId = row.sections[0];
                    const meta = SECTION_METADATA[sectionId];
                    const isCollapsed = Boolean(layout.collapsed[sectionId]);
                    const isBeingDragged = draggingSectionInfo?.sectionId === sectionId;

                    const isCombineHovered =
                      hoverCombineTarget?.targetRowId === row.id &&
                      hoverCombineTarget?.targetSectionId === sectionId;

                    const isHiddenMobile =
                      sectionId === 'oscilloscope'
                        ? activeMobileTab !== 'waveforms'
                        : sectionId === 'schematic'
                        ? activeMobileTab !== 'schematic'
                        : sectionId === 'analysis'
                        ? activeMobileTab !== 'analysis'
                        : false;

                    const otherSections = ALL_SECTION_IDS.filter((s) => s !== sectionId);

                    return (
                      <div
                        key={row.id}
                        data-drop-type-combine="true"
                        data-row-id={row.id}
                        data-section-id={sectionId}
                        className={`relative flex flex-col gap-2 rounded-2xl p-2 sm:p-2.5 border transition-all duration-150 w-full ${
                          isHiddenMobile ? 'hidden sm:flex' : 'flex'
                        } ${
                          isBeingDragged
                            ? 'opacity-30 scale-[0.99] border-dashed border-cyan-400 bg-cyan-950/20'
                            : isCombineHovered
                            ? 'ring-2 ring-cyan-400 bg-cyan-950/30 shadow-2xl scale-[1.005]'
                            : isDark
                            ? 'bg-zinc-950/40 border-zinc-800/80'
                            : 'bg-zinc-100/60 border-zinc-200'
                        }`}
                      >
                        {/* Combine 2-in-1 Row Visual Overlay when dragging directly over this card */}
                        {isCombineHovered && draggingSectionInfo && (
                          <div className="absolute inset-0 z-40 rounded-2xl border-2 border-cyan-400 bg-black/75 backdrop-blur-xs flex overflow-hidden pointer-events-none animate-in fade-in duration-100">
                            <div
                              className={`w-1/2 flex flex-col items-center justify-center p-3 text-center border-r border-cyan-500/50 transition-colors ${
                                hoverCombineTarget.side === 'left'
                                  ? 'bg-cyan-500/30 ring-2 ring-inset ring-cyan-400'
                                  : 'bg-black/40'
                              }`}
                            >
                              <span className="px-3 py-1.5 rounded-full bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg flex items-center gap-1.5">
                                <Columns2 className="w-3.5 h-3.5" />
                                Combine Left (2-in-1 Row)
                              </span>
                              <span className="text-[11px] text-cyan-200 mt-1">
                                Place {SECTION_METADATA[draggingSectionInfo.sectionId].name} on the Left
                              </span>
                            </div>

                            <div
                              className={`w-1/2 flex flex-col items-center justify-center p-3 text-center transition-colors ${
                                hoverCombineTarget.side === 'right'
                                  ? 'bg-cyan-500/30 ring-2 ring-inset ring-cyan-400'
                                  : 'bg-black/40'
                              }`}
                            >
                              <span className="px-3 py-1.5 rounded-full bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg flex items-center gap-1.5">
                                <Columns2 className="w-3.5 h-3.5" />
                                Combine Right (2-in-1 Row)
                              </span>
                              <span className="text-[11px] text-cyan-200 mt-1">
                                Place {SECTION_METADATA[draggingSectionInfo.sectionId].name} on the Right
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Single Row Section Header Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-xs select-none border-b pb-2 border-zinc-800/40">
                          <div className="flex items-center gap-2">
                            <div
                              onPointerDown={(e) => startSectionDrag(e, sectionId, row.id)}
                              onMouseDown={(e) => startSectionDrag(e, sectionId, row.id)}
                              className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-zinc-800/40 hover:bg-cyan-500/10 border border-zinc-700/50 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300 transition-all flex items-center gap-1 shadow-xs group touch-none"
                              title="Hold and drag directly onto another section to combine into a 2-in-1 row, or drop between rows"
                            >
                              <GripVertical className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                              <span className="text-[11px] font-medium hidden sm:inline">Drag to move</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-semibold">
                              {getSectionIcon(sectionId)}
                              <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>
                                {meta.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-zinc-900 border-zinc-800 text-zinc-300">
                                Single Row
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Quick Combine Menu Popover */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCombineMenuSection(
                                    activeCombineMenuSection === sectionId ? null : sectionId
                                  )
                                }
                                className={`px-2 py-1 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                                  activeCombineMenuSection === sectionId
                                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                                    : isDark
                                    ? 'bg-zinc-900 border-zinc-800 text-cyan-300 hover:text-white hover:bg-zinc-800'
                                    : 'bg-white border-zinc-300 text-cyan-700 hover:bg-zinc-100'
                                }`}
                                title="Combine into a 2-in-1 row with another section"
                              >
                                <Columns2 className="w-3.5 h-3.5" />
                                <span>Combine...</span>
                              </button>

                              {activeCombineMenuSection === sectionId && (
                                <div
                                  className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl border shadow-xl z-30 p-1 flex flex-col gap-0.5 ${
                                    isDark
                                      ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                                      : 'bg-white border-zinc-200 text-zinc-800 shadow-lg'
                                  }`}
                                >
                                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">
                                    Combine into 2-in-1 row with:
                                  </div>
                                  {otherSections.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => combineSectionsDirectly(sectionId, s)}
                                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                                        isDark
                                          ? 'hover:bg-zinc-900 hover:text-cyan-300'
                                          : 'hover:bg-zinc-100 hover:text-cyan-700'
                                      }`}
                                    >
                                      {getSectionIcon(s)}
                                      <span>{SECTION_METADATA[s].name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

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

                            <button
                              type="button"
                              onClick={() => toggleCollapse(sectionId)}
                              className={`p-1 rounded border transition-colors ${
                                isDark
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                                  : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                              }`}
                              title={isCollapsed ? 'Expand Section' : 'Collapse Section'}
                            >
                              {isCollapsed ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronUp className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsLayoutModalOpen(true)}
                              className={`p-1 rounded border transition-colors ${
                                isDark
                                  ? 'bg-zinc-900 border-zinc-800 text-cyan-400 hover:text-cyan-300'
                                  : 'bg-white border-zinc-300 text-cyan-600 hover:bg-zinc-100'
                              }`}
                              title="Configure UI Rows"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Section Content */}
                        {!isCollapsed ? (
                          renderSectionContent(sectionId)
                        ) : (
                          <div
                            onClick={() => toggleCollapse(sectionId)}
                            className="p-3 rounded-xl border border-dashed text-center text-xs cursor-pointer text-zinc-500 hover:text-zinc-300"
                          >
                            {meta.name} is collapsed. Click to expand.
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Inter-Row Drop Zone after each row when dragging */}
                {renderInterRowDropZone(
                  rowIndex + 1,
                  rowIndex === layout.rows.length - 1
                    ? 'Drop here to place as a new row at the end of the page'
                    : 'Drop here to place as a new row in between'
                )}
              </React.Fragment>
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
