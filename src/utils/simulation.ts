import { CircuitParams, SimulationResult, WaveformPoint, HarmonicComponent, CircuitMetrics } from '../types/circuit';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function simulateCircuit(params: CircuitParams): SimulationResult {
  const {
    deviceType,
    phase,
    config,
    loadType,
    firingAngle: alphaDeg,
    sourceVrms,
    frequency,
    resistance: R,
    inductance: L_mH,
    capacitance: C_uF,
  } = params;

  const L = Math.max(1e-6, L_mH * 1e-3); // Henries
  const C = Math.max(1e-9, C_uF * 1e-6); // Farads
  const omega = 2 * Math.PI * frequency;
  const T = 1 / frequency;
  const Vm = sourceVrms * Math.SQRT2;
  const VmLine = Vm * Math.sqrt(3);

  // Determine effective firing angle (Diode = 0°)
  const alpha = deviceType === 'diode' ? 0 : alphaDeg;
  const alphaRad = alpha * DEG2RAD;

  // We simulate 2 cycles (0 to 720 degrees) with 720 points (1 degree resolution)
  const numSteps = 720;
  const stepDeg = 720 / numSteps;
  const dt = (2 * T) / numSteps;

  // First pass: generate raw rectified output voltage envelope vOutRaw(theta)
  const rawVoltages: number[] = new Array(numSteps);
  const conductingSwitchesList: string[][] = new Array(numSteps);
  const gatePulses: number[] = new Array(numSteps);
  const vDev1List: number[] = new Array(numSteps);

  // Line voltages helper for 3-phase
  // va = Vm * sin(theta)
  // vb = Vm * sin(theta - 120°)
  // vc = Vm * sin(theta - 240°)
  for (let i = 0; i < numSteps; i++) {
    const thetaDeg = i * stepDeg;
    const thetaRad = thetaDeg * DEG2RAD;
    const theta1CycleDeg = thetaDeg % 360;

    let vOutInstant = 0;
    let gateActive = 0;
    let vDev1 = 0;
    let conducting: string[] = [];

    const vA = Vm * Math.sin(thetaRad);
    const vB = phase === '3phase' ? Vm * Math.sin(thetaRad - 120 * DEG2RAD) : 0;
    const vC = phase === '3phase' ? Vm * Math.sin(thetaRad - 240 * DEG2RAD) : 0;

    if (phase === '1phase') {
      if (config === 'half-wave') {
        // 1-PHASE HALF-WAVE
        const pulseWidth = 10; // degrees
        if (deviceType === 'thyristor') {
          if (theta1CycleDeg >= alpha && theta1CycleDeg < alpha + pulseWidth) {
            gateActive = 1;
          }
        }

        if (deviceType === 'diode') {
          if (theta1CycleDeg >= 0 && theta1CycleDeg < 180) {
            vOutInstant = vA;
            conducting = ['D1'];
            vDev1 = 0;
          } else {
            vOutInstant = 0;
            conducting = [];
            vDev1 = vA; // Reverse bias
          }
        } else {
          // Thyristor
          if (loadType === 'R') {
            if (theta1CycleDeg >= alpha && theta1CycleDeg < 180) {
              vOutInstant = vA;
              conducting = ['T1'];
              vDev1 = 0;
            } else {
              vOutInstant = 0;
              conducting = [];
              vDev1 = vA;
            }
          } else {
            // RL or RL_FWD: For RL, conduction extends past 180° up to extinction angle beta
            const phi = Math.atan2(omega * L, R);
            // approximate beta: alpha + conduction angle (approx 180° for high inductance)
            const conductionAngle = Math.min(180, 180 - alpha + (phi * RAD2DEG * 0.8));
            const betaDeg = alpha + conductionAngle;

            if (loadType === 'RL_FWD') {
              if (theta1CycleDeg >= alpha && theta1CycleDeg < 180) {
                vOutInstant = vA;
                conducting = ['T1'];
                vDev1 = 0;
              } else if (theta1CycleDeg >= 180 && theta1CycleDeg < betaDeg) {
                vOutInstant = 0;
                conducting = ['FWD'];
                vDev1 = vA;
              } else {
                vOutInstant = 0;
                conducting = [];
                vDev1 = vA;
              }
            } else {
              // RL without FWD: vOut follows vA even below zero until beta
              if (theta1CycleDeg >= alpha && theta1CycleDeg < betaDeg) {
                vOutInstant = vA;
                conducting = ['T1'];
                vDev1 = 0;
              } else {
                vOutInstant = 0;
                conducting = [];
                vDev1 = vA;
              }
            }
          }
        }
      } else {
        // 1-PHASE FULL-WAVE BRIDGE
        const pulseWidth = 10;
        if (deviceType === 'thyristor') {
          if (
            (theta1CycleDeg >= alpha && theta1CycleDeg < alpha + pulseWidth) ||
            (theta1CycleDeg >= 180 + alpha && theta1CycleDeg < 180 + alpha + pulseWidth)
          ) {
            gateActive = 1;
          }
        }

        if (deviceType === 'diode') {
          if (theta1CycleDeg >= 0 && theta1CycleDeg < 180) {
            vOutInstant = vA;
            conducting = ['D1', 'D2'];
            vDev1 = 0;
          } else {
            vOutInstant = -vA;
            conducting = ['D3', 'D4'];
            vDev1 = -vA;
          }
        } else {
          // Thyristor Bridge
          if (loadType === 'R') {
            if (theta1CycleDeg >= alpha && theta1CycleDeg < 180) {
              vOutInstant = vA;
              conducting = ['T1', 'T2'];
              vDev1 = 0;
            } else if (theta1CycleDeg >= 180 + alpha && theta1CycleDeg < 360) {
              vOutInstant = -vA;
              conducting = ['T3', 'T4'];
              vDev1 = -vA;
            } else {
              vOutInstant = 0;
              conducting = [];
              vDev1 = (theta1CycleDeg < 180) ? vA : -vA;
            }
          } else if (loadType === 'RL_FWD') {
            if (theta1CycleDeg >= alpha && theta1CycleDeg < 180) {
              vOutInstant = vA;
              conducting = ['T1', 'T2'];
              vDev1 = 0;
            } else if (theta1CycleDeg >= 180 && theta1CycleDeg < 180 + alpha) {
              vOutInstant = 0;
              conducting = ['FWD'];
              vDev1 = vA;
            } else if (theta1CycleDeg >= 180 + alpha && theta1CycleDeg < 360) {
              vOutInstant = -vA;
              conducting = ['T3', 'T4'];
              vDev1 = -vA;
            } else {
              vOutInstant = 0;
              conducting = ['FWD'];
              vDev1 = -vA;
            }
          } else {
            // Continuous conduction RL (highly inductive load)
            if ((theta1CycleDeg >= alpha && theta1CycleDeg < 180 + alpha)) {
              vOutInstant = vA;
              conducting = ['T1', 'T2'];
              vDev1 = 0;
            } else {
              vOutInstant = -vA;
              conducting = ['T3', 'T4'];
              vDev1 = -vA;
            }
          }
        }
      }
    } else {
      // 3-PHASE
      if (config === 'half-wave') {
        // 3-PHASE HALF-WAVE (3-Pulse)
        // Natural commutation points:
        // Va max: 30° to 150°
        // Vb max: 150° to 270°
        // Vc max: 270° to 390° (30°)
        const t1Fire = (30 + alpha) % 360;
        const t2Fire = (150 + alpha) % 360;
        const t3Fire = (270 + alpha) % 360;
        const pulseWidth = 10;

        if (deviceType === 'thyristor') {
          if (
            (theta1CycleDeg >= t1Fire && theta1CycleDeg < t1Fire + pulseWidth) ||
            (theta1CycleDeg >= t2Fire && theta1CycleDeg < t2Fire + pulseWidth) ||
            (theta1CycleDeg >= t3Fire && theta1CycleDeg < t3Fire + pulseWidth)
          ) {
            gateActive = 1;
          }
        }

        if (deviceType === 'diode') {
          if (theta1CycleDeg >= 30 && theta1CycleDeg < 150) {
            vOutInstant = vA;
            conducting = ['D1'];
            vDev1 = 0;
          } else if (theta1CycleDeg >= 150 && theta1CycleDeg < 270) {
            vOutInstant = vB;
            conducting = ['D2'];
            vDev1 = vA - vB;
          } else {
            vOutInstant = vC;
            conducting = ['D3'];
            vDev1 = vA - vC;
          }
        } else {
          // Thyristor
          const startA = (30 + alpha);
          const startB = (150 + alpha);
          const startC = (270 + alpha);

          // For R load with alpha > 30°, phase goes negative at 180°
          const endA = loadType === 'R' && alpha > 30 ? 180 : startB;
          const endB = loadType === 'R' && alpha > 30 ? 300 : startC;
          const endC = loadType === 'R' && alpha > 30 ? 420 : startA + 360;

          const shiftedTheta = thetaDeg;
          const modShift = ((shiftedTheta - startA) % 360 + 360) % 360;

          if (modShift < (endA - startA)) {
            vOutInstant = vA;
            conducting = ['T1'];
            vDev1 = 0;
          } else {
            const modShiftB = ((shiftedTheta - startB) % 360 + 360) % 360;
            if (modShiftB < (endB - startB)) {
              vOutInstant = vB;
              conducting = ['T2'];
              vDev1 = vA - vB;
            } else {
              const modShiftC = ((shiftedTheta - startC) % 360 + 360) % 360;
              if (modShiftC < (endC - startC)) {
                vOutInstant = vC;
                conducting = ['T3'];
                vDev1 = vA - vC;
              } else {
                vOutInstant = 0;
                conducting = loadType === 'RL_FWD' ? ['FWD'] : [];
                vDev1 = vA;
              }
            }
          }
        }
      } else {
        // 3-PHASE FULL-WAVE BRIDGE (6-Pulse Graetz)
        // Upper: T1(A), T3(B), T5(C)
        // Lower: T4(A), T6(B), T2(C)
        // Natural firing angle reference: 60° intervals
        // Lines:
        // [60+alpha, 120+alpha]: Vab (T1, T6)
        // [120+alpha, 180+alpha]: Vac (T1, T2)
        // [180+alpha, 240+alpha]: Vbc (T3, T2)
        // [240+alpha, 300+alpha]: Vba (T3, T4)
        // [300+alpha, 360+alpha]: Vca (T5, T4)
        // [360+alpha, 420+alpha]: Vcb (T5, T6)

        const vab = vA - vB;
        const vac = vA - vC;
        const vbc = vB - vC;
        const vba = vB - vA;
        const vca = vC - vA;
        const vcb = vC - vB;

        // Natural commutation points for 6-pulse bridge occur at 30°, 90°, 150°, 210°, 270°, 330°
        const pulseOffsets = [30, 90, 150, 210, 270, 330];
        if (deviceType === 'thyristor') {
          for (const off of pulseOffsets) {
            const trigger = (off + alpha) % 360;
            if (theta1CycleDeg >= trigger && theta1CycleDeg < trigger + 10) {
              gateActive = 1;
              break;
            }
          }
        }

        const devPrefix = deviceType === 'diode' ? 'D' : 'T';
        // Normalize theta to [0, 360) starting from natural commutation (30 + alpha)
        const normTheta = ((theta1CycleDeg - (30 + alpha)) % 360 + 360) % 360;

        if (normTheta < 60) {
          vOutInstant = vab;
          conducting = [`${devPrefix}1`, `${devPrefix}6`];
          vDev1 = 0;
        } else if (normTheta < 120) {
          vOutInstant = vac;
          conducting = [`${devPrefix}1`, `${devPrefix}2`];
          vDev1 = 0;
        } else if (normTheta < 180) {
          vOutInstant = vbc;
          conducting = [`${devPrefix}3`, `${devPrefix}2`];
          vDev1 = vA - vB; // reverse bias
        } else if (normTheta < 240) {
          vOutInstant = vba;
          conducting = [`${devPrefix}3`, `${devPrefix}4`];
          vDev1 = vA - vB;
        } else if (normTheta < 300) {
          vOutInstant = vca;
          conducting = [`${devPrefix}5`, `${devPrefix}4`];
          vDev1 = vA - vC;
        } else {
          vOutInstant = vcb;
          conducting = [`${devPrefix}5`, `${devPrefix}6`];
          vDev1 = vA - vC;
        }

        // For R load with alpha > 60°, line voltage would cross zero
        if (loadType === 'R' && vOutInstant < 0) {
          vOutInstant = 0;
          conducting = [];
        } else if (loadType === 'RL_FWD' && vOutInstant < 0) {
          vOutInstant = 0;
          conducting = ['FWD'];
        }
      }
    }

    rawVoltages[i] = vOutInstant;
    conductingSwitchesList[i] = conducting;
    gatePulses[i] = gateActive;
    vDev1List[i] = vDev1;
  }

  // Load current and filter capacitor dynamics
  // RC load filter simulation:
  let finalVOut = [...rawVoltages];
  const finalIOut: number[] = new Array(numSteps);

  if (loadType === 'RC') {
    // Settle initial capacitor voltage
    let vCap = Math.max(0, rawVoltages[0]);
    // Pre-run 1 cycle to find steady state
    const tau = R * C;
    for (let cycle = 0; cycle < 2; cycle++) {
      for (let i = 0; i < numSteps; i++) {
        const vRect = rawVoltages[i];
        if (vRect > vCap) {
          // Fast charging via diode conduction
          vCap = vRect;
        } else {
          // Exponential discharge into load R
          vCap = vCap * Math.exp(-dt / tau);
        }
        if (cycle === 1) {
          finalVOut[i] = Math.max(0, vCap);
        }
      }
    }
  }

  // Current calculation:
  if (loadType === 'R') {
    for (let i = 0; i < numSteps; i++) {
      finalIOut[i] = finalVOut[i] / R;
    }
  } else if (loadType === 'RC') {
    for (let i = 0; i < numSteps; i++) {
      finalIOut[i] = finalVOut[i] / R;
    }
  } else {
    // RL or RL_FWD: ODE L * di/dt + R * i = vOut
    // Numerical integration (Euler / Trapezoidal) with 2 warmup cycles for periodic steady state
    let iCurrent = 0;
    const totalWarmup = numSteps * 2;
    for (let k = 0; k < totalWarmup; k++) {
      const idx = k % numSteps;
      const v = finalVOut[idx];
      const di = ((v - R * iCurrent) / L) * dt;
      iCurrent += di;
      if (iCurrent < 0 && loadType !== 'RL') {
        iCurrent = 0;
      }
    }

    // Now record steady state
    for (let i = 0; i < numSteps; i++) {
      const v = finalVOut[i];
      const di = ((v - R * iCurrent) / L) * dt;
      iCurrent += di;
      if (iCurrent < 0 && (loadType === 'RL_FWD' || deviceType === 'diode')) {
        iCurrent = 0;
      }
      finalIOut[i] = Math.max(0, iCurrent);
    }
  }

  // Build WaveformPoint array
  const waveforms: WaveformPoint[] = [];
  const oneCycleCount = Math.floor(numSteps / 2); // 360 degrees = 1 full AC cycle

  let sumV = 0;
  let sumV2 = 0;
  let sumI = 0;
  let sumI2 = 0;

  for (let i = 0; i < numSteps; i++) {
    const thetaDeg = i * stepDeg;
    const thetaRad = thetaDeg * DEG2RAD;
    const timeSec = thetaRad / omega;

    const vA = Vm * Math.sin(thetaRad);
    const vB = phase === '3phase' ? Vm * Math.sin(thetaRad - 120 * DEG2RAD) : undefined;
    const vC = phase === '3phase' ? Vm * Math.sin(thetaRad - 240 * DEG2RAD) : undefined;
    const vLineAB = phase === '3phase' && vB !== undefined ? vA - vB : undefined;
    const vLineBC = phase === '3phase' && vB !== undefined && vC !== undefined ? vB - vC : undefined;
    const vLineCA = phase === '3phase' && vC !== undefined ? vC - vA : undefined;

    const vOut = finalVOut[i];
    const iOut = finalIOut[i];

    waveforms.push({
      thetaDeg,
      timeSec,
      vSourceA: vA,
      vSourceB: vB,
      vSourceC: vC,
      vSourceLineAB: vLineAB,
      vSourceLineBC: vLineBC,
      vSourceLineCA: vLineCA,
      vOut,
      iOut,
      gatePulse: gatePulses[i],
      vDevice1: vDev1List[i],
      conductingDevices: conductingSwitchesList[i],
    });

    // Accumulate over the second cycle for stable steady-state metrics
    if (i >= oneCycleCount) {
      sumV += vOut;
      sumV2 += vOut * vOut;
      sumI += iOut;
      sumI2 += iOut * iOut;
    }
  }

  // Statistical calculations over 1 cycle
  const vAvg = sumV / oneCycleCount;
  const vRms = Math.sqrt(sumV2 / oneCycleCount);
  const iAvg = sumI / oneCycleCount;
  const iRms = Math.sqrt(sumI2 / oneCycleCount);
  const pDc = vAvg * iAvg;
  const pAc = vRms * iRms;

  const formFactor = Math.abs(vAvg) > 1e-4 ? vRms / Math.abs(vAvg) : 1;
  const rippleFactorRatio = Math.max(0, formFactor * formFactor - 1);
  const rippleFactor = Math.sqrt(rippleFactorRatio) * 100; // in %
  const efficiency = pAc > 1e-4 ? Math.min(100, Math.max(0, (pDc / pAc) * 100)) : 0;

  // Pulse number and ripple frequency
  let pulseNumber = 1;
  if (phase === '1phase') {
    pulseNumber = config === 'half-wave' ? 1 : 2;
  } else {
    pulseNumber = config === 'half-wave' ? 3 : 6;
  }
  const rippleFrequency = pulseNumber * frequency;

  // Peak Inverse Voltage (PIV)
  let piv = Vm;
  if (phase === '1phase') {
    piv = config === 'half-wave' ? Vm : Vm; // Bridge PIV is Vm; center-tapped is 2Vm
  } else {
    piv = VmLine; // sqrt(3) * Vm for 3-phase circuits
  }

  // Displacement Power Factor
  const powerFactor = Math.cos(alphaRad) * (config === 'full-wave' ? 0.9 : 0.7);

  // Discrete Fourier Analysis for output voltage harmonics
  const harmonics: HarmonicComponent[] = [];
  const maxHarmonic = 12;

  // Fundamental frequency of the output ripple is pulseNumber * f
  for (let n = 1; n <= maxHarmonic; n++) {
    let an = 0;
    let bn = 0;
    for (let i = oneCycleCount; i < numSteps; i++) {
      const theta = (i - oneCycleCount) * stepDeg * DEG2RAD;
      const v = finalVOut[i];
      an += v * Math.cos(n * theta);
      bn += v * Math.sin(n * theta);
    }
    an = (2 / oneCycleCount) * an;
    bn = (2 / oneCycleCount) * bn;
    const mag = Math.sqrt(an * an + bn * bn);
    const pct = vAvg > 1e-4 ? (mag / vAvg) * 100 : 0;

    harmonics.push({
      order: n,
      frequency: n * frequency,
      magnitude: mag,
      percentage: pct,
    });
  }

  // Total Harmonic Distortion calculation of output voltage
  let sumHarmonicSq = 0;
  for (const h of harmonics) {
    if (h.order > 0) {
      sumHarmonicSq += h.magnitude * h.magnitude;
    }
  }
  const thdVoltage = vAvg > 1e-4 ? (Math.sqrt(sumHarmonicSq / 2) / vAvg) * 100 : 0;

  const metrics: CircuitMetrics = {
    vPeak: Vm,
    vPeakLine: VmLine,
    vAvg,
    vRms,
    iAvg,
    iRms,
    pDc,
    pAc,
    formFactor,
    rippleFactor,
    efficiency,
    peakInverseVoltage: piv,
    rippleFrequency,
    thdVoltage,
    powerFactor: Math.max(0.1, Math.min(1.0, Math.abs(powerFactor))),
  };

  const conductionSummary = {
    activeIntervals: `${pulseNumber}-pulse output`,
    pulseNumber,
    conductionAngleDeg: 360 / pulseNumber,
    extinctionAngleDeg: loadType.startsWith('RL') ? Math.min(360, 180 + alpha / 2) : undefined,
  };

  return {
    waveforms,
    metrics,
    harmonics,
    conductionSummary,
  };
}

// Analytical reference formulas for display in formulas/analysis panel
export function getTheoreticalFormulas(params: CircuitParams) {
  const { deviceType, phase, config, loadType } = params;

  if (phase === '1phase' && config === 'half-wave') {
    if (deviceType === 'diode') {
      return {
        topologyName: 'Single-Phase Half-Wave Diode Rectifier',
        vAvgFormula: 'V_{dc} = \\frac{V_m}{\\pi} \\approx 0.318 V_m = 0.45 V_{rms}',
        vRmsFormula: 'V_{rms} = \\frac{V_m}{2} \\approx 0.707 V_{rms,in}',
        rippleFactorTheory: '121\\%',
        formFactorTheory: '1.57',
        efficiencyTheory: '40.6\\%',
        pivFormula: 'PIV = V_m = \\sqrt{2} V_{rms}',
        rippleFreq: 'f (Fundamental)',
        notes: 'Conducts during positive half cycle [0, \\pi]. Severe ripple factor, low transformer utilization.',
      };
    } else {
      return {
        topologyName: 'Single-Phase Half-Wave Thyristor Converter',
        vAvgFormula: loadType === 'R'
          ? 'V_{dc} = \\frac{V_m}{2\\pi} (1 + \\cos\\alpha)'
          : 'V_{dc} = \\frac{V_m}{2\\pi} (\\cos\\alpha - \\cos\\beta)',
        vRmsFormula: 'V_{rms} = \\frac{V_m}{2} \\sqrt{1 - \\frac{\\alpha}{\\pi} + \\frac{\\sin 2\\alpha}{2\\pi}}',
        rippleFactorTheory: 'Variable with \\alpha (\\ge 121\\%)',
        formFactorTheory: '\\ge 1.57',
        efficiencyTheory: '\\le 40.6\\%',
        pivFormula: 'PIV = V_m',
        rippleFreq: 'f',
        notes: 'Phase-controlled delay \\alpha. When \\alpha increases, average DC output decreases to zero at 180°.',
      };
    }
  }

  if (phase === '1phase' && config === 'full-wave') {
    if (deviceType === 'diode') {
      return {
        topologyName: 'Single-Phase Full-Wave Diode Bridge Rectifier',
        vAvgFormula: 'V_{dc} = \\frac{2V_m}{\\pi} \\approx 0.637 V_m = 0.90 V_{rms}',
        vRmsFormula: 'V_{rms} = \\frac{V_m}{\\sqrt{2}} = V_{rms,in}',
        rippleFactorTheory: '48.2\\%',
        formFactorTheory: '1.11',
        efficiencyTheory: '81.2\\%',
        pivFormula: 'PIV = V_m',
        rippleFreq: '2f (Twice supply frequency)',
        notes: '2-pulse rectification. Diodes conduct in diagonal pairs (D1-D2, then D3-D4).',
      };
    } else {
      return {
        topologyName: 'Single-Phase Full-Wave Fully Controlled Bridge (SCR)',
        vAvgFormula: loadType === 'R'
          ? 'V_{dc} = \\frac{V_m}{\\pi} (1 + \\cos\\alpha)'
          : 'V_{dc} = \\frac{2V_m}{\\pi} \\cos\\alpha',
        vRmsFormula: 'V_{rms} = V_m \\sqrt{\\frac{1}{2} - \\frac{\\alpha}{2\\pi} + \\frac{\\sin 2\\alpha}{4\\pi}}',
        rippleFactorTheory: 'Variable (48.2\\% at \\alpha = 0°)',
        formFactorTheory: '1.11 at \\alpha = 0°',
        efficiencyTheory: 'Up to 81.2\\%',
        pivFormula: 'PIV = V_m',
        rippleFreq: '2f',
        notes: 'Two quadrant operation capable (rectification 0° < \\alpha < 90°, inversion 90° < \\alpha < 180° with active source).',
      };
    }
  }

  if (phase === '3phase' && config === 'half-wave') {
    if (deviceType === 'diode') {
      return {
        topologyName: 'Three-Phase Half-Wave (3-Pulse) Diode Rectifier',
        vAvgFormula: 'V_{dc} = \\frac{3\\sqrt{3}V_m}{2\\pi} \\approx 0.827 V_m = 1.17 V_{ph,rms}',
        vRmsFormula: 'V_{rms} = V_m \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{8\\pi}} \\approx 0.840 V_m',
        rippleFactorTheory: '17\\%',
        formFactorTheory: '1.016',
        efficiencyTheory: '96.5\\%',
        pivFormula: 'PIV = \\sqrt{3}V_m = V_{mL}',
        rippleFreq: '3f (e.g. 150 Hz at 50 Hz)',
        notes: 'Each diode conducts for 120°. Natural commutation happens at the intersection of phase voltages (30°, 150°, 270°).',
      };
    } else {
      return {
        topologyName: 'Three-Phase Half-Wave (3-Pulse) Thyristor Converter',
        vAvgFormula: loadType === 'R' && params.firingAngle > 30
          ? 'V_{dc} = \\frac{3V_m}{2\\pi} [1 + \\cos(\\alpha + 30°)]'
          : 'V_{dc} = \\frac{3\\sqrt{3}V_m}{2\\pi} \\cos\\alpha',
        vRmsFormula: 'V_{rms} = \\sqrt{3} V_m \\sqrt{\\frac{1}{6} + \\frac{\\sqrt{3}}{8\\pi} \\cos 2\\alpha}',
        rippleFactorTheory: '\\ge 17\\%',
        formFactorTheory: '\\ge 1.016',
        efficiencyTheory: 'Up to 96.5\\%',
        pivFormula: 'PIV = \\sqrt{3}V_m',
        rippleFreq: '3f',
        notes: 'Continuous conduction for \\alpha \\le 30°. For \\alpha > 30° with R load, conduction becomes discontinuous.',
      };
    }
  }

  // 3-Phase Full-Wave Bridge (6-Pulse)
  if (deviceType === 'diode') {
    return {
      topologyName: 'Three-Phase Full-Wave 6-Pulse Diode Bridge (Graetz Bridge)',
      vAvgFormula: 'V_{dc} = \\frac{3V_{mL}}{\\pi} = \\frac{3\\sqrt{3}V_m}{\\pi} \\approx 1.654 V_m = 2.34 V_{ph,rms} = 1.35 V_{L,rms}',
      vRmsFormula: 'V_{rms} \\approx 1.655 V_m = 1.352 V_{L,rms}',
      rippleFactorTheory: '4.2\\% (Extremely smooth)',
      formFactorTheory: '1.0009',
      efficiencyTheory: '99.8\\%',
      pivFormula: 'PIV = \\sqrt{3}V_m = V_{mL}',
      rippleFreq: '6f (e.g. 300 Hz at 50 Hz)',
      notes: 'Most widely used industrial high-power rectifier. 6 commutation pulses per AC cycle with negligible ripple.',
    };
  } else {
    return {
      topologyName: 'Three-Phase Full-Wave 6-Pulse Thyristor Converter',
      vAvgFormula: loadType === 'R' && params.firingAngle > 60
        ? 'V_{dc} = \\frac{3V_{mL}}{\\pi} [1 + \\cos(\\alpha + 60°)]'
        : 'V_{dc} = \\frac{3\\sqrt{3}V_m}{\\pi} \\cos\\alpha',
      vRmsFormula: 'V_{rms} = V_{mL} \\sqrt{\\frac{1}{2} + \\frac{3\\sqrt{3}}{4\\pi} \\cos 2\\alpha}',
      rippleFactorTheory: '4.2\\% at \\alpha = 0°, increases with \\alpha',
      formFactorTheory: '1.001 at \\alpha = 0°',
      efficiencyTheory: 'Up to 99.8\\%',
      pivFormula: 'PIV = \\sqrt{3}V_m = V_{mL}',
      rippleFreq: '6f',
      notes: 'Standard industrial DC motor drive & HVDC converter topology. Six firing pulses spaced 60° apart.',
    };
  }
}
