import React from 'react';
import { CircuitMetrics, CircuitParams, SimulationResult, AppTheme } from '../types/circuit';
import { getTheoreticalFormulas } from '../utils/simulation';
import { HarmonicsChart } from './HarmonicsChart';
import { Activity, Zap } from 'lucide-react';
import { MathView, MathText } from './MathView';

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
        className={`flex items-center justify-between pb-3 border-b flex-wrap gap-2 ${
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
          <span className={`font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'}`}>
            {conductionSummary.activeIntervals}
          </span>
        </div>
      </div>

      {/* Primary DC & RMS Output Metrics - Flexbox for dynamically adjustable width */}
      <div className="flex flex-wrap gap-3 items-stretch">
        {/* Average DC Voltage */}
        <div
          className={`flex-1 min-w-[150px] sm:min-w-[170px] border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Average DC Output</span>
            <MathView math="(V_{dc})" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              {metrics.vAvg.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>V</span>
          </div>
          <span className={`text-[10px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`} title={theoretical.vAvgFormula}>
            Analytical: <MathView math={theoretical.vAvgFormula} className="text-[10px]" />
          </span>
        </div>

        {/* RMS Output Voltage */}
        <div
          className={`flex-1 min-w-[150px] sm:min-w-[170px] border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>RMS Output</span>
            <MathView math="(V_{rms})" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
              {metrics.vRms.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>V</span>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Peak <MathView math="V_m" />: {metrics.vPeak.toFixed(1)}V
          </span>
        </div>

        {/* Average Output Current */}
        <div
          className={`flex-1 min-w-[150px] sm:min-w-[170px] border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Average Current</span>
            <MathView math="(I_{dc})" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {metrics.iAvg.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>A</span>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            RMS <MathView math="I_o" />: {metrics.iRms.toFixed(2)}A
          </span>
        </div>

        {/* Rectification Efficiency */}
        <div
          className={`flex-1 min-w-[150px] sm:min-w-[170px] border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
            isDark ? 'bg-black/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Efficiency</span>
            <MathView math="(\eta = \frac{P_{dc}}{P_{ac}})" />
          </span>
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

      {/* Secondary Performance Quantities Table - Flexbox layout */}
      <div className="flex flex-wrap gap-2.5 items-stretch text-xs">
        {/* Ripple Factor */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Ripple Factor</span>
            <MathView math="(RF)" />
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
              {metrics.rippleFactor.toFixed(1)}%
            </span>
            <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>({(metrics.rippleFactor / 100).toFixed(3)})</span>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Theory: {theoretical.rippleFactorTheory}
          </span>
        </div>

        {/* Form Factor */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Form Factor</span>
            <MathView math="(FF)" />
          </span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.formFactor.toFixed(3)}
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Theory: {theoretical.formFactorTheory}
          </span>
        </div>

        {/* Peak Inverse Voltage */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Peak Inverse Voltage</span>
            <MathView math="(PIV)" />
          </span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
            {metrics.peakInverseVoltage.toFixed(1)} V
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            <MathView math={theoretical.pivFormula} />
          </span>
        </div>

        {/* Ripple Frequency */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Ripple Frequency</span>
            <MathView math="(f_r)" />
          </span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
            {metrics.rippleFrequency} Hz
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Pulse Number: {conductionSummary.pulseNumber}p
          </span>
        </div>

        {/* Power Quantities */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>DC Power</span>
            <MathView math="(P_{dc})" />
          </span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.pDc.toFixed(1)} W
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            <MathView math="P_{ac}" />: {metrics.pAc.toFixed(1)} W
          </span>
        </div>

        {/* THD */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Voltage THD</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.thdVoltage.toFixed(1)}%
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Harmonics 1..12</span>
        </div>

        {/* Power Factor */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Power Factor (PF)</span>
          <span className={`font-mono font-bold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {metrics.powerFactor.toFixed(3)}
          </span>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Lagging</span>
        </div>

        {/* Conduction Angle */}
        <div className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 rounded-lg border flex flex-col gap-0.5 ${isDark ? 'bg-black/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200'}`}>
          <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <span>Conduction Angle</span>
            <MathView math="(\gamma)" />
          </span>
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

      {/* Contextual Circuit Insight Note with MathView */}
      <div
        className={`p-3.5 rounded-lg border flex flex-col sm:flex-row items-start gap-2.5 text-xs transition-colors ${
          isDark ? 'bg-black/50 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
        }`}
      >
        <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <div className="flex flex-col gap-1.5 flex-1">
          <span className={`font-semibold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {theoretical.topologyName}
          </span>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Formula:</span>
              <MathView math={theoretical.vAvgFormula} />
            </div>
            <div className="flex items-center gap-1">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>RMS:</span>
              <MathView math={theoretical.vRmsFormula} />
            </div>
            <div className="flex items-center gap-1">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>PIV:</span>
              <MathView math={theoretical.pivFormula} />
            </div>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <MathText text={theoretical.notes} />
          </p>
        </div>
      </div>
    </div>
  );
};
