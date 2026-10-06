import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { AppTheme } from '../types/circuit';
import { MathView } from './MathView';

interface FormulaReferenceProps {
  isOpen: boolean;
  theme?: AppTheme;
  onClose: () => void;
}

export const FormulaReference: React.FC<FormulaReferenceProps> = ({
  isOpen,
  theme = 'dark',
  onClose,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto ${
        isDark ? 'bg-black/80' : 'bg-black/40'
      }`}
    >
      <div
        className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col my-auto transition-colors ${
          isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 backdrop-blur z-10 transition-colors ${
            isDark ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <BookOpen className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h2 className="text-base font-bold">Power Electronics Rectifier Formulas & Theory</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Mathematical expressions rendered with KaTeX
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Flexbox dynamically adjustable layout */}
        <div className={`p-5 sm:p-6 flex flex-col gap-6 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {/* Section 1: Single-Phase Rectifiers */}
          <div className="flex flex-col gap-3">
            <h3
              className={`text-sm font-semibold border-b pb-1.5 flex items-center gap-2 ${
                isDark ? 'text-cyan-300 border-zinc-800' : 'text-cyan-700 border-zinc-200'
              }`}
            >
              <span>1. Single-Phase Rectifier Topologies</span>
            </h3>

            {/* Flexbox container for dynamic width adjustment */}
            <div className="flex flex-wrap gap-3.5 items-stretch">
              {/* 1-Phase Half-Wave Diode */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Half-Wave (Diode, R Load)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    1-Pulse
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div>Average DC: <MathView math="V_{dc} = \frac{V_m}{\pi} \approx 0.318 V_m = 0.45 V_{rms}" /></div>
                  <div>RMS Output: <MathView math="V_{rms} = \frac{V_m}{2} \approx 0.707 V_{rms,in}" /></div>
                  <div>Ripple Factor: <MathView math="RF = 1.21 \quad (121\%)" /></div>
                  <div>Form Factor: <MathView math="FF = \frac{V_{rms}}{V_{dc}} = \frac{\pi}{2} \approx 1.57" /></div>
                  <div>Peak Inverse Voltage: <MathView math="PIV = V_m, \quad f_r = f" /></div>
                </div>
              </div>

              {/* 1-Phase Half-Wave Thyristor */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    Half-Wave (Thyristor / SCR)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    Controlled α
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div>R Load: <MathView math="V_{dc} = \frac{V_m}{2\pi}(1 + \cos\alpha)" /></div>
                  <div>RL Load: <MathView math="V_{dc} = \frac{V_m}{2\pi}(\cos\alpha - \cos\beta)" /></div>
                  <div>RMS Voltage: <MathView math="V_{rms} = \frac{V_m}{2}\sqrt{1 - \frac{\alpha}{\pi} + \frac{\sin 2\alpha}{2\pi}}" /></div>
                  <div>Firing Range: <MathView math="\alpha \in [0^\circ, 180^\circ]" /></div>
                </div>
              </div>

              {/* 1-Phase Full-Wave Bridge Diode */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Full-Wave Bridge (Diode)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    2-Pulse
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div>Average DC: <MathView math="V_{dc} = \frac{2V_m}{\pi} \approx 0.637 V_m = 0.90 V_{rms}" /></div>
                  <div>RMS Output: <MathView math="V_{rms} = \frac{V_m}{\sqrt{2}} = V_{rms,in}" /></div>
                  <div>Ripple Factor: <MathView math="RF = 48.2\%, \quad FF = 1.11" /></div>
                  <div>Efficiency: <MathView math="\eta = \frac{8}{\pi^2} \approx 81.2\%, \quad f_r = 2f" /></div>
                </div>
              </div>

              {/* 1-Phase Full-Wave Bridge Thyristor */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    Full-Wave Bridge (Thyristor / SCR)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    Converter
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div>R Load: <MathView math="V_{dc} = \frac{V_m}{\pi}(1 + \cos\alpha)" /></div>
                  <div>Continuous RL: <MathView math="V_{dc} = \frac{2V_m}{\pi}\cos\alpha" /></div>
                  <div>Inversion Mode: <MathView math="90^\circ < \alpha < 180^\circ \implies V_{dc} < 0" /></div>
                  <div>PIV Rating: <MathView math="PIV = V_m, \quad f_r = 2f" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Three-Phase Rectifiers */}
          <div className="flex flex-col gap-3">
            <h3
              className={`text-sm font-semibold border-b pb-1.5 flex items-center gap-2 ${
                isDark ? 'text-cyan-300 border-zinc-800' : 'text-cyan-700 border-zinc-200'
              }`}
            >
              <span>2. Three-Phase Rectifier Topologies</span>
            </h3>

            {/* Flexbox container */}
            <div className="flex flex-wrap gap-3.5 items-stretch">
              {/* 3-Phase Half-Wave Diode */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    3-Phase Half-Wave (3-Pulse Diode)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    3-Pulse
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div>Average DC: <MathView math="V_{dc} = \frac{3\sqrt{3}V_m}{2\pi} \approx 0.827 V_m = 1.17 V_{ph,rms}" /></div>
                  <div>Ripple Factor: <MathView math="RF = 17\%, \quad f_r = 3f" /></div>
                  <div>PIV Rating: <MathView math="PIV = \sqrt{3}V_m = V_{line,m}" /></div>
                  <div>Conduction: <MathView math="120^\circ \text{ per diode}" /></div>
                </div>
              </div>

              {/* 3-Phase Half-Wave Thyristor */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    3-Phase Half-Wave (3-Pulse SCR)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    Controlled
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div><MathView math="\alpha \le 30^\circ" />: <MathView math="V_{dc} = \frac{3\sqrt{3}V_m}{2\pi}\cos\alpha" /></div>
                  <div><MathView math="\alpha > 30^\circ" /> (R): <MathView math="V_{dc} = \frac{3V_m}{2\pi}[1 + \cos(\alpha + 30^\circ)]" /></div>
                  <div>Device Rating: <MathView math="PIV = \sqrt{3}V_m, \quad f_r = 3f" /></div>
                </div>
              </div>

              {/* 3-Phase Full-Wave Bridge Diode */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    3-Phase Full-Wave 6-Pulse Diode Bridge
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    Graetz
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div>Average DC: <MathView math="V_{dc} = \frac{3\sqrt{3}V_m}{\pi} \approx 1.654 V_m = 1.35 V_{line,rms}" /></div>
                  <div>Ripple Factor: <MathView math="RF = 4.2\% \quad (\text{negligible ripple})" /></div>
                  <div>Efficiency: <MathView math="\eta = 99.8\%, \quad f_r = 6f" /></div>
                  <div>PIV: <MathView math="PIV = \sqrt{3}V_m = V_{line,m}" /></div>
                </div>
              </div>

              {/* 3-Phase 6-Pulse Converter SCR */}
              <div
                className={`flex-1 min-w-[280px] p-4 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1.5 border-zinc-800/60">
                  <span className={`font-semibold text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    3-Phase 6-Pulse Converter (SCR Bridge)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    6-Pulse
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div>Continuous RL: <MathView math="V_{dc} = \frac{3\sqrt{3}V_m}{\pi}\cos\alpha" /></div>
                  <div>Discontinuous (R): <MathView math="V_{dc} = \frac{3V_{line,m}}{\pi}[1 + \cos(\alpha + 60^\circ)]" /></div>
                  <div>Commutation: 6 pulses per cycle, <MathView math="f_r = 6f" /></div>
                  <div>PIV: <MathView math="PIV = \sqrt{3}V_m" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Performance Formulas */}
          <div className="flex flex-col gap-3">
            <h3
              className={`text-sm font-semibold border-b pb-1.5 ${
                isDark ? 'text-cyan-300 border-zinc-800' : 'text-cyan-700 border-zinc-200'
              }`}
            >
              3. Fundamental Performance Formulas
            </h3>

            {/* Flexbox container */}
            <div className="flex flex-wrap gap-3 items-stretch">
              <div
                className={`flex-1 min-w-[200px] p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className={`font-semibold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Form Factor (FF)
                </span>
                <MathView math="FF = \frac{V_{rms,out}}{V_{dc}}" block />
              </div>

              <div
                className={`flex-1 min-w-[200px] p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className={`font-semibold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Ripple Factor (RF)
                </span>
                <MathView math="RF = \sqrt{FF^2 - 1} = \frac{V_{ac,rms}}{V_{dc}}" block />
              </div>

              <div
                className={`flex-1 min-w-[200px] p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className={`font-semibold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Rectification Efficiency (η)
                </span>
                <MathView math="\eta = \frac{P_{dc}}{P_{ac}} \times 100\% = \frac{V_{dc}I_{dc}}{V_{rms}I_{rms}}" block />
              </div>

              <div
                className={`flex-1 min-w-[200px] p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                  isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <span className={`font-semibold text-xs ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Total Harmonic Distortion (THD)
                </span>
                <MathView math="THD = \frac{\sqrt{\sum_{n=2}^\infty V_n^2}}{V_1} \times 100\%" block />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3 border-t flex justify-end transition-colors ${
            isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900'
            }`}
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
