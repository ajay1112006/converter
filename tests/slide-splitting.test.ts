import { describe, it, expect } from 'vitest';
import { chunkTableForSlides, calculateColumnWidths } from '../server/services/table-formatter';
import { ParsedTable, ParsedRow, PresentationTheme } from '../server/types';
import { THEMES } from '../server/services/themes';

describe('Slide Splitting and Table Pagination', () => {
  const theme: PresentationTheme = THEMES.indigo;

  function createMockTable(rowCount: number, colCount: number = 3): ParsedTable {
    const headers = Array.from({ length: colCount }, (_, i) => `Header ${i + 1}`);
    const rows: ParsedRow[] = [];

    for (let r = 1; r <= rowCount; r++) {
      const row = headers.map((_, c) => ({
        raw: `Row ${r} Col ${c + 1}`,
        formatted: `Row ${r} Col ${c + 1}`,
        type: 'string' as const,
        isNumber: false,
        align: 'left' as const,
      }));
      rows.push(row);
    }

    return {
      headers,
      rows,
      range: `A1:C${rowCount + 1}`,
      numColumns: colCount,
      numRows: rowCount,
    };
  }

  it('should split a 25-row table into 3 slides when maxRowsPerSlide is 10', () => {
    const table = createMockTable(25);
    const chunks = chunkTableForSlides(table, 'QuarterlyRevenue', 10, theme);

    expect(chunks.length).toBe(3);

    // Chunk 1
    expect(chunks[0].slideTitle).toBe('QuarterlyRevenue');
    expect(chunks[0].partIndex).toBe(1);
    expect(chunks[0].totalParts).toBe(3);
    expect(chunks[0].startRow).toBe(1);
    expect(chunks[0].endRow).toBe(10);
    expect(chunks[0].rows.length).toBe(10);

    // Chunk 2
    expect(chunks[1].slideTitle).toBe('QuarterlyRevenue (Cont. - Part 2)');
    expect(chunks[1].partIndex).toBe(2);
    expect(chunks[1].startRow).toBe(11);
    expect(chunks[1].endRow).toBe(20);
    expect(chunks[1].rows.length).toBe(10);

    // Chunk 3
    expect(chunks[2].slideTitle).toBe('QuarterlyRevenue (Cont. - Part 3)');
    expect(chunks[2].partIndex).toBe(3);
    expect(chunks[2].startRow).toBe(21);
    expect(chunks[2].endRow).toBe(25);
    expect(chunks[2].rows.length).toBe(5);
  });

  it('should repeat the header row on every slide chunk', () => {
    const table = createMockTable(15);
    const chunks = chunkTableForSlides(table, 'Inventory', 8, theme);

    expect(chunks.length).toBe(2);

    chunks.forEach((chunk) => {
      // pptxTableRows[0] must be the header cells
      const headerRow = chunk.pptxTableRows[0];
      expect(headerRow.length).toBe(3);
      expect(headerRow[0].text).toBe('Header 1');
      expect(headerRow[1].text).toBe('Header 2');
      expect(headerRow[2].text).toBe('Header 3');
      expect(headerRow[0].options.bold).toBe(true);
      expect(headerRow[0].options.fill.color).toBe(theme.headerBgColor);
    });
  });

  it('should preserve all data rows without losing or duplicating items across chunks', () => {
    const table = createMockTable(37);
    const chunks = chunkTableForSlides(table, 'Transactions', 10, theme);

    let totalChunkedRows = 0;
    const collectedFirstColValues: string[] = [];

    chunks.forEach((chunk) => {
      totalChunkedRows += chunk.rows.length;
      chunk.rows.forEach((row) => {
        collectedFirstColValues.push(row[0].formatted);
      });
    });

    expect(totalChunkedRows).toBe(37);
    expect(collectedFirstColValues.length).toBe(37);
    expect(collectedFirstColValues[0]).toBe('Row 1 Col 1');
    expect(collectedFirstColValues[36]).toBe('Row 37 Col 1');
  });

  it('should calculate valid proportional column widths', () => {
    const headers = ['ID', 'Customer Description With Long Name', 'Total'];
    const rows: ParsedRow[] = [
      [
        { raw: 1, formatted: '1', type: 'number', isNumber: true, align: 'right' },
        { raw: 'Acme International Corporation', formatted: 'Acme International Corporation', type: 'string', isNumber: false, align: 'left' },
        { raw: 500, formatted: '$500.00', type: 'number', isNumber: true, align: 'right' },
      ],
    ];

    const widths = calculateColumnWidths(headers, rows);
    expect(widths.length).toBe(3);

    // Sum should be approximately totalAvailableWidth (9.2 inches)
    const sum = widths.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 9.2)).toBeLessThan(0.05);

    // The longer text column (index 1) should be wider than the short ID column (index 0)
    expect(widths[1]).toBeGreaterThan(widths[0]);
  });
});
