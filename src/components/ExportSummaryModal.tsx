import React, { useState } from 'react';
import { CircuitParams, CircuitMetrics, SimulationResult, AppTheme } from '../types/circuit';
import { X, Download, Copy, Check } from 'lucide-react';

interface ExportSummaryModalProps {
  isOpen: boolean;
  theme?: AppTheme;
  onClose: () => void;
  params: CircuitParams;
  metrics: CircuitMetrics;
  simulationResult: SimulationResult;
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  isOpen,
  theme = 'dark',
  onClose,
  params,
  metrics,
  simulationResult,
}) => {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const summaryText = `--- RECTISIM CIRCUIT ANALYSIS REPORT ---
Topology: ${params.phase === '1phase' ? '1-Phase' : '3-Phase'} ${params.config === 'half-wave' ? 'Half-Wave' : 'Full-Wave'} (${params.deviceType === 'diode' ? 'Diode' : 'Thyristor SCR'})
Load Type: ${params.loadType}
Firing Angle (α): ${params.deviceType === 'thyristor' ? params.firingAngle + '°' : '0° (Diode)'}
AC Input Voltage: ${params.sourceVrms} Vrms (${metrics.vPeak.toFixed(1)} Vpeak), ${params.frequency} Hz
Load Components: R = ${params.resistance} Ω, L = ${params.inductance} mH, C = ${params.capacitance} µF

OUTPUT PERFORMANCE PARAMETERS:
- Average DC Voltage (Vdc): ${metrics.vAvg.toFixed(2)} V
- RMS Output Voltage (Vrms): ${metrics.vRms.toFixed(2)} V
- Average Output Current (Idc): ${metrics.iAvg.toFixed(2)} A
- RMS Output Current (Irms): ${metrics.iRms.toFixed(2)} A
- Output DC Power (Pdc): ${metrics.pDc.toFixed(1)} W
- Total AC Power (Pac): ${metrics.pAc.toFixed(1)} W
- Rectification Efficiency (η): ${metrics.efficiency.toFixed(1)} %
- Ripple Factor (RF): ${metrics.rippleFactor.toFixed(2)} %
- Form Factor (FF): ${metrics.formFactor.toFixed(3)}
- Output Ripple Frequency: ${metrics.rippleFrequency} Hz
- Peak Inverse Voltage (PIV): ${metrics.peakInverseVoltage.toFixed(1)} V
- Total Harmonic Distortion (THD_v): ${metrics.thdVoltage.toFixed(1)} %
- Displacement Power Factor: ${metrics.powerFactor.toFixed(3)}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const headers = ['Theta_Deg', 'Time_Sec', 'Vac_PhaseA', 'Vout', 'Iout', 'GatePulse', 'Vdevice1'];
    const rows = simulationResult.waveforms.map((w) =>
      [
        w.thetaDeg.toFixed(1),
        w.timeSec.toFixed(5),
        w.vSourceA.toFixed(2),
        w.vOut.toFixed(2),
        w.iOut.toFixed(3),
        w.gatePulse,
        w.vDevice1.toFixed(2),
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rectisim_${params.phase}_${params.config}_${params.deviceType}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto ${
        isDark ? 'bg-black/80' : 'bg-black/40'
      }`}
    >
      <div
        className={`border rounded-2xl w-full max-w-xl shadow-2xl flex flex-col my-auto transition-colors ${
          isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-zinc-800' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Download className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <h2 className="text-base font-bold">
              Export Simulation Data & Report
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

        <div className="p-6 flex flex-col gap-4">
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Export the calculated circuit parameters or download high-resolution time-domain waveform data (720 sampling points across 2 cycles) as a CSV file for MATLAB, LTspice, or Excel.
          </p>

          <div className="relative">
            <pre
              className={`p-4 rounded-xl border text-[11px] font-mono max-h-56 overflow-y-auto whitespace-pre-wrap select-all ${
                isDark
                  ? 'bg-black border-zinc-800 text-zinc-300'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
            >
              {summaryText}
            </pre>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCopy}
              className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard' : 'Copy Summary Report'}
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow"
            >
              <Download className="w-4 h-4" />
              Download Waveform CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
