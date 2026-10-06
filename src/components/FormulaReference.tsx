import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { AppTheme } from '../types/circuit';

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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto ${
        isDark ? 'bg-black/80' : 'bg-black/40'
      }`}
    >
      <div
        className={`border rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto shadow-2xl flex flex-col my-auto transition-colors ${
          isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 backdrop-blur z-10 transition-colors ${
            isDark
              ? 'bg-zinc-950/95 border-zinc-800'
              : 'bg-white/95 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <h2 className="text-base font-bold">
              Power Electronics Rectifier Formulas & Theory
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className={`p-6 flex flex-col gap-6 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {/* Section 1: Single-Phase Rectifiers */}
          <div className="flex flex-col gap-3">
            <h3 className={`text-sm font-semibold border-b pb-1.5 ${isDark ? 'text-cyan-300 border-zinc-800' : 'text-cyan-700 border-zinc-200'}`}>
              1. Single-Phase Rectifier Topologies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Half-Wave (Diode, R Load)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = Vm / π ≈ 0.318 Vm = 0.45 Vrms</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vrms = Vm / 2 ≈ 0.707 Vrms,in</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Ripple Factor = 121%, Form Factor = 1.57</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>PIV = Vm, Ripple Frequency = f</p>
              </div>

              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>Half-Wave (Thyristor / SCR)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (Vm / 2π) · (1 + cos α) [R Load]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (Vm / 2π) · (cos α - cos β) [RL Load]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vrms = (Vm / 2) · √(1 - α/π + sin(2α)/(2π))</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Controlled delay α ∈ [0°, 180°]</p>
              </div>

              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Full-Wave Bridge (Diode, R Load)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = 2Vm / π ≈ 0.637 Vm = 0.90 Vrms</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vrms = Vm / √2 = Vrms,in</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Ripple Factor = 48.2%, Form Factor = 1.11</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Efficiency η = 81.2%, Ripple Frequency = 2f</p>
              </div>

              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>Full-Wave Bridge (Thyristor / SCR)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (Vm / π) · (1 + cos α) [R Load]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (2Vm / π) · cos α [Continuous RL Load]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Inversion possible for 90° &lt; α &lt; 180°</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>PIV = Vm, Ripple Frequency = 2f</p>
              </div>
            </div>
          </div>

          {/* Section 2: Three-Phase Rectifiers */}
          <div className="flex flex-col gap-3">
            <h3 className={`text-sm font-semibold border-b pb-1.5 ${isDark ? 'text-cyan-300 border-zinc-800' : 'text-cyan-700 border-zinc-200'}`}>
              2. Three-Phase Rectifier Topologies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>3-Phase Half-Wave (3-Pulse Diode)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (3√3 Vm) / (2π) ≈ 0.827 Vm</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = 1.17 Vphase,rms</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Ripple Factor = 17%, Ripple Frequency = 3f</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>PIV = √3 Vm = Vm,Line</p>
              </div>

              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>3-Phase Half-Wave (3-Pulse SCR)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (3√3 Vm / 2π) · cos α [α ≤ 30°]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (3Vm / 2π) · [1 + cos(α + 30°)] [α &gt; 30°, R]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Each thyristor conducts for 120°</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>PIV = √3 Vm</p>
              </div>

              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>3-Phase Full-Wave Bridge (6-Pulse Diode)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = 3 Vm,Line / π = 3√3 Vm / π ≈ 1.654 Vm</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = 2.34 Vphase,rms = 1.35 Vline,rms</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Ripple Factor = 4.2% (Extremely low ripple)</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Efficiency η = 99.8%, Ripple Frequency = 6f</p>
              </div>

              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>3-Phase 6-Pulse Converter (SCR Bridge)</span>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (3√3 Vm / π) · cos α [α ≤ 60° / RL]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Vdc = (3 Vm,Line / π) · [1 + cos(α + 60°)] [α &gt; 60°, R]</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>6 commutation intervals per AC cycle</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>PIV = √3 Vm, Ripple Frequency = 6f</p>
              </div>
            </div>
          </div>

          {/* Section 3: Performance Formulas */}
          <div className="flex flex-col gap-3">
            <h3 className={`text-sm font-semibold border-b pb-1.5 ${isDark ? 'text-cyan-300 border-zinc-800' : 'text-cyan-700 border-zinc-200'}`}>
              3. Fundamental Performance Formulas
            </h3>
            <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono ${isDark ? 'bg-black/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div>
                <p className={`font-semibold mb-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Form Factor (FF)</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>FF = Vrms,out / Vdc</p>
              </div>
              <div>
                <p className={`font-semibold mb-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Ripple Factor (RF)</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>RF = √(FF² - 1) = √(Vrms,ac² / Vdc²)</p>
              </div>
              <div>
                <p className={`font-semibold mb-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Rectification Efficiency (η)</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>η = (Pdc / Pac) × 100% = (Vdc · Idc) / (Vrms · Irms)</p>
              </div>
              <div>
                <p className={`font-semibold mb-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Freewheeling Diode (FWD) Action</p>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Prevents negative voltage output, dissipates stored inductive energy smoothly.</p>
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
