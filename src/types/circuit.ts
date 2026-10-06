export type DeviceType = 'diode' | 'thyristor';
export type CircuitPhase = '1phase' | '3phase';
export type CircuitConfig = 'half-wave' | 'full-wave';
export type LoadType = 'R' | 'RL' | 'RL_FWD' | 'RC';
export type AppTheme = 'dark' | 'light';

export interface CircuitParams {
  deviceType: DeviceType;
  phase: CircuitPhase;
  config: CircuitConfig;
  loadType: LoadType;
  firingAngle: number; // in degrees: 0 to 180
  sourceVrms: number; // Phase RMS voltage in Volts (e.g. 230V)
  frequency: number; // in Hz (50 or 60 typically)
  resistance: number; // in Ohms
  inductance: number; // in mH
  capacitance: number; // in uF
}

export interface WaveformPoint {
  thetaDeg: number; // 0 to 720 degrees (2 full cycles)
  timeSec: number;
  vSourceA: number;
  vSourceB?: number;
  vSourceC?: number;
  vSourceLineAB?: number;
  vSourceLineBC?: number;
  vSourceLineCA?: number;
  vOut: number;
  iOut: number;
  gatePulse: number; // 0 or 1
  vDevice1: number; // Voltage across primary switch D1 or T1
  conductingDevices: string[]; // e.g. ['D1', 'D2'] or ['T1', 'T4']
}

export interface SimulationResult {
  waveforms: WaveformPoint[];
  metrics: CircuitMetrics;
  harmonics: HarmonicComponent[];
  conductionSummary: {
    activeIntervals: string;
    pulseNumber: number;
    conductionAngleDeg: number;
    extinctionAngleDeg?: number;
  };
}

export interface CircuitMetrics {
  vPeak: number; // Peak phase voltage Vm
  vPeakLine: number; // Peak line-to-line voltage
  vAvg: number; // Average DC Output Voltage (Vdc)
  vRms: number; // RMS DC Output Voltage (Vrms,out)
  iAvg: number; // Average Output Current (Idc)
  iRms: number; // RMS Output Current (Irms)
  pDc: number; // DC Output Power (Vdc * Idc)
  pAc: number; // AC Output Power (Vrms * Irms)
  formFactor: number; // FF = Vrms / Vavg
  rippleFactor: number; // RF = sqrt(FF^2 - 1)
  efficiency: number; // eta = Pdc / Pac (%)
  peakInverseVoltage: number; // PIV in Volts
  rippleFrequency: number; // in Hz (e.g. 1f, 2f, 3f, 6f)
  thdVoltage: number; // THD %
  powerFactor: number; // Input displacement / power factor estimate
}

export interface HarmonicComponent {
  order: number;
  frequency: number;
  magnitude: number;
  percentage: number;
}
