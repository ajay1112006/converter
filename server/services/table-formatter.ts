import { ParsedTable, ParsedRow, PresentationTheme } from '../types';

export interface TableSlideChunk {
  sheetName: string;
  slideTitle: string;
  subtitle: string;
  partIndex: number;
  totalParts: number;
  startRow: number;
  endRow: number;
  totalRows: number;
  headers: string[];
  rows: ParsedRow[];
  colWidths: number[];
  pptxTableRows: any[];
}

/**
 * Splits a parsed table into presentation-ready slide chunks,
 * ensuring no slide is cluttered and text size remains readable.
 */
export function chunkTableForSlides(
  table: ParsedTable,
  sheetName: string,
  maxRowsPerSlide: number = 10,
  theme: PresentationTheme
): TableSlideChunk[] {
  const chunks: TableSlideChunk[] = [];
  const totalRows = table.rows.length;

  if (totalRows === 0) {
    return [];
  }

  const numParts = Math.ceil(totalRows / maxRowsPerSlide);

  // Compute relative column widths based on maximum character length in each column
  const colWidths = calculateColumnWidths(table.headers, table.rows);

  for (let part = 0; part < numParts; part++) {
    const startIdx = part * maxRowsPerSlide;
    const endIdx = Math.min(startIdx + maxRowsPerSlide, totalRows);
    const chunkRows = table.rows.slice(startIdx, endIdx);

    const isFirstPart = part === 0;
    const slideTitle = isFirstPart ? sheetName : `${sheetName} (Cont. - Part ${part + 1})`;
    const subtitle = `Rows ${startIdx + 1}–${endIdx} of ${totalRows} | Source: Sheet '${sheetName}'`;

    // Build PptxGenJS table rows format
    const pptxTableRows: any[] = [];

    // Header Row
    const headerCells = table.headers.map((h) => ({
      text: h,
      options: {
        fill: { color: theme.headerBgColor },
        color: theme.headerTextColor,
        bold: true,
        fontSize: 11,
        fontFace: theme.fontFace,
        align: 'center' as const,
        valign: 'middle' as const,
        margin: [4, 6, 4, 6],
      },
    }));
    pptxTableRows.push(headerCells);

    // Data Rows
    chunkRows.forEach((row, rIdx) => {
      const isEven = rIdx % 2 === 0;
      const rowFill = isEven ? 'FFFFFF' : theme.lightBgColor;

      const cells = row.map((cell) => ({
        text: cell.formatted,
        options: {
          fill: { color: rowFill },
          color: theme.textColor,
          fontSize: 10,
          fontFace: theme.fontFace,
          align: cell.align,
          valign: 'middle' as const,
          margin: [3, 5, 3, 5],
        },
      }));
      pptxTableRows.push(cells);
    });

    chunks.push({
      sheetName,
      slideTitle,
      subtitle,
      partIndex: part + 1,
      totalParts: numParts,
      startRow: startIdx + 1,
      endRow: endIdx,
      totalRows,
      headers: table.headers,
      rows: chunkRows,
      colWidths,
      pptxTableRows,
    });
  }

  return chunks;
}

/**
 * Calculates proportional column widths fitting within slide width (~9.0 inches out of 10.0-inch 16:9 layout).
 */
export function calculateColumnWidths(headers: string[], rows: ParsedRow[]): number[] {
  const numCols = headers.length;
  if (numCols === 0) return [];

  const maxCharsPerCol = new Array(numCols).fill(4);

  // Check header lengths
  headers.forEach((h, i) => {
    maxCharsPerCol[i] = Math.max(maxCharsPerCol[i], String(h).length);
  });

  // Check sample row lengths
  const sampleRows = rows.slice(0, 50);
  sampleRows.forEach((row) => {
    row.forEach((cell, i) => {
      if (i < numCols) {
        maxCharsPerCol[i] = Math.max(maxCharsPerCol[i], cell.formatted.length);
      }
    });
  });

  // Total weight
  const totalWeight = maxCharsPerCol.reduce((a, b) => a + b, 0);
  const totalAvailableWidth = 9.2; // inches on a 10" wide slide

  // Min width per col: 0.8 inches, max: 4.0 inches
  const widths = maxCharsPerCol.map((chars) => {
    const raw = (chars / totalWeight) * totalAvailableWidth;
    return Math.max(0.7, Math.min(raw, 3.5));
  });

  // Rescale to exact total width
  const currentTotal = widths.reduce((a, b) => a + b, 0);
  return widths.map((w) => Math.round((w / currentTotal) * totalAvailableWidth * 100) / 100);
}
