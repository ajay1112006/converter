import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import {
  ExtractedChart,
  ExtractedImage,
  SupportedNativeChartType,
  AnyChartType,
  ChartSeries,
} from '../types';
import { renderFallbackChartSvg } from './fallback-renderer';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true, // cleans up 'c:', 'a:', 'xdr:' prefixes
});

const SUPPORTED_NATIVE_TYPES: Record<string, SupportedNativeChartType> = {
  bar: 'bar',
  col: 'col',
  column: 'col',
  line: 'line',
  pie: 'pie',
  doughnut: 'doughnut',
  scatter: 'scatter',
  area: 'area',
};

export interface ExtractionResult {
  charts: ExtractedChart[];
  images: ExtractedImage[];
}

/**
 * Extracts OpenXML charts and embedded media from an Excel .xlsx buffer.
 * If the file is a legacy .xls or has no charts/media, returns empty arrays safely.
 */
export async function extractChartsAndMediaFromBuffer(
  buffer: Buffer | ArrayBuffer
): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    charts: [],
    images: [],
  };

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    // If not a valid zip (e.g., .xls binary format), return empty
    return result;
  }

  // 1. Extract embedded media files from xl/media/
  const mediaFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith('xl/media/') && !zip.files[name].dir
  );

  for (const mediaPath of mediaFiles) {
    try {
      const file = zip.files[mediaPath];
      const baseName = mediaPath.replace('xl/media/', '');
      const ext = baseName.split('.').pop()?.toLowerCase() || 'png';
      const fileData = await file.async('nodebuffer');
      const base64 = fileData.toString('base64');
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      const dataUrl = `data:${mimeType};base64,${base64}`;

      result.images.push({
        id: mediaPath,
        name: baseName,
        extension: ext,
        base64,
        dataUrl,
      });
    } catch (e) {
      // ignore media read errors
    }
  }

  // 2. Extract charts from xl/charts/chart*.xml
  const chartFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith('xl/charts/chart') && name.endsWith('.xml')
  );

  for (const chartPath of chartFiles) {
    try {
      const chartXmlText = await zip.files[chartPath].async('string');
      const chartJson = parser.parse(chartXmlText);
      const parsedChart = parseChartXml(chartJson, chartPath);
      if (parsedChart) {
        result.charts.push(parsedChart);
      }
    } catch {
      // Continue to next chart
    }
  }

  return result;
}

/**
 * Parses raw OpenXML chart object into ExtractedChart.
 */
function parseChartXml(chartDoc: any, chartPath: string): ExtractedChart | null {
  const chartSpace = chartDoc.chartSpace;
  if (!chartSpace) return null;

  const chart = chartSpace.chart;
  if (!chart) return null;

  // Chart title extraction
  let title = 'Chart';
  try {
    if (chart.title) {
      title = extractChartTitle(chart.title);
    }
  } catch {
    title = 'Chart';
  }

  const plotArea = chart.plotArea;
  if (!plotArea) return null;

  // Find chart type element inside plotArea
  let rawChartType = 'unknown';
  let chartNode: any = null;

  const possibleTypes = [
    'barChart',
    'lineChart',
    'pieChart',
    'doughnutChart',
    'areaChart',
    'scatterChart',
    'radarChart',
    'waterfallChart',
    'treemapChart',
    'sunburstChart',
    'surfaceChart',
    'stockChart',
  ];

  for (const type of possibleTypes) {
    if (plotArea[type]) {
      rawChartType = type;
      chartNode = plotArea[type];
      break;
    }
  }

  if (!chartNode) {
    return null;
  }

  // Handle bar vs col (OpenXML barChart has barDir)
  let standardType: AnyChartType = 'unknown';
  if (rawChartType === 'barChart') {
    const barDir = chartNode.barDir?.['@_val'];
    standardType = barDir === 'col' ? 'col' : 'bar';
  } else if (rawChartType === 'lineChart') {
    standardType = 'line';
  } else if (rawChartType === 'pieChart') {
    standardType = 'pie';
  } else if (rawChartType === 'doughnutChart') {
    standardType = 'doughnut';
  } else if (rawChartType === 'areaChart') {
    standardType = 'area';
  } else if (rawChartType === 'scatterChart') {
    standardType = 'scatter';
  } else if (rawChartType === 'radarChart') {
    standardType = 'radar';
  } else if (rawChartType === 'waterfallChart') {
    standardType = 'waterfall';
  } else if (rawChartType === 'treemapChart') {
    standardType = 'treemap';
  } else {
    standardType = 'unknown';
  }

  // Extract series
  const seriesList: ChartSeries[] = [];
  const rawSeries = chartNode.ser;
  const serArray = Array.isArray(rawSeries) ? rawSeries : rawSeries ? [rawSeries] : [];

  serArray.forEach((serItem: any, idx: number) => {
    const s = extractSeriesData(serItem, idx);
    if (s) {
      seriesList.push(s);
    }
  });

  const isNative = standardType in SUPPORTED_NATIVE_TYPES;
  const nativeType = isNative ? SUPPORTED_NATIVE_TYPES[standardType] : undefined;

  let fallbackImageData: string | undefined;
  let fallbackReason: string | undefined;

  if (!isNative) {
    fallbackReason = `Native editable PowerPoint chart is not supported for '${standardType}'. Rendered as high-resolution vector image.`;
    fallbackImageData = renderFallbackChartSvg({
      title,
      type: standardType,
      series: seriesList,
      reason: fallbackReason,
    });
  }

  return {
    id: chartPath,
    title,
    type: standardType,
    isNativeSupported: isNative,
    nativeType,
    series: seriesList,
    fallbackImageData,
    fallbackReason,
  };
}

function extractChartTitle(titleNode: any): string {
  if (!titleNode) return 'Chart';

  // 1. tx -> rich -> p -> r -> t
  if (titleNode.tx?.rich?.p) {
    const p = titleNode.tx.rich.p;
    const r = Array.isArray(p.r) ? p.r : p.r ? [p.r] : [];
    const texts = r.map((item: any) => item.t || '').join('');
    if (texts.trim()) return texts.trim();
  }

  // 2. tx -> strRef -> strCache -> pt -> v
  if (titleNode.tx?.strRef?.strCache?.pt?.v) {
    return String(titleNode.tx.strRef.strCache.pt.v);
  }

  // 3. tx -> v
  if (titleNode.tx?.v) {
    return String(titleNode.tx.v);
  }

  return 'Chart';
}

function extractSeriesData(serNode: any, idx: number): ChartSeries | null {
  if (!serNode) return null;

  // Series Name
  let name = `Series ${idx + 1}`;
  if (serNode.tx?.strRef?.strCache?.pt?.v) {
    name = String(serNode.tx.strRef.strCache.pt.v);
  } else if (serNode.tx?.v) {
    name = String(serNode.tx.v);
  }

  // Categories
  const categories: (string | number)[] = [];
  const catCache = serNode.cat?.strRef?.strCache || serNode.cat?.numRef?.numCache;
  if (catCache?.pt) {
    const pts = Array.isArray(catCache.pt) ? catCache.pt : [catCache.pt];
    pts.sort((a: any, b: any) => Number(a['@_idx'] || 0) - Number(b['@_idx'] || 0));
    pts.forEach((pt: any) => {
      categories.push(pt.v !== undefined ? pt.v : '');
    });
  }

  // Values
  const values: number[] = [];
  const valCache = serNode.val?.numRef?.numCache;
  if (valCache?.pt) {
    const pts = Array.isArray(valCache.pt) ? valCache.pt : [valCache.pt];
    pts.sort((a: any, b: any) => Number(a['@_idx'] || 0) - Number(b['@_idx'] || 0));
    pts.forEach((pt: any) => {
      const num = Number(pt.v);
      values.push(isNaN(num) ? 0 : num);
    });
  }

  return {
    name,
    categories: categories.length > 0 ? categories : values.map((_, i) => `Point ${i + 1}`),
    values,
  };
}
