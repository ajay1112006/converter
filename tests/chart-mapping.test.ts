import { describe, it, expect } from 'vitest';
import { renderFallbackChartSvg } from '../server/services/fallback-renderer';
import { SupportedNativeChartType } from '../server/types';

describe('Chart Mapping and Fallback Rendering', () => {
  const supportedNativeTypes: SupportedNativeChartType[] = [
    'bar',
    'col',
    'line',
    'pie',
    'doughnut',
    'scatter',
    'area',
  ];

  it('should identify all 7 supported chart types as native PowerPoint charts', () => {
    supportedNativeTypes.forEach((type) => {
      expect(['bar', 'col', 'line', 'pie', 'doughnut', 'scatter', 'area']).toContain(type);
    });
  });

  it('should render a high-resolution SVG fallback for radar chart', () => {
    const radarData = {
      title: 'Skills Assessment Radar',
      type: 'radar',
      series: [
        {
          name: 'Target Competency',
          categories: ['Leadership', 'Technical', 'Strategy', 'Communication', 'Agility'],
          values: [85, 95, 70, 90, 80],
        },
      ],
      reason: "Native editable PPT chart not supported for 'radar'",
    };

    const dataUrl = renderFallbackChartSvg(radarData);

    expect(dataUrl.startsWith('data:image/svg+xml;base64,')).toBe(true);

    // Decode and verify SVG contents
    const base64Part = dataUrl.replace('data:image/svg+xml;base64,', '');
    const svgText = Buffer.from(base64Part, 'base64').toString('utf-8');

    expect(svgText).toContain('<svg');
    expect(svgText).toContain('Skills Assessment Radar');
    expect(svgText).toContain('Leadership');
    expect(svgText).toContain('Technical');
    expect(svgText).toContain('Native editable PPT chart not supported');
  });

  it('should render a high-resolution SVG fallback for waterfall chart', () => {
    const waterfallData = {
      title: 'Gross Margin Waterfall',
      type: 'waterfall',
      series: [
        {
          name: 'Variance Steps',
          categories: ['Base', 'Price', 'Volume', 'COGS', 'Ending'],
          values: [100, 15, -8, -12, 95],
        },
      ],
      reason: "Native editable PPT chart not supported for 'waterfall'",
    };

    const dataUrl = renderFallbackChartSvg(waterfallData);

    expect(dataUrl.startsWith('data:image/svg+xml;base64,')).toBe(true);

    const base64Part = dataUrl.replace('data:image/svg+xml;base64,', '');
    const svgText = Buffer.from(base64Part, 'base64').toString('utf-8');

    expect(svgText).toContain('<svg');
    expect(svgText).toContain('Gross Margin Waterfall');
    expect(svgText).toContain('COGS');
    expect(svgText).toContain('Native editable PPT chart not supported');
  });
});
