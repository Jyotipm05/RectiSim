import React, { useState, useEffect, useRef } from 'react';
import { CircuitParams, AppTheme } from '../types/circuit';

interface SchematicViewerProps {
  params: CircuitParams;
  theme?: AppTheme;
  conductingDevices: string[];
  instantVout: number;
  instantIout: number;
  instantVsA: number;
  instantVsB?: number;
  instantVsC?: number;
  isPlaying?: boolean;
  playbackSpeed?: number;
  gateActive: boolean;
  thetaDeg: number;
}

/**
 * Returns an authentic EveryCircuit voltage-based color:
 * - Positive voltage: Vibrant shades of green (intensity scales with +V)
 * - 0V / Ground: Neutral slate gray
 * - Negative voltage: Vibrant shades of orange/red (intensity scales with -V)
 */
function getVoltageColor(v: number, maxV: number, isDark: boolean = true): string {
  if (isNaN(v) || maxV <= 0) return isDark ? '#475569' : '#94a3b8';
  const ratio = Math.max(-1, Math.min(1, v / maxV));
  const absR = Math.abs(ratio);

  if (absR < 0.02) {
    // 0V neutral ground reference
    return isDark ? '#475569' : '#94a3b8';
  }

  if (ratio > 0) {
    // EveryCircuit positive potential -> Vivid Green spectrum
    const lightness = isDark ? 28 + absR * 34 : 26 + absR * 22;
    const saturation = 85 + absR * 12;
    return `hsl(142, ${Math.min(100, Math.round(saturation))}%, ${Math.round(lightness)}%)`;
  } else {
    // EveryCircuit negative potential -> Vivid Orange/Red spectrum
    const lightness = isDark ? 28 + absR * 34 : 30 + absR * 22;
    const saturation = 90 + absR * 10;
    return `hsl(24, ${Math.min(100, Math.round(saturation))}%, ${Math.round(lightness)}%)`;
  }
}

export const SchematicViewer: React.FC<SchematicViewerProps> = ({
  params,
  theme = 'dark',
  conductingDevices,
  instantVout,
  instantIout,
  instantVsA,
  instantVsB,
  instantVsC,
  isPlaying = true,
  playbackSpeed = 1.0,
  gateActive,
  thetaDeg,
}) => {
  const isDark = theme === 'dark';
  const { deviceType, phase, config, loadType } = params;
  const isThyristor = deviceType === 'thyristor';

  // Peak voltage reference for normalizing color shades
  const vPeak = params.sourceVrms * Math.SQRT2;
  const maxV = phase === '3phase' && config === 'full-wave' ? vPeak * Math.sqrt(3) : vPeak;

  // Real-time animated current dot offset (smooth 60fps loop)
  const [dotOffset, setDotOffset] = useState<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      if (isPlaying && Math.abs(instantIout) > 0.01) {
        // Boosted velocity scaling ensuring visible motion even at lowest slider ranges
        const nominalI = Math.max(1, (params.sourceVrms * Math.SQRT2) / Math.max(1, params.resistance));
        const currentNormalized = Math.max(0.35, Math.min(2.5, Math.sqrt(Math.abs(instantIout) / nominalI)));
        // Base velocity scaled so 1x nominal moves at ~240 px/sec
        const basePxPerSec = 240;
        // Non-linear speed floor ensures even at 0.02x slider speed, current particles visibly crawl (~20 px/sec)
        const speedScale = 0.08 + 0.92 * Math.max(0.01, playbackSpeed);
        const speed = basePxPerSec * speedScale * currentNormalized;

        setDotOffset((prev) => (prev + speed * dt) % 10000);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, instantIout, params]);

  const isConducting = (name: string) => conductingDevices.includes(name);

  // Instantaneous node voltages
  const vA = instantVsA;
  const vB = instantVsB ?? vPeak * Math.sin(((thetaDeg - 120) * Math.PI) / 180);
  const vC = instantVsC ?? vPeak * Math.sin(((thetaDeg - 240) * Math.PI) / 180);
  const vVo = instantVout;
  const vGnd = 0;

  // Render an EveryCircuit Wire (Line) with voltage shade and animated current flow dots
  const renderWire = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    voltage: number,
    hasCurrent: boolean,
    dir: 1 | -1 = 1,
    key?: string
  ) => {
    const vColor = getVoltageColor(voltage, maxV, isDark);
    const hasFlow = hasCurrent && Math.abs(instantIout) > 0.01;

    return (
      <g key={key}>
        {/* Base Wire with Voltage Level Shade */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={vColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Animated Current Flow Dots (EveryCircuit Style) */}
        {hasFlow && (
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#facc15"
            strokeWidth="4.5"
            strokeDasharray="0.1 20"
            strokeDashoffset={-dotOffset * dir}
            strokeLinecap="round"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  // Render an EveryCircuit Wire (Path) with voltage shade and animated current flow dots
  const renderPath = (
    d: string,
    voltage: number,
    hasCurrent: boolean,
    dir: 1 | -1 = 1,
    key?: string
  ) => {
    const vColor = getVoltageColor(voltage, maxV, isDark);
    const hasFlow = hasCurrent && Math.abs(instantIout) > 0.01;

    return (
      <g key={key}>
        {/* Base Wire Path */}
        <path
          d={d}
          fill="none"
          stroke={vColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Animated Current Flow Dots */}
        {hasFlow && (
          <path
            d={d}
            fill="none"
            stroke="#facc15"
            strokeWidth="4.5"
            strokeDasharray="0.1 20"
            strokeDashoffset={-dotOffset * dir}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  // Helper for rendering a diode or thyristor SVG symbol with voltage-colored body and current dots
  const renderSwitch = (
    id: string,
    x: number,
    y: number,
    direction: 'horizontal' | 'vertical' = 'horizontal',
    anodeVoltage: number = vA,
    cathodeVoltage: number = vVo,
    labelOffset: { x: number; y: number } = { x: 0, y: -16 }
  ) => {
    const active = isConducting(id);
    const hasFlow = active && Math.abs(instantIout) > 0.01;
    // Active devices: white fill inside with active border; Closed devices: black fill inside with outside border
    const strokeColor = active
      ? (isDark ? '#22c55e' : '#16a34a')
      : (isDark ? '#71717a' : '#64748b');
    const fillColor = active ? '#ffffff' : '#000000';

    return (
      <g key={id}>
        {direction === 'horizontal' ? (
          <g>
            {/* Triangle pointing right (Anode left to Cathode right) */}
            <polygon
              points={`${x - 12},${y - 10} ${x - 12},${y + 10} ${x + 8},${y}`}
              stroke={strokeColor}
              strokeWidth="2"
              fill={fillColor}
            />
            {/* Vertical cathode bar */}
            <line
              x1={x + 8}
              y1={y - 12}
              x2={x + 8}
              y2={y + 12}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            {/* Gate lead for Thyristor */}
            {isThyristor && (
              <g>
                <path
                  d={`M ${x - 4} ${y + 6} L ${x - 10} ${y + 18}`}
                  stroke={gateActive && active ? '#f43f5e' : strokeColor}
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx={x - 10}
                  cy={y + 18}
                  r="2.5"
                  className={gateActive && active ? 'fill-rose-500 animate-pulse' : (isDark ? 'fill-zinc-600' : 'fill-zinc-400')}
                />
              </g>
            )}
            {/* Current dots passing forward (left to right) through switch with contrast backdrop */}
            {hasFlow && (
              <g className="pointer-events-none">
                <line
                  x1={x - 14}
                  y1={y}
                  x2={x + 10}
                  y2={y}
                  stroke="#18181b"
                  strokeWidth="6"
                  strokeDasharray="0.1 16"
                  strokeDashoffset={-dotOffset}
                  strokeLinecap="round"
                  opacity="0.35"
                />
                <line
                  x1={x - 14}
                  y1={y}
                  x2={x + 10}
                  y2={y}
                  stroke="#facc15"
                  strokeWidth="4.5"
                  strokeDasharray="0.1 16"
                  strokeDashoffset={-dotOffset}
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        ) : (
          <g>
            {/* Triangle pointing UP in bridge legs (Anode bottom to Cathode top) */}
            <polygon
              points={`${x - 10},${y + 10} ${x + 10},${y + 10} ${x},${y - 10}`}
              stroke={strokeColor}
              strokeWidth="2"
              fill={fillColor}
            />
            {/* Horizontal cathode bar at the top */}
            <line
              x1={x - 12}
              y1={y - 10}
              x2={x + 12}
              y2={y - 10}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            {/* Gate terminal for Thyristor */}
            {isThyristor && (
              <g>
                <path
                  d={`M ${x + 6} ${y + 4} L ${x + 16} ${y + 12}`}
                  stroke={gateActive && active ? '#f43f5e' : strokeColor}
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx={x + 16}
                  cy={y + 12}
                  r="2.5"
                  className={gateActive && active ? 'fill-rose-500 animate-pulse' : (isDark ? 'fill-zinc-600' : 'fill-zinc-400')}
                />
              </g>
            )}
            {/* Current dots passing forward (bottom to top, Anode to Cathode) through switch */}
            {hasFlow && (
              <g className="pointer-events-none">
                <line
                  x1={x}
                  y1={y + 12}
                  x2={x}
                  y2={y - 12}
                  stroke="#18181b"
                  strokeWidth="6"
                  strokeDasharray="0.1 16"
                  strokeDashoffset={-dotOffset}
                  strokeLinecap="round"
                  opacity="0.35"
                />
                <line
                  x1={x}
                  y1={y + 12}
                  x2={x}
                  y2={y - 12}
                  stroke="#facc15"
                  strokeWidth="4.5"
                  strokeDasharray="0.1 16"
                  strokeDashoffset={-dotOffset}
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        )}

        {/* Device Label */}
        <text
          x={x + labelOffset.x}
          y={y + labelOffset.y}
          textAnchor="middle"
          className={`font-mono text-[11px] font-bold select-none ${
            active
              ? (isDark ? 'fill-emerald-300' : 'fill-emerald-700')
              : (isDark ? 'fill-zinc-400' : 'fill-zinc-500')
          }`}
        >
          {id}
        </text>

        {/* Active state tag */}
        {active && (
          <text
            x={x + labelOffset.x}
            y={y + labelOffset.y + 12}
            textAnchor="middle"
            className="font-mono text-[8px] fill-emerald-500 select-none uppercase tracking-wider font-bold"
          >
            ON
          </text>
        )}
      </g>
    );
  };

  // Helper for rendering Load block (R, L, C, FWD) with EveryCircuit voltage shades and current dots
  const renderLoad = (x: number, yTop: number, yBottom: number, loadCurrentActive: boolean) => {
    const hasInductance = loadType === 'RL' || loadType === 'RL_FWD';
    const hasCapacitor = loadType === 'RC';
    const hasFWD = loadType === 'RL_FWD';
    const fwdActive = isConducting('FWD');
    const hasFlow = loadCurrentActive && Math.abs(instantIout) > 0.01;

    return (
      <g>
        {/* Load loop vertical backbone with current dots flowing DOWNWARDS */}
        {renderWire(x, yTop, x, yBottom, vVo, hasFlow, 1, 'load-backbone')}

        {/* Resistor R (box) */}
        <g transform={`translate(${x}, ${yTop + (yBottom - yTop) * 0.3})`}>
          <rect
            x="-10"
            y="-16"
            width="20"
            height="32"
            fill={isDark ? '#09090b' : '#ffffff'}
            stroke={getVoltageColor(vVo, maxV, isDark)}
            strokeWidth="2"
          />
          <text
            x="18"
            y="4"
            fill={isDark ? '#f4f4f5' : '#0f172a'}
            className="font-mono text-[11px] font-semibold"
          >
            R ({params.resistance}Ω)
          </text>
        </g>

        {/* Inductor L in series below resistor */}
        {hasInductance && (
          <g transform={`translate(${x}, ${yTop + (yBottom - yTop) * 0.72})`}>
            {/* Choke coils */}
            <path
              d="M 0 -18 C -12 -12 -12 0 0 0 C -12 6 -12 18 0 18"
              fill="none"
              stroke={hasFlow ? '#22c55e' : (isDark ? '#52525b' : '#94a3b8')}
              strokeWidth="2.5"
            />
            {hasFlow && (
              <path
                d="M 0 -18 C -12 -12 -12 0 0 0 C -12 6 -12 18 0 18"
                fill="none"
                stroke="#facc15"
                strokeWidth="4"
                strokeDasharray="0.1 16"
                strokeDashoffset={-dotOffset}
                strokeLinecap="round"
                className="pointer-events-none"
              />
            )}
            <text
              x="18"
              y="4"
              fill={isDark ? '#6ee7b7' : '#059669'}
              className="font-mono text-[11px] font-semibold"
            >
              L ({params.inductance}mH)
            </text>
          </g>
        )}

        {/* Parallel Smoothing Capacitor for RC */}
        {hasCapacitor && (
          <g key="c-group">
            {renderWire(x, yTop, x + 60, yTop, vVo, false, 1, 'c-top-lead')}
            {renderWire(x, yBottom, x + 60, yBottom, vGnd, false, 1, 'c-bot-lead')}
            {renderWire(x + 60, yTop, x + 60, yTop + 55, vVo, false, 1, 'c-plate1-lead')}
            {renderWire(x + 60, yBottom, x + 60, yTop + 75, vGnd, false, 1, 'c-plate2-lead')}

            {/* Capacitor parallel plates */}
            <line x1={x + 48} y1={yTop + 55} x2={x + 72} y2={yTop + 55} stroke={getVoltageColor(vVo, maxV, isDark)} strokeWidth="3.5" />
            <line x1={x + 48} y1={yTop + 75} x2={x + 72} y2={yTop + 75} stroke={getVoltageColor(vGnd, maxV, isDark)} strokeWidth="3.5" />
            <text
              x={x + 80}
              y={yTop + 68}
              fill={isDark ? '#67e8f9' : '#0284c7'}
              className="font-mono text-[11px] font-semibold"
            >
              C ({params.capacitance}µF)
            </text>
          </g>
        )}

        {/* Freewheeling Diode (FWD) with EveryCircuit loop current */}
        {hasFWD && (
          <g key="fwd-group">
            {renderWire(x - 55, yTop, x, yTop, vVo, fwdActive, 1, 'fwd-top')}
            {renderWire(x, yBottom, x - 55, yBottom, vGnd, fwdActive, 1, 'fwd-bot')}
            {renderWire(x - 55, yTop + 55, x - 55, yTop, vVo, fwdActive, 1, 'fwd-vert-top')}
            {renderWire(x - 55, yBottom, x - 55, yTop + 80, vGnd, fwdActive, 1, 'fwd-vert-bot')}

            {/* FWD Triangle (pointing UP from ground to cathode) */}
            <polygon
              points={`${x - 65},${yTop + 80} ${x - 45},${yTop + 80} ${x - 55},${yTop + 55}`}
              stroke={fwdActive ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#71717a' : '#64748b')}
              strokeWidth="2"
              fill={fwdActive ? '#ffffff' : '#000000'}
            />
            <line
              x1={x - 67}
              y1={yTop + 55}
              x2={x - 43}
              y2={yTop + 55}
              stroke={fwdActive ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#71717a' : '#64748b')}
              strokeWidth="2.5"
            />
            {/* Current dots flowing upward through FWD during freewheeling */}
            {fwdActive && Math.abs(instantIout) > 0.01 && (
              <g className="pointer-events-none">
                <line
                  x1={x - 55}
                  y1={yTop + 80}
                  x2={x - 55}
                  y2={yTop + 55}
                  stroke="#18181b"
                  strokeWidth="6"
                  strokeDasharray="0.1 16"
                  strokeDashoffset={-dotOffset}
                  strokeLinecap="round"
                  opacity="0.35"
                />
                <line
                  x1={x - 55}
                  y1={yTop + 80}
                  x2={x - 55}
                  y2={yTop + 55}
                  stroke="#facc15"
                  strokeWidth="4.5"
                  strokeDasharray="0.1 16"
                  strokeDashoffset={-dotOffset}
                  strokeLinecap="round"
                />
              </g>
            )}

            <text
              x={x - 55}
              y={yTop + 42}
              textAnchor="middle"
              className={`font-mono text-[10px] font-bold ${
                fwdActive ? (isDark ? 'fill-emerald-300' : 'fill-emerald-700') : (isDark ? 'fill-zinc-400' : 'fill-zinc-500')
              }`}
            >
              FWD
            </text>
            {fwdActive && (
              <text
                x={x - 55}
                y={yTop + 96}
                textAnchor="middle"
                className="font-mono text-[8px] fill-emerald-500 select-none uppercase tracking-wider font-bold"
              >
                FREEWHEEL
              </text>
            )}
          </g>
        )}

        {/* Load Voltage Probe (+) and (-) with voltage-tinted indicators */}
        <circle cx={x} cy={yTop} r="3.5" fill={getVoltageColor(vVo, maxV, isDark)} />
        <circle cx={x} cy={yBottom} r="3.5" fill={getVoltageColor(vGnd, maxV, isDark)} />
        <text x={x - 12} y={yTop + 4} fill={getVoltageColor(vVo, maxV, isDark)} className="font-mono text-[11px] font-bold">+</text>
        <text x={x - 12} y={yBottom + 4} fill={getVoltageColor(vGnd, maxV, isDark)} className="font-mono text-[11px] font-bold">-</text>
        <text x={x + 10} y={yTop - 6} fill={isDark ? '#71717a' : '#64748b'} className="font-mono text-[10px]">Vo(+)</text>
        <text x={x + 10} y={yBottom + 14} fill={isDark ? '#71717a' : '#64748b'} className="font-mono text-[10px]">Vo(-)</text>
      </g>
    );
  };

  // Render SVG circuit according to topology in authentic EveryCircuit style
  const renderCircuitSVG = () => {
    // 1-Phase Half-Wave (Diode or Thyristor)
    if (phase === '1phase' && config === 'half-wave') {
      const devName = isThyristor ? 'T1' : 'D1';
      const cond = isConducting(devName);
      const hasFlow = cond && Math.abs(instantIout) > 0.01;

      return (
        <svg viewBox="0 0 640 280" className="w-full h-auto max-h-[250px] select-none">
          <defs>
            <pattern id="ecGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill={isDark ? '#27272a' : '#cbd5e1'} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ecGrid)" />

          {/* AC Voltage Source */}
          <g transform="translate(100, 140)">
            <circle
              cx="0"
              cy="0"
              r="28"
              fill={isDark ? '#09090b' : '#ffffff'}
              stroke={getVoltageColor(vA, maxV, isDark)}
              strokeWidth="2"
            />
            <path
              d="M -16 0 Q -8 -16 0 0 Q 8 16 16 0"
              fill="none"
              stroke={getVoltageColor(vA, maxV, isDark)}
              strokeWidth="2.5"
            />
            <text x="-40" y="-34" fill={getVoltageColor(vA, maxV, isDark)} className="font-mono text-xs font-semibold">
              Vs(t)
            </text>
            <text x="0" y="44" textAnchor="middle" fill={isDark ? '#71717a' : '#64748b'} className="font-mono text-[10px]">
              {vA.toFixed(1)}V / {params.frequency}Hz
            </text>
          </g>

          {/* Top Conductor Line from Source to Switch Anode (voltage = vA) */}
          {renderWire(100, 112, 100, 70, vA, hasFlow, 1, 'src-top-vert')}
          {renderWire(100, 70, 260, 70, vA, hasFlow, 1, 'src-top-horiz')}

          {/* Primary Switch D1 / T1 */}
          {renderSwitch(devName, 280, 70, 'horizontal', vA, vVo)}

          {/* Conductor from Switch Cathode to Load (voltage = vVo) */}
          {renderWire(300, 70, 480, 70, vVo, hasFlow, 1, 'sw-to-load')}

          {/* Bottom Return line to Source (voltage = 0V reference) */}
          {renderWire(480, 210, 100, 210, vGnd, hasFlow, 1, 'load-bot-horiz')}
          {renderWire(100, 210, 100, 168, vGnd, hasFlow, 1, 'src-bot-vert')}

          {/* Load Block */}
          {renderLoad(480, 70, 210, cond || isConducting('FWD'))}
        </svg>
      );
    }

    // 1-Phase Full-Wave Bridge
    if (phase === '1phase' && config === 'full-wave') {
      const p1 = isThyristor ? 'T1' : 'D1';
      const p2 = isThyristor ? 'T2' : 'D2';
      const p3 = isThyristor ? 'T3' : 'D3';
      const p4 = isThyristor ? 'T4' : 'D4';

      const pair1Cond = isConducting(p1) && isConducting(p2);
      const pair2Cond = isConducting(p3) && isConducting(p4);
      const anyCond = pair1Cond || pair2Cond;
      const hasFlow = anyCond && Math.abs(instantIout) > 0.01;

      // Terminal A is top of AC, Terminal B is bottom of AC
      const vAcA = pair1Cond ? vVo : (pair2Cond ? vGnd : vA / 2);
      const vAcB = pair1Cond ? vGnd : (pair2Cond ? vVo : -vA / 2);

      return (
        <svg viewBox="0 0 680 320" className="w-full h-auto max-h-[250px] select-none">
          <defs>
            <pattern id="ecGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill={isDark ? '#27272a' : '#cbd5e1'} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ecGrid)" />

          {/* AC Voltage Source */}
          <g transform="translate(80, 160)">
            <circle
              cx="0"
              cy="0"
              r="26"
              fill={isDark ? '#09090b' : '#ffffff'}
              stroke={getVoltageColor(vA, maxV, isDark)}
              strokeWidth="2"
            />
            <path
              d="M -14 0 Q -7 -14 0 0 Q 7 14 14 0"
              fill="none"
              stroke={getVoltageColor(vA, maxV, isDark)}
              strokeWidth="2"
            />
            <text x="0" y="-36" textAnchor="middle" fill={getVoltageColor(vA, maxV, isDark)} className="font-mono text-xs font-semibold">
              Vs(t): {vA.toFixed(1)}V
            </text>
            <text x="0" y="42" textAnchor="middle" fill={isDark ? '#71717a' : '#64748b'} className="font-mono text-[10px]">
              {params.sourceVrms}Vrms
            </text>
          </g>

          {/* AC Feeds to Bridge legs */}
          {renderPath('M 80 134 L 80 110 L 220 110', vAcA, hasFlow, pair1Cond ? 1 : -1, 'ac-feed-a')}
          {renderPath('M 80 186 L 80 210 L 320 210', vAcB, hasFlow, pair2Cond ? 1 : -1, 'ac-feed-b')}

          {/* Left Leg: D1 / T1 (top) and D3 / T3 (bottom) */}
          {renderWire(220, 68, 220, 50, vVo, pair1Cond, 1, 'leg1-top')}
          {renderSwitch(p1, 220, 80, 'vertical', vAcA, vVo, { x: -26, y: 0 })}
          {renderWire(220, 110, 220, 92, vAcA, pair1Cond, 1, 'leg1-mid-up')}
          {renderWire(220, 228, 220, 110, vAcA, pair2Cond, 1, 'leg1-mid-low')}
          {renderSwitch(p3, 220, 240, 'vertical', vGnd, vAcA, { x: -26, y: 0 })}
          {renderWire(220, 270, 220, 252, vGnd, pair2Cond, 1, 'leg1-bot')}

          {/* Right Leg: D4 / T4 (top) and D2 / T2 (bottom) */}
          {renderWire(320, 68, 320, 50, vVo, pair2Cond, 1, 'leg2-top')}
          {renderSwitch(p4, 320, 80, 'vertical', vAcB, vVo, { x: 26, y: 0 })}
          {renderWire(320, 210, 320, 92, vAcB, pair2Cond, 1, 'leg2-mid-up')}
          {renderWire(320, 228, 320, 210, vAcB, pair1Cond, 1, 'leg2-mid-low')}
          {renderSwitch(p2, 320, 240, 'vertical', vGnd, vAcB, { x: 26, y: 0 })}
          {renderWire(320, 270, 320, 252, vGnd, pair1Cond, 1, 'leg2-bot')}

          {/* DC Bus rails with voltage shade and current dots - segmented so current only flows till active leg */}
          {renderWire(220, 50, 320, 50, vVo, pair1Cond, 1, 'dc-pos-rail-1')}
          {renderWire(320, 50, 520, 50, vVo, anyCond, 1, 'dc-pos-rail-2')}

          {renderWire(520, 270, 320, 270, vGnd, anyCond, 1, 'dc-neg-rail-1')}
          {renderWire(320, 270, 220, 270, vGnd, pair2Cond, 1, 'dc-neg-rail-2')}

          <text x="370" y="40" textAnchor="middle" fill={getVoltageColor(vVo, maxV, isDark)} className="font-mono text-[10px] font-bold">
            DC+ Cathode Bus ({vVo.toFixed(1)}V)
          </text>
          <text x="370" y="292" textAnchor="middle" fill={getVoltageColor(vGnd, maxV, isDark)} className="font-mono text-[10px] font-bold">
            DC- Anode Return (0V)
          </text>

          {renderLoad(520, 50, 270, anyCond || isConducting('FWD'))}
        </svg>
      );
    }

    // 3-Phase Half-Wave (3-Pulse Star)
    if (phase === '3phase' && config === 'half-wave') {
      const d1 = isThyristor ? 'T1' : 'D1';
      const d2 = isThyristor ? 'T2' : 'D2';
      const d3 = isThyristor ? 'T3' : 'D3';

      const cond1 = isConducting(d1);
      const cond2 = isConducting(d2);
      const cond3 = isConducting(d3);
      const anyCond = cond1 || cond2 || cond3;
      const hasFlow = anyCond && Math.abs(instantIout) > 0.01;

      return (
        <svg viewBox="0 0 700 320" className="w-full h-auto max-h-[250px] select-none">
          <defs>
            <pattern id="ecGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.8" fill={isDark ? '#27272a' : '#cbd5e1'} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ecGrid)" />

          {/* 3-Phase Generator Inputs */}
          <g transform="translate(90, 160)">
            <circle cx="0" cy="-60" r="18" fill={isDark ? '#09090b' : '#ffffff'} stroke={getVoltageColor(vA, maxV, isDark)} strokeWidth="2" />
            <text x="0" y="-56" textAnchor="middle" fill={getVoltageColor(vA, maxV, isDark)} className="font-mono text-[10px] font-bold">A</text>

            <circle cx="0" cy="0" r="18" fill={isDark ? '#09090b' : '#ffffff'} stroke={getVoltageColor(vB, maxV, isDark)} strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fill={getVoltageColor(vB, maxV, isDark)} className="font-mono text-[10px] font-bold">B</text>

            <circle cx="0" cy="60" r="18" fill={isDark ? '#09090b' : '#ffffff'} stroke={getVoltageColor(vC, maxV, isDark)} strokeWidth="2" />
            <text x="0" y="64" textAnchor="middle" fill={getVoltageColor(vC, maxV, isDark)} className="font-mono text-[10px] font-bold">C</text>

            {/* Star Neutral center */}
            <circle cx="-40" cy="0" r="4" fill={getVoltageColor(vGnd, maxV, isDark)} />
            <line x1="-40" y1="0" x2="0" y2="-60" stroke={getVoltageColor(vGnd, maxV, isDark)} strokeWidth="1.5" />
            <line x1="-40" y1="0" x2="0" y2="0" stroke={getVoltageColor(vGnd, maxV, isDark)} strokeWidth="1.5" />
            <line x1="-40" y1="0" x2="0" y2="60" stroke={getVoltageColor(vGnd, maxV, isDark)} strokeWidth="1.5" />
            <text x="-48" y="4" textAnchor="end" fill={isDark ? '#71717a' : '#64748b'} className="font-mono text-[11px] font-bold">N</text>
          </g>

          {/* Phase Lines to Switches (Forward Flow into Anodes) */}
          {renderWire(108, 100, 286, 100, vA, cond1, 1, 'line-a')}
          {renderSwitch(d1, 300, 100, 'horizontal', vA, vVo)}
          {renderWire(310, 100, 400, 100, vVo, cond1, 1, 'd1-out')}

          {renderWire(108, 160, 286, 160, vB, cond2, 1, 'line-b')}
          {renderSwitch(d2, 300, 160, 'horizontal', vB, vVo)}
          {renderWire(310, 160, 400, 160, vVo, cond2, 1, 'd2-out')}

          {renderWire(108, 220, 286, 220, vC, cond3, 1, 'line-c')}
          {renderSwitch(d3, 300, 220, 'horizontal', vC, vVo)}
          {renderWire(310, 220, 400, 220, vVo, cond3, 1, 'd3-out')}

          {/* Common Cathode Bus to Load Top (All flow UP and RIGHT towards Load) */}
          {renderWire(400, 220, 400, 160, vVo, cond3, 1, 'cat-bus-c-b')}
          {renderWire(400, 160, 400, 100, vVo, cond2 || cond3, 1, 'cat-bus-b-a')}
          {renderWire(400, 100, 400, 60, vVo, hasFlow, 1, 'cat-bus-vert-top')}
          {renderWire(400, 60, 530, 60, vVo, hasFlow, 1, 'cat-bus-horiz-top')}

          {/* Neutral return bus to load bottom */}
          {renderPath('M 530 270 L 50 270 L 50 160', vGnd, hasFlow, 1, 'neutral-return')}
          <text x="250" y="286" fill={getVoltageColor(vGnd, maxV, isDark)} className="font-mono text-[10px]">
            Neutral Return Line (0V)
          </text>

          <text x="400" y="50" textAnchor="middle" fill={getVoltageColor(vVo, maxV, isDark)} className="font-mono text-[10px] font-bold">
            Common Cathode (+{vVo.toFixed(1)}V)
          </text>

          {renderLoad(530, 60, 270, anyCond || isConducting('FWD'))}
        </svg>
      );
    }

    // 3-Phase Full-Wave 6-Pulse Bridge
    const p1 = isThyristor ? 'T1' : 'D1';
    const p2 = isThyristor ? 'T2' : 'D2';
    const p3 = isThyristor ? 'T3' : 'D3';
    const p4 = isThyristor ? 'T4' : 'D4';
    const p5 = isThyristor ? 'T5' : 'D5';
    const p6 = isThyristor ? 'T6' : 'D6';

    const condP1 = isConducting(p1);
    const condP2 = isConducting(p2);
    const condP3 = isConducting(p3);
    const condP4 = isConducting(p4);
    const condP5 = isConducting(p5);
    const condP6 = isConducting(p6);

    const anyCond = conductingDevices.length > 0;
    const hasFlow = anyCond && Math.abs(instantIout) > 0.01;

    return (
      <svg viewBox="0 0 740 330" className="w-full h-auto max-h-[250px] select-none">
        <defs>
          <pattern id="ecGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill={isDark ? '#27272a' : '#cbd5e1'} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ecGrid)" />

        {/* 3-Phase Generator Inputs */}
        <g transform="translate(60, 165)">
          <circle cx="0" cy="-45" r="16" fill={isDark ? '#09090b' : '#ffffff'} stroke={getVoltageColor(vA, maxV, isDark)} strokeWidth="2" />
          <text x="0" y="-41" textAnchor="middle" fill={getVoltageColor(vA, maxV, isDark)} className="font-mono text-[10px] font-bold">A</text>

          <circle cx="0" cy="0" r="16" fill={isDark ? '#09090b' : '#ffffff'} stroke={getVoltageColor(vB, maxV, isDark)} strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fill={getVoltageColor(vB, maxV, isDark)} className="font-mono text-[10px] font-bold">B</text>

          <circle cx="0" cy="45" r="16" fill={isDark ? '#09090b' : '#ffffff'} stroke={getVoltageColor(vC, maxV, isDark)} strokeWidth="2" />
          <text x="0" y="49" textAnchor="middle" fill={getVoltageColor(vC, maxV, isDark)} className="font-mono text-[10px] font-bold">C</text>
        </g>

        {/* 3-Phase Feed lines to the Bridge Legs */}
        {renderPath('M 76 120 L 190 120 L 190 165', vA, condP1 || condP4, condP1 ? 1 : -1, 'feed-a')}
        {renderWire(76, 165, 280, 165, vB, condP3 || condP6, condP3 ? 1 : -1, 'feed-b')}
        {renderPath('M 76 210 L 370 210 L 370 165', vC, condP5 || condP2, condP5 ? 1 : -1, 'feed-c')}

        {/* Leg 1 (Phase A): T1 / D1 (top) and T4 / D4 (bottom) */}
        {renderWire(190, 68, 190, 50, vVo, condP1, 1, 'leg1-top')}
        {renderSwitch(p1, 190, 85, 'vertical', vA, vVo, { x: -24, y: 0 })}
        {renderWire(190, 165, 190, 97, vA, condP1, 1, 'leg1-mid-up')}
        {renderWire(190, 233, 190, 165, vA, condP4, 1, 'leg1-mid-low')}
        {renderSwitch(p4, 190, 245, 'vertical', vGnd, vA, { x: -24, y: 0 })}
        {renderWire(190, 280, 190, 257, vGnd, condP4, 1, 'leg1-bot')}

        {/* Leg 2 (Phase B): T3 / D3 (top) and T6 / D6 (bottom) */}
        {renderWire(280, 68, 280, 50, vVo, condP3, 1, 'leg2-top')}
        {renderSwitch(p3, 280, 85, 'vertical', vB, vVo, { x: -24, y: 0 })}
        {renderWire(280, 165, 280, 97, vB, condP3, 1, 'leg2-mid-up')}
        {renderWire(280, 233, 280, 165, vB, condP6, 1, 'leg2-mid-low')}
        {renderSwitch(p6, 280, 245, 'vertical', vGnd, vB, { x: -24, y: 0 })}
        {renderWire(280, 280, 280, 257, vGnd, condP6, 1, 'leg2-bot')}

        {/* Leg 3 (Phase C): T5 / D5 (top) and T2 / D2 (bottom) */}
        {renderWire(370, 68, 370, 50, vVo, condP5, 1, 'leg3-top')}
        {renderSwitch(p5, 370, 85, 'vertical', vC, vVo, { x: -24, y: 0 })}
        {renderWire(370, 165, 370, 97, vC, condP5, 1, 'leg3-mid-up')}
        {renderWire(370, 233, 370, 165, vC, condP2, 1, 'leg3-mid-low')}
        {renderSwitch(p2, 370, 245, 'vertical', vGnd, vC, { x: -24, y: 0 })}
        {renderWire(370, 280, 370, 257, vGnd, condP2, 1, 'leg3-bot')}

        {/* Positive DC Bus (Cathodes) - segmented so current starts only at conducting leg */}
        {renderWire(190, 50, 280, 50, vVo, condP1, 1, 'top-dc-bus-1')}
        {renderWire(280, 50, 370, 50, vVo, condP1 || condP3, 1, 'top-dc-bus-2')}
        {renderWire(370, 50, 560, 50, vVo, condP1 || condP3 || condP5, 1, 'top-dc-bus-3')}
        <text x="375" y="40" textAnchor="middle" fill={getVoltageColor(vVo, maxV, isDark)} className="font-mono text-[10px] font-bold">
          Positive DC Bus (+{vVo.toFixed(1)}V)
        </text>

        {/* Negative DC Bus (Anodes) - segmented so current stops at conducting return leg */}
        {renderWire(560, 280, 370, 280, vGnd, condP2 || condP4 || condP6, 1, 'bot-dc-bus-1')}
        {renderWire(370, 280, 280, 280, vGnd, condP4 || condP6, 1, 'bot-dc-bus-2')}
        {renderWire(280, 280, 190, 280, vGnd, condP4, 1, 'bot-dc-bus-3')}
        <text x="375" y="296" textAnchor="middle" fill={getVoltageColor(vGnd, maxV, isDark)} className="font-mono text-[10px] font-bold">
          Negative DC Bus (0V Return)
        </text>

        {renderLoad(560, 50, 280, anyCond || isConducting('FWD'))}
      </svg>
    );
  };

  return (
    <div
      className={`rounded-xl p-4 flex flex-col justify-between h-full min-h-[460px] overflow-hidden border select-none transition-colors ${
        isDark ? 'bg-black border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
      }`}
    >
      {/* Schematic Header and Live Status Bar (Locked Structure - Zero Layout Shift) */}
      <div
        className={`flex items-center justify-between gap-2 h-8 min-h-[32px] max-h-[32px] pb-2 border-b shrink-0 overflow-hidden ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 shrink">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <h3 className={`font-semibold text-xs sm:text-sm tracking-wide truncate ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
            EveryCircuit Live Schematic
          </h3>
        </div>

        {/* Instantaneous state badges - strictly stabilized widths */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono shrink-0 whitespace-nowrap overflow-hidden py-0.5">
          <span className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} flex items-center`}>
            θ=<strong className={`tabular-nums inline-block w-[38px] text-right font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{Math.round(thetaDeg)}°</strong>
          </span>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>·</span>
          <span className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} flex items-center`}>
            Vo=<strong className={`tabular-nums inline-block w-[58px] text-right font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{instantVout.toFixed(1)}V</strong>
          </span>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>·</span>
          <span className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} flex items-center`}>
            Io=<strong className={`tabular-nums inline-block w-[48px] text-right font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{instantIout.toFixed(2)}A</strong>
          </span>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>·</span>

          {/* CSS selector 1: Fixed-dimension badge that will NEVER destabilize div shape */}
          <span
            className={`w-[110px] min-w-[110px] max-w-[110px] h-[22px] min-h-[22px] max-h-[22px] px-1.5 rounded border inline-flex items-center justify-center text-center overflow-hidden whitespace-nowrap shrink-0 text-[11px] font-mono tabular-nums box-border transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700/80 text-zinc-200'
                : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}
          >
            <span className="truncate w-full text-center">
              Active:{' '}
              {conductingDevices.length > 0 ? (
                <span className={`font-semibold tabular-nums ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  {conductingDevices.join('+')}
                </span>
              ) : (
                <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>OFF</span>
              )}
            </span>
          </span>
        </div>
      </div>

      {/* EveryCircuit Vector Canvas with dark grid */}
      <div
        className={`rounded-lg p-2 sm:p-3 border overflow-hidden flex items-center justify-center flex-1 min-h-[280px] max-h-[340px] w-full shrink-0 my-2 transition-colors ${
          isDark ? 'bg-black border-zinc-800' : 'bg-slate-50 border-zinc-200'
        }`}
      >
        {renderCircuitSVG()}
      </div>

      {/* EveryCircuit Voltage & Current Legend Bar */}
      <div
        className={`flex items-center justify-between text-[11px] h-[34px] min-h-[34px] max-h-[34px] pt-1.5 border-t shrink-0 overflow-hidden ${
          isDark ? 'text-zinc-400 border-zinc-800/80' : 'text-zinc-500 border-zinc-200'
        }`}
      >
        {/* Voltage Color Scale Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-medium">Voltage:</span>
          <div className="flex items-center gap-1 font-mono text-[9px]">
            <span className="text-orange-400 font-bold">-Vpk</span>
            <div
              className="w-20 sm:w-28 h-2 rounded-full border border-zinc-700/50"
              style={{
                background: 'linear-gradient(to right, #ea580c, #71717a 50%, #22c55e)',
              }}
              title="EveryCircuit Potential Color Spectrum"
            />
            <span className="text-emerald-400 font-bold">+Vpk</span>
          </div>
        </div>

        {/* Device State Legend */}
        <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-white border border-emerald-500 inline-block shadow-[0_0_3px_rgba(34,197,94,0.4)]" />
            <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>Active (ON)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-black border border-zinc-500 inline-block" />
            <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Closed (OFF)</span>
          </div>
        </div>

        {/* Current Dot Speed Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block shadow-[0_0_6px_#facc15]"></span>
            <span className="font-mono text-[10px] hidden md:inline">Current dots:</span>
            <span className={`font-mono text-[10px] font-bold ${Math.abs(instantIout) > 0.01 ? 'text-yellow-400' : 'text-zinc-500'}`}>
              {Math.abs(instantIout) > 0.01 ? `${instantIout.toFixed(2)}A (${playbackSpeed.toFixed(2)}x)` : '0.00A (Idle)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
