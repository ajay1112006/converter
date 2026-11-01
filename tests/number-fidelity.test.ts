import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseWorkbookBuffer, parseCell } from '../server/services/excel-parser';

describe('Number Formatting and Cell Value Fidelity', () => {
  it('should preserve currency formatting exactly as formatted in Excel', () => {
    const cell: XLSX.CellObject = {
      t: 'n',
      v: 1250.75,
      w: '$1,250.75',
      z: '$#,##0.00',
    };

    const parsed = parseCell(cell);
    expect(parsed.raw).toBe(1250.75);
    expect(parsed.formatted).toBe('$1,250.75');
    expect(parsed.isNumber).toBe(true);
    expect(parsed.align).toBe('right');
  });

  it('should preserve percentage formatting with exact decimals', () => {
    const cell: XLSX.CellObject = {
      t: 'n',
      v: 0.4582,
      w: '45.82%',
      z: '0.00%',
    };

    const parsed = parseCell(cell);
    expect(parsed.raw).toBe(0.4582);
    expect(parsed.formatted).toBe('45.82%');
    expect(parsed.isNumber).toBe(true);
    expect(parsed.align).toBe('right');
  });

  it('should preserve negative numbers in accounting brackets or minus sign', () => {
    const cellBracket: XLSX.CellObject = {
      t: 'n',
      v: -500,
      w: '(500.00)',
      z: '#,##0.00;(#,##0.00);"-"',
    };

    const parsedBracket = parseCell(cellBracket);
    expect(parsedBracket.formatted).toBe('(500.00)');
    expect(parsedBracket.isNumber).toBe(true);

    const cellMinus: XLSX.CellObject = {
      t: 'n',
      v: -1200,
      w: '-1,200',
      z: '#,##0',
    };

    const parsedMinus = parseCell(cellMinus);
    expect(parsedMinus.formatted).toBe('-1,200');
  });

  it('should preserve small decimal precision without rounding errors', () => {
    const cell: XLSX.CellObject = {
      t: 'n',
      v: 0.000125,
      w: '0.000125',
    };

    const parsed = parseCell(cell);
    expect(parsed.formatted).toBe('0.000125');
  });

  it('should preserve dates formatted in cell', () => {
    const cell: XLSX.CellObject = {
      t: 'd',
      v: new Date('2024-05-18T00:00:00.000Z'),
      w: '2024-05-18',
    };

    const parsed = parseCell(cell);
    expect(parsed.formatted).toBe('2024-05-18');
    expect(parsed.type).toBe('date');
    expect(parsed.align).toBe('center');
  });

  it('should preserve text alignment and booleans', () => {
    const boolTrue: XLSX.CellObject = { t: 'b', v: true, w: 'TRUE' };
    const parsedBool = parseCell(boolTrue);
    expect(parsedBool.formatted).toBe('TRUE');
    expect(parsedBool.align).toBe('center');

    const textCell: XLSX.CellObject = { t: 's', v: 'Acme Corp, Inc.', w: 'Acme Corp, Inc.' };
    const parsedText = parseCell(textCell);
    expect(parsedText.formatted).toBe('Acme Corp, Inc.');
    expect(parsedText.align).toBe('left');
  });

  it('should read a full workbook sheet with exact numbers preserved across rows', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Metric', 'Target', 'Actual', 'Variance'],
      ['Q1 Margin', 0.25, 0.274, '+2.4%'],
      ['Q2 Revenue', 500000, 523450.5, '$23,450.50'],
    ]);

    // Set custom number format codes on cells
    ws['B2'].z = '0.0%';
    ws['C2'].z = '0.0%';
    ws['B3'].z = '$#,##0';
    ws['C3'].z = '$#,##0.00';

    XLSX.utils.book_append_sheet(wb, ws, 'FinancialMetrics');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const parsed = parseWorkbookBuffer(buffer);

    const rows = parsed.sheets[0].tables[0].rows;
    expect(rows[0][1].formatted).toBe('25.0%');
    expect(rows[0][2].formatted).toBe('27.4%');
    expect(rows[0][3].formatted).toBe('+2.4%');
    expect(rows[1][1].formatted).toBe('$500,000');
    expect(rows[1][2].formatted).toBe('$523,450.50');
  });
});
