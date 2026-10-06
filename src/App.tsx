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

  // Active view tab on mobile screens (Schematic / Waveforms / Analysis)
  const [activeMobileTab, setActiveMobileTab] = useState<'schematic' | 'waveforms' | 'analysis'>('waveforms');

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
        // At 50Hz, 1 cycle = 20ms = 360 degrees.
        // Speed in deg/ms = 360 * frequency / 1000.
        // We scale by playbackSpeed * visual smoothing factor so user can clearly see conduction
        const visualSpeedScale = 0.25; // allows comfortable observation of conduction transitions
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

  // Handle Parameter changes
  const handleParamChange = (updated: Partial<CircuitParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  // Reset to default
  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setCurrentTheta(0);
    setPlaybackSpeed(0.25);
  };

  // Step forward by 5 degrees
  const handleStep = () => {
    setIsPlaying(false);
    setCurrentTheta((prev) => (prev + 5) % 720);
  };

  // Find instantaneous point in waveform
  const currentPoint = useMemo(() => {
    const list = simulationResult.waveforms;
    if (!list || list.length === 0) return null;
    const target = currentTheta % 720;
    // Find closest point
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-5">
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

        {/* Top Visual Workbench: Oscilloscope & Schematic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Multi-Channel Real-Time Oscilloscope */}
          <div
            className={`lg:col-span-7 flex flex-col ${
              activeMobileTab !== 'waveforms' ? 'hidden sm:flex' : 'flex'
            }`}
          >
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
          </div>

          {/* Dynamic Schematic Visualizer */}
          <div
            className={`lg:col-span-5 flex flex-col ${
              activeMobileTab !== 'schematic' ? 'hidden sm:flex' : 'flex'
            }`}
          >
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
          </div>
        </div>

        {/* Interactive Controls & Configuration */}
        <CircuitControls params={params} theme={theme} onChange={handleParamChange} />

        {/* Bottom Section: Comprehensive Circuit Analysis & Harmonics */}
        <div
          className={`${
            activeMobileTab !== 'analysis' ? 'hidden sm:block' : 'block'
          }`}
        >
          <AnalysisMetrics
            metrics={simulationResult.metrics}
            params={params}
            theme={theme}
            conductionSummary={simulationResult.conductionSummary}
            harmonics={simulationResult.harmonics}
          />
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
    </div>
  );
}
