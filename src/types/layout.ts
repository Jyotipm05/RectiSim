export type SectionId = 'oscilloscope' | 'schematic' | 'controls' | 'analysis';

export interface LayoutRow {
  id: string;
  sections: SectionId[]; // 1 section (single in row) or 2 sections (double in row)
  splitRatio: number; // width percentage of the first section in a 2-in-1 row (25% to 75%, default 50%)
}

export interface LayoutConfig {
  rows: LayoutRow[];
  visible: Record<SectionId, boolean>;
  collapsed: Record<SectionId, boolean>;
  // Optional legacy fields for backward compatibility
  mode?: string;
  sectionOrder?: SectionId[];
  rowSpan?: Record<SectionId, 'single' | 'multiple'>;
  sectionWidths?: Record<SectionId, 'half' | 'full'>;
  blockOrder?: ('visualizers' | 'controls' | 'analysis')[];
  swapVisualizers?: boolean;
  splitRatio?: number;
}

export const DEFAULT_LAYOUT_ROWS: LayoutRow[] = [
  { id: 'row-visualizers', sections: ['oscilloscope', 'schematic'], splitRatio: 58 },
  { id: 'row-controls', sections: ['controls'], splitRatio: 50 },
  { id: 'row-analysis', sections: ['analysis'], splitRatio: 50 },
];

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  rows: DEFAULT_LAYOUT_ROWS,
  visible: {
    oscilloscope: true,
    schematic: true,
    controls: true,
    analysis: true,
  },
  collapsed: {
    oscilloscope: false,
    schematic: false,
    controls: false,
    analysis: false,
  },
};

export function normalizeLayoutConfig(saved: any): LayoutConfig {
  if (saved && Array.isArray(saved.rows) && saved.rows.length > 0) {
    const seen = new Set<SectionId>();
    const validRows: LayoutRow[] = [];
    for (const r of saved.rows) {
      if (Array.isArray(r.sections)) {
        const filtered = r.sections.filter((s: any): s is SectionId =>
          ['oscilloscope', 'schematic', 'controls', 'analysis'].includes(s) && !seen.has(s)
        );
        filtered.forEach((s: SectionId) => seen.add(s));
        if (filtered.length > 0) {
          validRows.push({
            id: r.id || `row-${validRows.length}`,
            sections: filtered.slice(0, 2),
            splitRatio: typeof r.splitRatio === 'number' ? r.splitRatio : 50,
          });
        }
      }
    }
    const allSections: SectionId[] = ['oscilloscope', 'schematic', 'controls', 'analysis'];
    for (const s of allSections) {
      if (!seen.has(s)) {
        validRows.push({ id: `row-${s}`, sections: [s], splitRatio: 50 });
        seen.add(s);
      }
    }
    return {
      rows: validRows,
      visible: { ...DEFAULT_LAYOUT_CONFIG.visible, ...(saved.visible || {}) },
      collapsed: { ...DEFAULT_LAYOUT_CONFIG.collapsed, ...(saved.collapsed || {}) },
    };
  }

  // Migrate older sectionOrder/rowSpan representation
  if (saved && Array.isArray(saved.sectionOrder)) {
    const rows: LayoutRow[] = [];
    const order: SectionId[] = saved.sectionOrder;
    let i = 0;
    while (i < order.length) {
      const s1 = order[i];
      const isMultiple1 = saved.rowSpan?.[s1] === 'multiple' || saved.sectionWidths?.[s1] === 'half';
      if (isMultiple1 && i + 1 < order.length) {
        const s2 = order[i + 1];
        const isMultiple2 = saved.rowSpan?.[s2] === 'multiple' || saved.sectionWidths?.[s2] === 'half';
        if (isMultiple2) {
          rows.push({
            id: `row-${s1}-${s2}`,
            sections: [s1, s2],
            splitRatio: s1 === 'oscilloscope' && s2 === 'schematic' ? 58 : 50,
          });
          i += 2;
          continue;
        }
      }
      rows.push({ id: `row-${s1}`, sections: [s1], splitRatio: 50 });
      i++;
    }
    return {
      rows,
      visible: { ...DEFAULT_LAYOUT_CONFIG.visible, ...(saved.visible || {}) },
      collapsed: { ...DEFAULT_LAYOUT_CONFIG.collapsed, ...(saved.collapsed || {}) },
    };
  }

  return DEFAULT_LAYOUT_CONFIG;
}

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
