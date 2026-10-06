import React from 'react';
import { CircuitMetrics, CircuitParams, SimulationResult, AppTheme } from '../types/circuit';
import { getTheoreticalFormulas } from '../utils/simulation';
import { HarmonicsChart } from './HarmonicsChart';
import { Activity, Zap } from 'lucide-react';

interface AnalysisMetricsProps {
  metrics: CircuitMetrics;
  params: CircuitParams;
  theme?: AppTheme;
  conductionSummary: SimulationResult['conductionSummary'];
  harmonics: SimulationResult['harmonics'];
}

export const AnalysisMetrics: React.FC<AnalysisMetricsProps> = ({
  metrics,
  params,
  theme = 'dark',
  conductionSummary,
  harmonics,
}) => {
  const isDark = theme === 'dark';
  const theoretical = getTheoreticalFormulas(params);

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 flex flex-col gap-4 text-sm border transition-colors ${
        isDark ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h2 className={`font-semibold text-sm tracking-wide ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Circuit Analysis & Operating Parameters
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {conductionSummary.activeIntervals}
          </span>
        </div>
      </div>

      {/* Primary DC & RMS Output Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Average DC Voltage */}
        <div
          className={`border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Average DC Output (Vdc)</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              {metrics.vAvg.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>V</span>
          </div>
          <span className={`text-[10px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`} title={theoretical.vAvgFormula}>
            Analytical: {theoretical.vAvgFormula.split('=')[1]?.trim() || 'Calculated'}
          </span>
        </div>

        {/* RMS Output Voltage */}
        <div
          className={`border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>RMS Output (Vrms,out)</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
              {metrics.vRms.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>V</span>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Peak Vm: {metrics.vPeak.toFixed(1)}V
          </span>
        </div>

        {/* Average Output Current */}
        <div
          className={`border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Average Current (Idc)</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {metrics.iAvg.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>A</span>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            RMS Io: {metrics.iRms.toFixed(2)}A
          </span>
        </div>

        {/* Rectification Efficiency */}
        <div
          className={`border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Efficiency (η = Pdc/Pac)</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {metrics.efficiency.toFixed(1)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>%</span>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Theory: {theoretical.efficiencyTheory}
          </span>
        </div>
      </div>

      {/* Secondary Performance Quantities Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Ripple Factor */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Ripple Factor (RF)</span>
          <div className="flex items-baseline gap-1">
            <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
              {metrics.rippleFactor.toFixed(1)}%
            </span>
            <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>({(metrics.rippleFactor / 100).toFixed(3)})</span>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Theoretical: {theoretical.rippleFactorTheory}
          </span>
        </div>

        {/* Form Factor */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Form Factor (FF)</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.formFactor.toFixed(3)}
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Theoretical: {theoretical.formFactorTheory}
          </span>
        </div>

        {/* Peak Inverse Voltage */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Peak Inverse Voltage (PIV)</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
            {metrics.peakInverseVoltage.toFixed(1)} V
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            {theoretical.pivFormula}
          </span>
        </div>

        {/* Ripple Frequency */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Output Ripple Freq</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
            {metrics.rippleFrequency} Hz
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Pulse: {conductionSummary.pulseNumber}p
          </span>
        </div>

        {/* Power Quantities */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>DC Power (Pdc)</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.pDc.toFixed(1)} W
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Pac: {metrics.pAc.toFixed(1)} W</span>
        </div>

        {/* THD */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Voltage THD (Output)</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.thdVoltage.toFixed(1)}%
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Harmonics 1..12</span>
        </div>

        {/* Power Factor */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Input Power Factor</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.powerFactor.toFixed(3)}
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Lagging</span>
        </div>

        {/* Conduction Angle */}
        <div className={`p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Device Conduction Interval</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {conductionSummary.conductionAngleDeg.toFixed(0)}° / switch
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            {params.phase === '3phase' ? '120° duration' : '180° duration'}
          </span>
        </div>
      </div>

      {/* Harmonic Spectrum Chart */}
      <HarmonicsChart harmonics={harmonics} rippleFrequency={metrics.rippleFrequency} theme={theme} />

      {/* Contextual Circuit Insight Note */}
      <div
        className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs transition-colors ${
          isDark ? 'bg-black/50 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
        }`}
      >
        <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <div className="flex flex-col gap-1">
          <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{theoretical.topologyName}</span>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {theoretical.notes}
          </p>
        </div>
      </div>
    </div>
  );
};
