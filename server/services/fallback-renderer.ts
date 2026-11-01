import { ExtractedChart, ChartSeries } from '../types';

/**
 * Generates an SVG representation of an unsupported chart type (Radar, Waterfall, etc.)
 * Returns a base64 encoded data URL that can be directly embedded into PowerPoint via PptxGenJS.
 */
export function renderFallbackChartSvg(chart: {
  title: string;
  type: string;
  series: ChartSeries[];
  reason?: string;
}): string {
  const width = 800;
  const height = 450;
  const margin = { top: 70, right: 180, bottom: 60, left: 70 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const title = chart.title || `${chart.type.toUpperCase()} Chart`;
  const reason = chart.reason || `Native editable PPT chart not supported for '${chart.type}'`;
  const series = chart.series.length > 0 ? chart.series : [{ name: 'Series 1', categories: ['Cat 1', 'Cat 2', 'Cat 3'], values: [10, 25, 18] }];

  const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Check if radar
  if (chart.type.toLowerCase().includes('radar')) {
    return renderRadarSvg(width, height, title, reason, series, colors);
  }

  // Waterfall or generic fallback chart
  return renderGenericFallbackSvg(width, height, margin, innerW, innerH, title, reason, chart.type, series, colors);
}

function renderRadarSvg(
  w: number,
  h: number,
  title: string,
  reason: string,
  series: ChartSeries[],
  colors: string[]
): string {
  const cx = 350;
  const cy = 250;
  const radius = 150;
  const categories = series[0]?.categories || ['A', 'B', 'C', 'D', 'E'];
  const numCats = Math.max(categories.length, 3);
  const angleStep = (2 * Math.PI) / numCats;

  // Find max value
  let maxVal = 1;
  series.forEach(s => {
    s.values.forEach(v => {
      if (v > maxVal) maxVal = v;
    });
  });

  // Concentric polygon grids
  const levels = [0.25, 0.5, 0.75, 1.0];
  const gridPolys = levels.map(lvl => {
    const pts = [];
    for (let i = 0; i < numCats; i++) {
      const a = i * angleStep - Math.PI / 2;
      const r = radius * lvl;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(' ');
  });

  // Spokes
  const spokes = [];
  const catLabels = [];
  for (let i = 0; i < numCats; i++) {
    const a = i * angleStep - Math.PI / 2;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    spokes.push(`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="3,3" />`);

    const labelR = radius + 24;
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    const catName = String(categories[i] ?? `Item ${i + 1}`);
    catLabels.push(`<text x="${lx}" y="${ly + 4}" fill="#334155" font-size="12" font-family="Segoe UI, sans-serif" font-weight="600" text-anchor="middle">${escapeXml(catName)}</text>`);
  }

  // Data polygons
  const seriesPolys = series.map((s, idx) => {
    const color = colors[idx % colors.length];
    const pts: string[] = [];
    s.values.forEach((val, i) => {
      const a = i * angleStep - Math.PI / 2;
      const r = (Math.max(val, 0) / maxVal) * radius;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    });
    const ptStr = pts.join(' ');
    return `
      <polygon points="${ptStr}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2.5" />
      ${pts.map(p => {
        const [px, py] = p.split(',');
        return `<circle cx="${px}" cy="${py}" r="4" fill="${color}" stroke="#FFFFFF" stroke-width="2" />`;
      }).join('')}
    `;
  });

  // Legend
  const legendItems = series.map((s, idx) => {
    const color = colors[idx % colors.length];
    const ly = 120 + idx * 28;
    return `
      <rect x="620" y="${ly}" width="14" height="14" rx="3" fill="${color}" />
      <text x="642" y="${ly + 11}" fill="#1E293B" font-size="12" font-family="Segoe UI, sans-serif" font-weight="500">${escapeXml(s.name)}</text>
    `;
  }).join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5" />
  
  <!-- Header Title -->
  <text x="32" y="38" fill="#0F172A" font-size="18" font-family="Segoe UI, sans-serif" font-weight="700">${escapeXml(title)}</text>
  <rect x="32" y="46" width="380" height="20" rx="4" fill="#FEF3C7" />
  <text x="40" y="60" fill="#92400E" font-size="11" font-family="Segoe UI, sans-serif" font-weight="600">ⓘ ${escapeXml(reason)}</text>

  <!-- Grid Polygons -->
  ${gridPolys.map(pts => `<polygon points="${pts}" fill="none" stroke="#E2E8F0" stroke-width="1.5" />`).join('\n')}
  ${spokes.join('\n')}
  ${catLabels.join('\n')}

  <!-- Data Polygons -->
  ${seriesPolys.join('\n')}

  <!-- Legend -->
  <text x="620" y="100" fill="#64748B" font-size="11" font-family="Segoe UI, sans-serif" font-weight="700" letter-spacing="1">SERIES</text>
  ${legendItems}
</svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function renderGenericFallbackSvg(
  w: number,
  h: number,
  margin: { top: number; right: number; bottom: number; left: number },
  innerW: number,
  innerH: number,
  title: string,
  reason: string,
  chartType: string,
  series: ChartSeries[],
  colors: string[]
): string {
  const categories = series[0]?.categories || ['Cat 1', 'Cat 2', 'Cat 3', 'Cat 4'];
  const numCats = categories.length;

  // Max and min value
  let maxVal = 0;
  let minVal = 0;
  series.forEach(s => {
    s.values.forEach(v => {
      if (v > maxVal) maxVal = v;
      if (v < minVal) minVal = v;
    });
  });
  if (maxVal === minVal) maxVal += 10;
  const range = maxVal - minVal;

  const getY = (val: number) => {
    const norm = (val - minVal) / range;
    return margin.top + innerH - norm * innerH;
  };

  // Horizontal grid lines
  const gridTicks = 5;
  const gridLines = [];
  for (let i = 0; i <= gridTicks; i++) {
    const val = minVal + (range * i) / gridTicks;
    const y = getY(val);
    gridLines.push(`
      <line x1="${margin.left}" y1="${y}" x2="${margin.left + innerW}" y2="${y}" stroke="#E2E8F0" stroke-width="1" />
      <text x="${margin.left - 10}" y="${y + 4}" fill="#64748B" font-size="11" font-family="Segoe UI, sans-serif" text-anchor="end">${Math.round(val * 10) / 10}</text>
    `);
  }

  // Draw bars or blocks
  const groupW = innerW / Math.max(numCats, 1);
  const barW = Math.max(groupW / (series.length + 1), 8);
  const elements: string[] = [];

  categories.forEach((cat, cIdx) => {
    const cx = margin.left + cIdx * groupW + groupW / 2;
    // Category label
    elements.push(`
      <text x="${cx}" y="${margin.top + innerH + 24}" fill="#475569" font-size="11" font-family="Segoe UI, sans-serif" font-weight="600" text-anchor="middle">${escapeXml(String(cat))}</text>
    `);

    series.forEach((s, sIdx) => {
      const val = s.values[cIdx] || 0;
      const y = getY(val);
      const zeroY = getY(0);
      const barH = Math.abs(zeroY - y);
      const topY = Math.min(y, zeroY);
      const bx = cx - (series.length * barW) / 2 + sIdx * barW;
      const color = colors[sIdx % colors.length];

      elements.push(`
        <rect x="${bx}" y="${topY}" width="${barW - 2}" height="${Math.max(barH, 2)}" rx="3" fill="${color}" fill-opacity="0.9" />
        <text x="${bx + (barW - 2) / 2}" y="${topY - 4}" fill="#1E293B" font-size="10" font-family="Segoe UI, sans-serif" font-weight="600" text-anchor="middle">${val}</text>
      `);
    });
  });

  // Legend
  const legendItems = series.map((s, idx) => {
    const color = colors[idx % colors.length];
    const ly = margin.top + 20 + idx * 28;
    return `
      <rect x="${margin.left + innerW + 24}" y="${ly}" width="14" height="14" rx="3" fill="${color}" />
      <text x="${margin.left + innerW + 46}" y="${ly + 11}" fill="#1E293B" font-size="12" font-family="Segoe UI, sans-serif" font-weight="500">${escapeXml(s.name)}</text>
    `;
  }).join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5" />
  
  <!-- Header Title -->
  <text x="32" y="38" fill="#0F172A" font-size="18" font-family="Segoe UI, sans-serif" font-weight="700">${escapeXml(title)}</text>
  <rect x="32" y="46" width="440" height="20" rx="4" fill="#FEF3C7" />
  <text x="40" y="60" fill="#92400E" font-size="11" font-family="Segoe UI, sans-serif" font-weight="600">ⓘ ${escapeXml(reason)}</text>

  <!-- Grids -->
  ${gridLines.join('\n')}

  <!-- Chart Elements -->
  ${elements.join('\n')}

  <!-- Legend -->
  <text x="${margin.left + innerW + 24}" y="${margin.top}" fill="#64748B" font-size="11" font-family="Segoe UI, sans-serif" font-weight="700" letter-spacing="1">SERIES</text>
  ${legendItems}
</svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
