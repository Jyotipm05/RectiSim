export type SectionId = 'oscilloscope' | 'schematic' | 'controls' | 'analysis';

export type RowSpan = 'single' | 'multiple';

export type LayoutMode = 'custom' | 'paired-split' | 'stacked' | 'grid';

export interface LayoutConfig {
  mode: LayoutMode;
  /**
   * Order of sections
   */
  sectionOrder: SectionId[];
  /**
   * Row configuration for each section:
   * 'single': 1 section in a row (100% full width)
   * 'multiple': multiple sections in a row (50% side-by-side on large screens)
   */
  rowSpan: Record<SectionId, RowSpan>;
  /**
   * Order of top-level blocks in legacy paired-split mode
   */
  blockOrder: ('visualizers' | 'controls' | 'analysis')[];
  /**
   * Whether to swap visualizer order (true = Schematic left, Oscilloscope right)
   */
  swapVisualizers: boolean;
  /**
   * Splitter ratio percentage between visualizers (default 58%)
   */
  splitRatio: number;
  /**
   * Visibility map for each section
   */
  visible: Record<SectionId, boolean>;
  /**
   * Width specification for grid mode ('half' or 'full')
   */
  sectionWidths: Record<SectionId, 'half' | 'full'>;
  /**
   * Collapse state for each section
   */
  collapsed: Record<SectionId, boolean>;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  mode: 'custom',
  sectionOrder: ['oscilloscope', 'schematic', 'controls', 'analysis'],
  rowSpan: {
    oscilloscope: 'multiple',
    schematic: 'multiple',
    controls: 'single',
    analysis: 'single',
  },
  blockOrder: ['visualizers', 'controls', 'analysis'],
  swapVisualizers: false,
  splitRatio: 58,
  visible: {
    oscilloscope: true,
    schematic: true,
    controls: true,
    analysis: true,
  },
  sectionWidths: {
    oscilloscope: 'half',
    schematic: 'half',
    controls: 'full',
    analysis: 'full',
  },
  collapsed: {
    oscilloscope: false,
    schematic: false,
    controls: false,
    analysis: false,
  },
};

export const SECTION_METADATA: Record<
  SectionId,
  { name: string; subtitle: string; icon: string }
> = {
  oscilloscope: {
    name: 'Multi-Channel Oscilloscope',
    subtitle: 'Real-time waveforms, voltage probes & phase scrubbing',
    icon: 'Activity',
  },
  schematic: {
    name: 'Circuit Schematic',
    subtitle: 'EveryCircuit animated current flow & live state diodes',
    icon: 'Cpu',
  },
  controls: {
    name: 'Circuit Topology & Controls',
    subtitle: 'Phase, firing angle (α), load parameters (R, L, C)',
    icon: 'Sliders',
  },
  analysis: {
    name: 'Circuit Analysis & Harmonics',
    subtitle: 'Vavg, Irms, ripple factor, THD & Fourier FFT spectrum',
    icon: 'BarChart2',
  },
};
