import React, { useState } from 'react';
import { CircuitParams, AppTheme, LoadType } from '../types/circuit';
import { Sliders, Zap, Activity } from 'lucide-react';

interface CircuitControlsProps {
  params: CircuitParams;
  theme?: AppTheme;
  onChange: (updated: Partial<CircuitParams>) => void;
}

export const CircuitControls: React.FC<CircuitControlsProps> = ({ params, theme = 'dark', onChange }) => {
  const isDark = theme === 'dark';
  const isThyristor = params.deviceType === 'thyristor';
  const [isHoldingAlpha, setIsHoldingAlpha] = useState<boolean>(false);

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 flex flex-col gap-5 text-sm border transition-colors ${
        isDark ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sliders className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h2 className={`font-semibold text-sm tracking-wide ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Circuit Topology & Configuration
          </h2>
        </div>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded border ${
            isDark
              ? 'text-cyan-300 bg-cyan-950/40 border-cyan-800/40'
              : 'text-cyan-800 bg-cyan-50 border-cyan-200 font-medium'
          }`}
        >
          {params.phase === '1phase' ? '1-Phase' : '3-Phase'} · {params.config === 'half-wave' ? 'Half-Wave' : 'Full-Wave'} · {params.deviceType === 'diode' ? 'Diode' : 'SCR'}
        </span>
      </div>

      {/* Primary Selectors (Segmented Buttons) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Phase Selection */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            AC Supply Phase
          </label>
          <div
            className={`grid grid-cols-2 p-1 rounded-lg border ${
              isDark ? 'bg-black border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onChange({ phase: '1phase' })}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                params.phase === '1phase'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-white text-cyan-800 border border-zinc-300 shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              1-Phase (1φ)
            </button>
            <button
              type="button"
              onClick={() => onChange({ phase: '3phase' })}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                params.phase === '3phase'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-white text-cyan-800 border border-zinc-300 shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              3-Phase (3φ)
            </button>
          </div>
        </div>

        {/* Configuration Selection */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Rectifier Circuit
          </label>
          <div
            className={`grid grid-cols-2 p-1 rounded-lg border ${
              isDark ? 'bg-black border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onChange({ config: 'half-wave' })}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                params.config === 'half-wave'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-white text-cyan-800 border border-zinc-300 shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Half-Wave
            </button>
            <button
              type="button"
              onClick={() => onChange({ config: 'full-wave' })}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                params.config === 'full-wave'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-white text-cyan-800 border border-zinc-300 shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Full-Wave
            </button>
          </div>
        </div>

        {/* Device Switch Selection */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Switching Device
          </label>
          <div
            className={`grid grid-cols-2 p-1 rounded-lg border ${
              isDark ? 'bg-black border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onChange({ deviceType: 'diode' })}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                params.deviceType === 'diode'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-white text-cyan-800 border border-zinc-300 shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Diode (Uncontrolled)
            </button>
            <button
              type="button"
              onClick={() => onChange({ deviceType: 'thyristor' })}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                params.deviceType === 'thyristor'
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white text-amber-800 border border-zinc-300 shadow-xs font-semibold'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Thyristor (SCR)
            </button>
          </div>
        </div>
      </div>

      {/* Firing Angle Slider (Interactive, enabled for Thyristor) */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          isThyristor
            ? isDark
              ? 'bg-amber-950/20 border-amber-800/40 shadow-inner'
              : 'bg-amber-50/60 border-amber-300 shadow-xs'
            : isDark
            ? 'bg-black/40 border-zinc-900 opacity-50'
            : 'bg-zinc-100/50 border-zinc-200 opacity-50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isThyristor ? 'text-amber-500' : isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
            <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Firing Angle Delay (α)
            </span>
            {!isThyristor && (
              <span className={`text-[11px] italic ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                (Fixed at α = 0° for uncontrolled diode)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isHoldingAlpha && isThyristor && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-semibold">
                HOLDING
              </span>
            )}
            <span
              className={`font-mono text-sm font-bold px-2.5 py-0.5 rounded border ${
                isDark
                  ? 'text-amber-300 bg-amber-950/40 border-amber-800/50'
                  : 'text-amber-800 bg-white border-amber-300 shadow-2xs'
              }`}
            >
              {isThyristor ? `${params.firingAngle}°` : '0°'}
            </span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={180}
          step={1}
          disabled={!isThyristor}
          value={isThyristor ? params.firingAngle : 0}
          onChange={(e) => onChange({ firingAngle: Number(e.target.value) })}
          onPointerDown={(e) => {
            if (!isThyristor) return;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {}
            setIsHoldingAlpha(true);
          }}
          onPointerUp={() => setIsHoldingAlpha(false)}
          onPointerCancel={() => setIsHoldingAlpha(false)}
          title={isThyristor ? `Hold with mouse pointer to adjust firing angle (Current: ${params.firingAngle}°)` : 'Fixed at 0°'}
          className={`w-full h-3 rounded-lg accent-amber-500 transition-all select-none touch-none ${
            isThyristor
              ? `cursor-grab active:cursor-grabbing ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-200 hover:bg-zinc-300'
                } [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(245,158,11,0.6)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:active:scale-125 [&::-webkit-slider-thumb]:active:ring-4 [&::-webkit-slider-thumb]:active:ring-amber-400/40 [&::-webkit-slider-thumb]:transition-all [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-[0_2px_10px_rgba(245,158,11,0.6)] [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:active:scale-125 [&::-moz-range-thumb]:transition-all`
              : 'cursor-not-allowed opacity-50 bg-zinc-800'
          }`}
        />

        {/* Firing Angle Presets */}
        <div
          className={`flex items-center justify-between mt-2.5 pt-2 border-t ${
            isDark ? 'border-zinc-800/80' : 'border-amber-200'
          }`}
        >
          <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Quick Angles:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 30, 45, 60, 90, 120, 150].map((deg) => (
              <button
                key={deg}
                type="button"
                disabled={!isThyristor}
                onClick={() => onChange({ firingAngle: deg })}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  params.firingAngle === deg && isThyristor
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : isDark
                    ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-600 disabled:opacity-40'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400 disabled:opacity-40'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Load Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            Load Configuration
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'R', label: 'Resistive (R)', desc: 'Pure R load' },
            { id: 'RL', label: 'Inductive (R-L)', desc: 'Motor / choke' },
            { id: 'RL_FWD', label: 'R-L + Freewheeling', desc: 'Clamped at 0V' },
            { id: 'RC', label: 'Capacitive Filter', desc: 'Smoothing C' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ loadType: item.id as LoadType })}
              className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-colors ${
                params.loadType === item.id
                  ? isDark
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                    : 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-2xs'
                  : isDark
                  ? 'bg-black/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
              }`}
            >
              <span className={`font-medium text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.label}</span>
              <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Component & AC Source Sliders Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        {/* Source RMS Voltage */}
        <div
          className={`flex flex-col gap-1.5 p-3 rounded-lg border ${
            isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>AC Input Voltage (Vrms)</span>
            <span className={`font-mono font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{params.sourceVrms} V</span>
          </div>
          <input
            type="range"
            min={12}
            max={440}
            step={2}
            value={params.sourceVrms}
            onChange={(e) => onChange({ sourceVrms: Number(e.target.value) })}
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
            }}
            className="w-full h-2.5 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none accent-cyan-500"
          />
          <div className={`flex justify-between text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <span>12V (LV)</span>
            <span>120V</span>
            <span>230V</span>
            <span>415V (3φ)</span>
          </div>
        </div>

        {/* Frequency */}
        <div
          className={`flex flex-col gap-1.5 p-3 rounded-lg border ${
            isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Frequency (f)</span>
            <span className={`font-mono font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{params.frequency} Hz</span>
          </div>
          <input
            type="range"
            min={20}
            max={400}
            step={5}
            value={params.frequency}
            onChange={(e) => onChange({ frequency: Number(e.target.value) })}
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
            }}
            className="w-full h-2.5 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none accent-cyan-500"
          />
          <div className={`flex justify-between text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <button
              type="button"
              onClick={() => onChange({ frequency: 50 })}
              className={`hover:text-cyan-500 ${params.frequency === 50 ? 'text-cyan-500 font-bold' : ''}`}
            >
              50 Hz
            </button>
            <button
              type="button"
              onClick={() => onChange({ frequency: 60 })}
              className={`hover:text-cyan-500 ${params.frequency === 60 ? 'text-cyan-500 font-bold' : ''}`}
            >
              60 Hz
            </button>
            <button
              type="button"
              onClick={() => onChange({ frequency: 400 })}
              className={`hover:text-cyan-500 ${params.frequency === 400 ? 'text-cyan-500 font-bold' : ''}`}
            >
              400 Hz (Aero)
            </button>
          </div>
        </div>

        {/* Load Resistance */}
        <div
          className={`flex flex-col gap-1.5 p-3 rounded-lg border ${
            isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Load Resistance (R)</span>
            <span className={`font-mono font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{params.resistance} Ω</span>
          </div>
          <input
            type="range"
            min={2}
            max={200}
            step={1}
            value={params.resistance}
            onChange={(e) => onChange({ resistance: Number(e.target.value) })}
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
            }}
            className="w-full h-2.5 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none accent-cyan-500"
          />
          <div className={`flex justify-between text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <span>2 Ω</span>
            <span>20 Ω</span>
            <span>100 Ω</span>
            <span>200 Ω</span>
          </div>
        </div>

        {/* Inductance (shown if RL or RL_FWD) */}
        {(params.loadType === 'RL' || params.loadType === 'RL_FWD') && (
          <div
            className={`flex flex-col gap-1.5 p-3 rounded-lg border ${
              isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Load Inductance (L)</span>
              <span className={`font-mono font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{params.inductance} mH</span>
            </div>
            <input
              type="range"
              min={1}
              max={300}
              step={5}
              value={params.inductance}
              onChange={(e) => onChange({ inductance: Number(e.target.value) })}
              onPointerDown={(e) => {
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
              }}
              className="w-full h-2.5 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none accent-emerald-500"
            />
            <div className={`flex justify-between text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span>1 mH</span>
              <span>50 mH</span>
              <span>150 mH</span>
              <span>300 mH</span>
            </div>
          </div>
        )}

        {/* Capacitance (shown if RC) */}
        {params.loadType === 'RC' && (
          <div
            className={`flex flex-col gap-1.5 p-3 rounded-lg border ${
              isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Filter Capacitor (C)</span>
              <span className={`font-mono font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{params.capacitance} µF</span>
            </div>
            <input
              type="range"
              min={10}
              max={2200}
              step={10}
              value={params.capacitance}
              onChange={(e) => onChange({ capacitance: Number(e.target.value) })}
              onPointerDown={(e) => {
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
              }}
              className="w-full h-2.5 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none accent-emerald-500"
            />
            <div className={`flex justify-between text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span>10 µF</span>
              <span>220 µF</span>
              <span>1000 µF</span>
              <span>2200 µF</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
