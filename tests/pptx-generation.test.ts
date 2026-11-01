import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { parseWorkbookBuffer } from '../server/services/excel-parser';
import { generatePresentationBuffer } from '../server/services/pptx-generator';

describe('End-to-End PPTX Presentation Generation', () => {
  it('should generate a valid PowerPoint .pptx binary buffer from Excel data', async () => {
    // 1. Build sample workbook
    const wb = XLSX.utils.book_new();
    const sheetData = [
      ['Region', 'Q1 Revenue', 'Q2 Revenue', 'Growth Rate'],
      ['North America', 1250000, 1420000, 0.136],
      ['Europe', 980000, 1050000, 0.071],
      ['Asia Pacific', 1450000, 1820000, 0.255],
      ['Latin America', 420000, 460000, 0.095],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['B2'].w = '$1,250,000';
    ws['C2'].w = '$1,420,000';
    ws['D2'].w = '+13.6%';
    ws['B3'].w = '$980,000';
    ws['C3'].w = '$1,050,000';
    ws['D3'].w = '+7.1%';
    ws['B4'].w = '$1,450,000';
    ws['C4'].w = '$1,820,000';
    ws['D4'].w = '+25.5%';
    ws['B5'].w = '$420,000';
    ws['C5'].w = '$460,000';
    ws['D5'].w = '+9.5%';

    XLSX.utils.book_append_sheet(wb, ws, 'RegionalFinancials');

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const parsedWorkbook = parseWorkbookBuffer(excelBuffer, { filename: 'Executive_Financials.xlsx' });

    // 2. Generate PPTX buffer
    const pptxBuffer = await generatePresentationBuffer(parsedWorkbook, [], [], {
      themeId: 'indigo',
      maxRowsPerSlide: 10,
      includeTitleSlide: true,
      includeSlideNumbers: true,
    });

    expect(pptxBuffer).toBeDefined();
    expect(pptxBuffer.length).toBeGreaterThan(1000);

    // Verify OpenXML / ZIP magic number PK (0x50, 0x4B)
    expect(pptxBuffer[0]).toBe(0x50);
    expect(pptxBuffer[1]).toBe(0x4b);

    // 3. Inspect internal presentation zip files
    const zip = await JSZip.loadAsync(pptxBuffer);
    const filenames = Object.keys(zip.files);

    expect(filenames).toContain('[Content_Types].xml');
    expect(filenames).toContain('ppt/presentation.xml');
    expect(filenames.some((f) => f.startsWith('ppt/slides/slide'))).toBe(true);
  });
});
