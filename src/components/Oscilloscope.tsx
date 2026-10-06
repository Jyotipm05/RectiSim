import React, { useState, useRef } from 'react';
import { WaveformPoint, CircuitParams, AppTheme } from '../types/circuit';
import { Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import { MathView } from './MathView';

interface OscilloscopeProps {
  waveforms: WaveformPoint[];
  params: CircuitParams;
  theme?: AppTheme;
  currentThetaDeg: number;
  isPlaying: boolean;
  playbackSpeed: number;
  vAvg: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onStep: () => void;
  onResetTheta: () => void;
  onSeekTheta: (theta: number) => void;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  waveforms,
  params,
  theme = 'dark',
  currentThetaDeg,
  isPlaying,
  playbackSpeed,
  vAvg,
  onTogglePlay,
  onSetSpeed,
  onStep,
  onResetTheta,
  onSeekTheta,
}) => {
  const isDark = theme === 'dark';
  const [showCh1, setShowCh1] = useState(true); // Input AC
  const [showCh2, setShowCh2] = useState(true); // Output Vo
  const [showCh3, setShowCh3] = useState(true); // Output Io
  const [showCh4, setShowCh4] = useState(params.deviceType === 'thyristor'); // Gate pulse
  const [showCh5, setShowCh5] = useState(false); // Device voltage VD / VT
  const [hoverTheta, setHoverTheta] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Oscilloscope canvas geometry
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const zeroY = padding.top + plotHeight / 2;

  // Scaling calculations
  const maxV = Math.max(
    100,
    ...waveforms.map((w) => Math.max(Math.abs(w.vSourceA), Math.abs(w.vOut), Math.abs(w.vDevice1)))
  );
  const vScale = (plotHeight / 2) / (maxV * 1.15);

  const maxI = Math.max(1, ...waveforms.map((w) => Math.abs(w.iOut)));
  const iScale = (plotHeight / 2.5) / (maxI * 1.2);

  // X mapping: 0 to 720 degrees
  const getX = (theta: number) => padding.left + (theta / 720) * plotWidth;
  const getYVolt = (v: number) => zeroY - v * vScale;
  const getYCurr = (i: number) => zeroY - i * iScale;

  // Generate SVG path strings
  let pathSourceA = '';
  let pathSourceB = '';
  let pathSourceC = '';
  let pathVout = '';
  let pathVoutArea = '';
  let pathIout = '';
  let pathGate = '';
  let pathVdev1 = '';

  if (waveforms.length > 0) {
    pathSourceA = waveforms.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(pt.thetaDeg).toFixed(1)} ${getYVolt(pt.vSourceA).toFixed(1)}`,
      ''
    );

    if (params.phase === '3phase') {
      pathSourceB = waveforms.reduce(
        (acc, pt, i) =>
          pt.vSourceB !== undefined
            ? `${acc} ${i === 0 ? 'M' : 'L'} ${getX(pt.thetaDeg).toFixed(1)} ${getYVolt(pt.vSourceB).toFixed(1)}`
            : acc,
        ''
      );
      pathSourceC = waveforms.reduce(
        (acc, pt, i) =>
          pt.vSourceC !== undefined
            ? `${acc} ${i === 0 ? 'M' : 'L'} ${getX(pt.thetaDeg).toFixed(1)} ${getYVolt(pt.vSourceC).toFixed(1)}`
            : acc,
        ''
      );
    }

    pathVout = waveforms.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(pt.thetaDeg).toFixed(1)} ${getYVolt(pt.vOut).toFixed(1)}`,
      ''
    );

    pathVoutArea = `${pathVout} L ${getX(720).toFixed(1)} ${zeroY.toFixed(1)} L ${getX(0).toFixed(1)} ${zeroY.toFixed(1)} Z`;

    pathIout = waveforms.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(pt.thetaDeg).toFixed(1)} ${getYCurr(pt.iOut).toFixed(1)}`,
      ''
    );

    pathVdev1 = waveforms.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(pt.thetaDeg).toFixed(1)} ${getYVolt(pt.vDevice1).toFixed(1)}`,
      ''
    );

    pathGate = waveforms.reduce((acc, pt, i) => {
      const gateY = height - padding.bottom + 8 - pt.gatePulse * 16;
      return `${acc} ${i === 0 ? 'M' : 'L'} ${getX(pt.thetaDeg).toFixed(1)} ${gateY.toFixed(1)}`;
    }, '');
  }

  // Playhead position
  const playheadX = getX(currentThetaDeg);
  const hoverX = hoverTheta !== null ? getX(hoverTheta) : null;

  // Active point for tooltips
  const displayTheta = hoverTheta !== null ? hoverTheta : currentThetaDeg;
  const activePt = waveforms.find((w) => Math.abs(w.thetaDeg - displayTheta) < 1) || waveforms[0];

  // Mouse interaction on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clickX * scaleX;
    if (svgX >= padding.left && svgX <= width - padding.right) {
      const theta = ((svgX - padding.left) / plotWidth) * 720;
      setHoverTheta(Math.min(720, Math.max(0, theta)));
    }
  };

  const handleMouseLeave = () => {
    setHoverTheta(null);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clickX * scaleX;
    if (svgX >= padding.left && svgX <= width - padding.right) {
      const theta = ((svgX - padding.left) / plotWidth) * 720;
      onSeekTheta(Math.min(720, Math.max(0, theta)));
    }
  };

  const gridLineColor = isDark ? '#27272a' : '#e4e4e7';
  const gridZeroColor = isDark ? '#52525b' : '#71717a';
  const gridTextColor = isDark ? '#71717a' : '#71717a';

  return (
    <div
      className={`rounded-xl p-4 flex flex-col gap-3 h-full min-h-[460px] justify-between border select-none transition-colors ${
        isDark ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
      }`}
    >
      {/* Scope Header & Channel Toggles */}
      <div
        className={`flex items-center justify-between flex-wrap gap-3 pb-2.5 border-b ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
          <h3 className={`font-semibold text-xs sm:text-sm tracking-wide ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Real-Time Oscilloscope Waveforms (2 Cycles)
          </h3>
        </div>

        {/* Channel Selection Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowCh1(!showCh1)}
            className={`px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 border transition-colors ${
              showCh1
                ? (isDark ? 'bg-amber-950/60 text-amber-300 border-amber-600/50' : 'bg-amber-50 text-amber-800 border-amber-300')
                : (isDark ? 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through' : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>CH1:</span>
            <MathView math="v_{ac}(t)" />
          </button>
          <button
            onClick={() => setShowCh2(!showCh2)}
            className={`px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 border transition-colors ${
              showCh2
                ? (isDark ? 'bg-cyan-950/60 text-cyan-300 border-cyan-600/50' : 'bg-cyan-50 text-cyan-800 border-cyan-300')
                : (isDark ? 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through' : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>CH2:</span>
            <MathView math="v_o(t)" />
          </button>
          <button
            onClick={() => setShowCh3(!showCh3)}
            className={`px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 border transition-colors ${
              showCh3
                ? (isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50' : 'bg-emerald-50 text-emerald-800 border-emerald-300')
                : (isDark ? 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through' : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CH3:</span>
            <MathView math="i_o(t)" />
          </button>
          {params.deviceType === 'thyristor' && (
            <button
              onClick={() => setShowCh4(!showCh4)}
              className={`px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 border transition-colors ${
                showCh4
                  ? (isDark ? 'bg-rose-950/60 text-rose-300 border-rose-600/50' : 'bg-rose-50 text-rose-800 border-rose-300')
                  : (isDark ? 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through' : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through')
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>CH4:</span>
              <MathView math="v_g(t)" />
            </button>
          )}
          <button
            onClick={() => setShowCh5(!showCh5)}
            className={`px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 border transition-colors ${
              showCh5
                ? (isDark ? 'bg-purple-950/60 text-purple-300 border-purple-600/50' : 'bg-purple-50 text-purple-800 border-purple-300')
                : (isDark ? 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through' : 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through')
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>CH5:</span>
            <MathView math="v_{sw1}(t)" />
          </button>
        </div>
      </div>

      {/* Oscilloscope SVG Screen */}
      <div
        ref={containerRef}
        className={`rounded-lg p-2 border relative cursor-crosshair overflow-hidden transition-colors ${
          isDark ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200 shadow-inner'
        }`}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="voutAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={isDark ? 0.28 : 0.16} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ioutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={isDark ? 0.18 : 0.12} />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Background */}
          {[-300, -200, -100, 0, 100, 200, 300].map((v) => {
            const y = getYVolt(v);
            if (y < padding.top || y > height - padding.bottom) return null;
            return (
              <g key={`h-${v}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={v === 0 ? gridZeroColor : gridLineColor}
                  strokeWidth={v === 0 ? '1.5' : '1'}
                  strokeDasharray={v === 0 ? undefined : '2,2'}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  className="font-mono text-[9px] tabular-nums"
                  fill={gridTextColor}
                >
                  {v}V
                </text>
              </g>
            );
          })}

          {[0, 90, 180, 270, 360, 450, 540, 630, 720].map((deg) => {
            const x = getX(deg);
            const isCycleEnd = deg === 360 || deg === 720;
            return (
              <g key={`v-${deg}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={isCycleEnd ? gridZeroColor : gridLineColor}
                  strokeWidth={isCycleEnd ? '1.5' : '1'}
                  strokeDasharray={isCycleEnd ? undefined : '3,3'}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 15}
                  textAnchor="middle"
                  className="font-mono text-[10px] tabular-nums"
                  fill={gridTextColor}
                >
                  {deg}°
                </text>
                <text
                  x={x}
                  y={padding.top - 10}
                  textAnchor="middle"
                  className="font-mono text-[8px]"
                  fill={gridTextColor}
                >
                  {((deg / 360) * (1000 / params.frequency)).toFixed(1)}ms
                </text>
              </g>
            );
          })}

          {/* Average Vdc Dashed Reference Line */}
          {showCh2 && (
            <g>
              <line
                x1={padding.left}
                y1={getYVolt(vAvg)}
                x2={width - padding.right}
                y2={getYVolt(vAvg)}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={width - padding.right + 4}
                y={getYVolt(vAvg) + 3}
                className="font-mono text-[9px] font-bold"
                fill={isDark ? '#38bdf8' : '#0284c7'}
              >
                Vdc: {vAvg.toFixed(1)}V
              </text>
            </g>
          )}

          {/* Waveform CH1: Input AC Sources */}
          {showCh1 && (
            <g>
              <path
                d={pathSourceA}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.75"
                strokeOpacity={isDark ? 0.8 : 0.9}
              />
              {params.phase === '3phase' && (
                <>
                  <path
                    d={pathSourceB}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    strokeOpacity={isDark ? 0.6 : 0.75}
                    strokeDasharray="2,2"
                  />
                  <path
                    d={pathSourceC}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.2"
                    strokeOpacity={isDark ? 0.6 : 0.75}
                    strokeDasharray="2,2"
                  />
                </>
              )}
            </g>
          )}

          {/* Waveform CH5: Device Voltage */}
          {showCh5 && (
            <path
              d={pathVdev1}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          )}

          {/* Waveform CH2: Rectified Output Voltage Vo */}
          {showCh2 && (
            <g>
              <path d={pathVoutArea} fill="url(#voutAreaGrad)" />
              <path
                d={pathVout}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Waveform CH3: Output Current Io */}
          {showCh3 && (
            <path
              d={pathIout}
              fill="none"
              stroke="#059669"
              strokeWidth="2"
            />
          )}

          {/* Waveform CH4: Gate pulses */}
          {showCh4 && params.deviceType === 'thyristor' && (
            <path d={pathGate} fill="none" stroke="#e11d48" strokeWidth="2" />
          )}

          {/* Hover Line */}
          {hoverX !== null && (
            <g>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={height - padding.bottom}
                stroke={isDark ? '#71717a' : '#94a3b8'}
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          )}

          {/* Real-Time Animated Playhead Cursor */}
          <g>
            <line
              x1={playheadX}
              y1={padding.top - 6}
              x2={playheadX}
              y2={height - padding.bottom + 6}
              stroke="#d97706"
              strokeWidth="2"
            />
            <polygon
              points={`${playheadX - 5},${padding.top - 8} ${playheadX + 5},${padding.top - 8} ${playheadX},${padding.top}`}
              fill="#d97706"
            />
          </g>
        </svg>

        {/* Floating Tooltip with Instantaneous Values */}
        {activePt && (
          <div
            className={`absolute top-3 right-4 backdrop-blur rounded px-3 py-1.5 pointer-events-none text-[11px] font-mono flex items-center gap-3 border shadow-xs ${
              isDark
                ? 'bg-zinc-900/90 border-zinc-700/80 text-zinc-200'
                : 'bg-white/95 border-zinc-300 text-zinc-900'
            }`}
          >
            <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              <MathView math="\theta =" />
              <span>{Math.round(activePt.thetaDeg)}°</span>
            </span>
            <span className={`flex items-center gap-1 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              <MathView math="v_o =" />
              <span>{activePt.vOut.toFixed(1)}V</span>
            </span>
            <span className={`flex items-center gap-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <MathView math="i_o =" />
              <span>{activePt.iOut.toFixed(2)}A</span>
            </span>
            {params.deviceType === 'thyristor' && (
              <span className={isDark ? 'text-rose-400' : 'text-rose-700'}>
                Gate: {activePt.gatePulse ? 'HIGH' : 'LOW'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Oscilloscope Playback Controls & Scrubber */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        {/* Play/Pause & Stepping */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? (isDark
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200')
                : (isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                    : 'bg-cyan-100 text-cyan-800 border border-cyan-300 hover:bg-cyan-200')
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Live Sweep
              </>
            )}
          </button>

          <button
            onClick={onStep}
            disabled={isPlaying}
            className={`p-1.5 rounded border transition-colors disabled:opacity-40 ${
              isDark
                ? 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
                : 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:border-zinc-300'
            }`}
            title="Step +5°"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetTheta}
            className={`p-1.5 rounded border transition-colors ${
              isDark
                ? 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
                : 'bg-zinc-100 text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:border-zinc-300'
            }`}
            title="Reset to 0°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Simulation Speed Control Slider */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => onSetSpeed(0.25)}
              className={`${isDark ? 'text-zinc-400 hover:text-cyan-300' : 'text-zinc-600 hover:text-cyan-700'} whitespace-nowrap transition-colors`}
              title="Click to reset speed to default 0.25x"
            >
              Speed: <strong className={`font-mono tabular-nums font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{playbackSpeed.toFixed(2)}x</strong>
            </button>
            <input
              type="range"
              min={0.02}
              max={2.0}
              step={0.01}
              value={playbackSpeed}
              onChange={(e) => onSetSpeed(Number(e.target.value))}
              onPointerDown={(e) => {
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
              }}
              className="w-20 sm:w-28 h-2 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none accent-cyan-500"
              title={`Simulation speed: ${playbackSpeed.toFixed(2)}x (fine range 0.02x to 2.00x in 0.01x steps)`}
            />
          </div>
        </div>

        {/* Phase Angle Scrub Slider */}
        <div className="flex items-center gap-2 flex-1 max-w-sm ml-auto">
          <span className={`text-[11px] whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Scrub: <strong className={`font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{Math.round(currentThetaDeg)}°</strong>
          </span>
          <input
            type="range"
            min={0}
            max={720}
            step={2}
            value={Math.round(currentThetaDeg)}
            onChange={(e) => onSeekTheta(Number(e.target.value))}
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
            }}
            className="w-full h-2 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none accent-amber-500"
            title="Hold with mouse pointer to scrub through waveform phase angle"
          />
        </div>
      </div>
    </div>
  );
};

