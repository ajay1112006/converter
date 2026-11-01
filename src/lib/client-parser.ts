import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import {
  ClientInspectionResult,
  ClientSheet,
  ClientChartInfo,
  ClientRow,
  ClientCell,
  ClientStoryboardSlide,
} from '../types';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});

const SUPPORTED_NATIVE_TYPES = new Set(['bar', 'col', 'column', 'line', 'pie', 'doughnut', 'scatter', 'area']);

/**
 * Parses an uploaded Excel file locally in the client browser.
 * Validates format, extracts sheets, headers, number formatting, and chart info.
 */
export async function inspectFileClientSide(file: File): Promise<ClientInspectionResult> {
  if (!file || file.size === 0) {
    throw new Error('The selected file is empty (0 bytes). Please upload a valid Excel workbook.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'xlsx' && ext !== 'xls') {
    throw new Error(`Unsupported file type: .${ext}. Only Excel (.xlsx, .xls) files are supported.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Validate magic bytes
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isOle2 = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;

  if (!isZip && !isOle2) {
    throw new Error('Corrupted or invalid file format. The file does not have a valid Excel signature.');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellNF: true,
      cellStyles: true,
      raw: false,
    });
  } catch (err: any) {
    throw new Error(`Failed to parse workbook: ${err?.message || 'Corrupted Excel file.'}`);
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The workbook contains no worksheets.');
  }

  const sheets: ClientSheet[] = [];
  let totalRows = 0;

  workbook.SheetNames.forEach((sheetName, index) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return;

    const ref = ws['!ref'];
    if (!ref) {
      sheets.push({
        name: sheetName,
        index,
        rowCount: 0,
        colCount: 0,
        headers: [],
        rows: [],
        isEmpty: true,
        selected: true,
      });
      return;
    }

    const range = XLSX.utils.decode_range(ref);
    const allRows: ClientRow[] = [];

    for (let r = range.s.r; r <= range.e.r; r++) {
      const row: ClientRow = [];
      let hasContent = false;

      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        const parsed = parseClientCell(cell);
        row.push(parsed);

        if (parsed.formatted !== '') {
          hasContent = true;
        }
      }

      if (hasContent) {
        allRows.push(row);
      }
    }

    if (allRows.length === 0) {
      sheets.push({
        name: sheetName,
        index,
        rowCount: 0,
        colCount: 0,
        headers: [],
        rows: [],
        isEmpty: true,
        selected: true,
      });
      return;
    }

    const headers = allRows[0].map((c, i) => (c.formatted.trim().length > 0 ? c.formatted.trim() : `Col ${i + 1}`));
    const dataRows = allRows.slice(1);

    totalRows += dataRows.length;
    sheets.push({
      name: sheetName,
      index,
      rowCount: dataRows.length,
      colCount: headers.length,
      headers,
      rows: dataRows,
      isEmpty: false,
      selected: true,
    });
  });

  // Client-side quick inspection of charts and media if .xlsx
  const charts: ClientChartInfo[] = [];
  let imageCount = 0;

  if (isZip) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const mediaFiles = Object.keys(zip.files).filter((n) => n.startsWith('xl/media/') && !zip.files[n].dir);
      imageCount = mediaFiles.length;

      const chartFiles = Object.keys(zip.files).filter((n) => n.startsWith('xl/charts/chart') && n.endsWith('.xml'));

      for (const cf of chartFiles) {
        try {
          const xml = await zip.files[cf].async('string');
          const json = xmlParser.parse(xml);
          const plotArea = json.chartSpace?.chart?.plotArea;
          if (plotArea) {
            let chartType = 'chart';
            let title = 'Excel Chart';

            // Title
            try {
              const tNode = json.chartSpace.chart.title;
              if (tNode?.tx?.rich?.p) {
                const r = tNode.tx.rich.p.r;
                const rArr = Array.isArray(r) ? r : [r];
                title = rArr.map((x: any) => x.t || '').join('').trim() || title;
              }
            } catch {
              // fallback title
            }

            // Type
            if (plotArea.barChart) {
              const dir = plotArea.barChart.barDir?.['@_val'];
              chartType = dir === 'col' ? 'col' : 'bar';
            } else if (plotArea.lineChart) chartType = 'line';
            else if (plotArea.pieChart) chartType = 'pie';
            else if (plotArea.doughnutChart) chartType = 'doughnut';
            else if (plotArea.areaChart) chartType = 'area';
            else if (plotArea.scatterChart) chartType = 'scatter';
            else if (plotArea.radarChart) chartType = 'radar';
            else if (plotArea.waterfallChart) chartType = 'waterfall';
            else chartType = 'other';

            const isNative = SUPPORTED_NATIVE_TYPES.has(chartType);

            charts.push({
              id: cf,
              title,
              type: chartType,
              isNativeSupported: isNative,
              fallbackReason: isNative
                ? undefined
                : `Non-native chart type '${chartType}'. Rendered as high-resolution image fallback.`,
            });
          }
        } catch {
          // ignore individual chart parse failure
        }
      }
    } catch {
      // ignore zip inspection errors
    }
  }

  return {
    filename: file.name,
    fileSize: file.size,
    totalRows,
    sheets,
    charts,
    imageCount,
    rawFile: file,
  };
}

function parseClientCell(cell: XLSX.CellObject | undefined): ClientCell {
  if (!cell || cell.v === undefined || cell.v === null || cell.v === '') {
    return { raw: '', formatted: '', type: 'empty', isNumber: false, align: 'left' };
  }

  const raw = cell.v;
  let formatted = '';
  let type: ClientCell['type'] = 'string';
  let isNumber = false;
  let align: 'left' | 'center' | 'right' = 'left';

  if (cell.t === 'n') {
    type = 'number';
    isNumber = true;
    align = 'right';
    if (typeof cell.w === 'string' && cell.w.trim().length > 0) {
      formatted = cell.w;
    } else if (cell.z) {
      try {
        formatted = XLSX.utils.format_cell(cell);
      } catch {
        formatted = String(raw);
      }
    } else {
      formatted = String(raw);
    }
  } else if (cell.t === 'd' || raw instanceof Date) {
    type = 'date';
    align = 'center';
    if (typeof cell.w === 'string' && cell.w.trim().length > 0) {
      formatted = cell.w;
    } else if (raw instanceof Date) {
      formatted = raw.toISOString().split('T')[0];
    } else {
      formatted = String(raw);
    }
  } else if (cell.t === 'b') {
    type = 'boolean';
    align = 'center';
    formatted = raw ? 'TRUE' : 'FALSE';
  } else if (cell.t === 'e') {
    type = 'error';
    align = 'center';
    formatted = typeof cell.w === 'string' ? cell.w : `#ERROR(${raw})`;
  } else {
    type = 'string';
    align = 'left';
    formatted = typeof cell.w === 'string' ? cell.w : String(raw);
  }

  return { raw, formatted, type, isNumber, align };
}

/**
 * Builds storyboard slides representing the exact presentation outline.
 */
export function buildStoryboardSlides(
  inspection: ClientInspectionResult,
  selectedSheets: string[],
  maxRowsPerSlide: number,
  includeTitleSlide: boolean
): ClientStoryboardSlide[] {
  const slides: ClientStoryboardSlide[] = [];
  let slideNum = 1;

  // 1. Title Slide
  if (includeTitleSlide) {
    slides.push({
      id: 'slide-title',
      slideNumber: slideNum++,
      type: 'title',
      title: inspection.filename.replace(/\.[^/.]+$/, ''),
      subtitle: `Excel to PowerPoint Report • ${inspection.sheets.length} Sheets • ${inspection.totalRows} Total Rows`,
    });
  }

  // 2. Sheets
  const activeSheets = inspection.sheets.filter((s) => selectedSheets.includes(s.name));

  for (const sheet of activeSheets) {
    if (sheet.isEmpty || sheet.rows.length === 0) {
      slides.push({
        id: `slide-empty-${sheet.name}`,
        slideNumber: slideNum++,
        type: 'empty',
        title: sheet.name,
        subtitle: 'Empty Worksheet (No tabular data)',
        sheetName: sheet.name,
      });
      continue;
    }

    const totalRows = sheet.rows.length;
    const numParts = Math.ceil(totalRows / maxRowsPerSlide);

    for (let part = 0; part < numParts; part++) {
      const start = part * maxRowsPerSlide + 1;
      const end = Math.min(start + maxRowsPerSlide - 1, totalRows);
      const isContinuation = part > 0;

      slides.push({
        id: `slide-${sheet.name}-part-${part + 1}`,
        slideNumber: slideNum++,
        type: 'table',
        title: isContinuation ? `${sheet.name} (Cont. - Part ${part + 1})` : sheet.name,
        subtitle: `Rows ${start}–${end} of ${totalRows} | Source: Sheet '${sheet.name}'`,
        sheetName: sheet.name,
        rowCount: end - start + 1,
        rowRange: `Rows ${start}–${end}`,
        previewData: sheet.rows.slice(start - 1, Math.min(start + 2, end)),
      });
    }
  }

  // 3. Charts
  for (const chart of inspection.charts) {
    slides.push({
      id: `slide-chart-${chart.id}`,
      slideNumber: slideNum++,
      type: 'chart',
      title: chart.title,
      subtitle: chart.isNativeSupported
        ? `Native Editable PowerPoint Chart (${chart.type.toUpperCase()})`
        : `High-Resolution Image (${chart.fallbackReason || 'Non-native chart type'})`,
      previewData: chart,
    });
  }

  // 4. Images
  if (inspection.imageCount > 0) {
    for (let i = 1; i <= inspection.imageCount; i++) {
      slides.push({
        id: `slide-image-${i}`,
        slideNumber: slideNum++,
        type: 'image',
        title: `Embedded Media ${i}`,
        subtitle: 'Extracted from source workbook media',
      });
    }
  }

  return slides;
}
