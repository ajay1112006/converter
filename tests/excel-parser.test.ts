import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseWorkbookBuffer, parseCell } from '../server/services/excel-parser';

describe('Excel Parser Service', () => {
  it('should parse a multi-sheet workbook correctly', () => {
    // Create in-memory workbook with 2 sheets
    const wb = XLSX.utils.book_new();
    const ws1Data = [
      ['Product', 'Revenue', 'Units'],
      ['Alpha', 15000, 120],
      ['Beta', 23500, 180],
    ];
    const ws2Data = [
      ['Region', 'Manager', 'Quota'],
      ['North', 'Alice', 100000],
      ['South', 'Bob', 120000],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);

    XLSX.utils.book_append_sheet(wb, ws1, 'SalesData');
    XLSX.utils.book_append_sheet(wb, ws2, 'RegionalTeam');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const parsed = parseWorkbookBuffer(buffer, { filename: 'TestSales.xlsx' });

    expect(parsed.filename).toBe('TestSales.xlsx');
    expect(parsed.sheets.length).toBe(2);
    expect(parsed.sheets[0].name).toBe('SalesData');
    expect(parsed.sheets[0].tables[0].headers).toEqual(['Product', 'Revenue', 'Units']);
    expect(parsed.sheets[0].tables[0].rows.length).toBe(2);
    expect(parsed.sheets[1].name).toBe('RegionalTeam');
    expect(parsed.sheets[1].tables[0].headers).toEqual(['Region', 'Manager', 'Quota']);
  });

  it('should handle empty sheets gracefully without crashing', () => {
    const wb = XLSX.utils.book_new();
    const wsEmpty = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, wsEmpty, 'BlankSheet');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const parsed = parseWorkbookBuffer(buffer, { filename: 'Empty.xlsx' });

    expect(parsed.sheets.length).toBe(1);
    expect(parsed.sheets[0].isEmpty).toBe(true);
    expect(parsed.sheets[0].rowCount).toBe(0);
  });

  it('should throw an error for empty 0-byte buffer', () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(() => parseWorkbookBuffer(emptyBuffer)).toThrow(/empty/i);
  });

  it('should throw an error for corrupted file data', () => {
    const corruptedBuffer = Buffer.from('this is not a valid excel zip buffer');
    expect(() => parseWorkbookBuffer(corruptedBuffer)).toThrow(/Failed to parse Excel workbook/i);
  });

  it('should filter selected sheets when selectedSheets option is provided', () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([['A', 'B'], [1, 2]]);
    const ws2 = XLSX.utils.aoa_to_sheet([['C', 'D'], [3, 4]]);
    XLSX.utils.book_append_sheet(wb, ws1, 'KeepMe');
    XLSX.utils.book_append_sheet(wb, ws2, 'IgnoreMe');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const parsed = parseWorkbookBuffer(buffer, {
      filename: 'FilterTest.xlsx',
      selectedSheets: ['KeepMe'],
    });

    expect(parsed.sheets.length).toBe(1);
    expect(parsed.sheets[0].name).toBe('KeepMe');
  });
});
