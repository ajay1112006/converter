import PptxGenJS from 'pptxgenjs';
import { ClientInspectionResult, ClientSheet, ThemeConfig } from '../types';
import { THEME_CONFIGS } from '../components/ThemeOptions';

/**
 * Client-side PowerPoint presentation generator fallback using PptxGenJS directly in the browser.
 * Ensures the user can download their presentation even if the backend server is unreachable.
 */
export async function generateClientSidePptx(
  inspection: ClientInspectionResult,
  selectedSheetNames: string[],
  themeId: string,
  maxRowsPerSlide: number,
  includeTitleSlide: boolean,
  includeSlideNumbers: boolean
): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const theme = THEME_CONFIGS.find((t) => t.id === themeId) || THEME_CONFIGS[0];
  const primaryHex = theme.primary.replace('#', '');
  const bgLightHex = theme.bgLight.replace('#', '');

  // 1. Title Slide
  if (includeTitleSlide) {
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: bgLightHex };

    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.18,
      fill: { color: primaryHex },
      line: { color: primaryHex },
    });

    titleSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 0.8,
      w: 8.4,
      h: 4.0,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.15,
    });

    titleSlide.addText('EXCEL TO POWERPOINT REPORT', {
      x: 1.2,
      y: 1.2,
      w: 7.6,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: primaryHex,
      charSpacing: 2,
    });

    titleSlide.addText(inspection.filename.replace(/\.[^/.]+$/, ''), {
      x: 1.2,
      y: 1.6,
      w: 7.6,
      h: 0.9,
      fontSize: 28,
      bold: true,
      color: '0F172A',
    });

    const dateStr = new Date().toLocaleDateString();
    const sheetCount = selectedSheetNames.length;
    titleSlide.addText(`Generated on ${dateStr} • ${sheetCount} ${sheetCount === 1 ? 'Sheet' : 'Sheets'} • ${inspection.totalRows} Total Rows`, {
      x: 1.2,
      y: 2.6,
      w: 7.6,
      h: 0.4,
      fontSize: 13,
      color: '64748B',
    });

    titleSlide.addText('Exact data reproduction from workbook cells without summarization.', {
      x: 1.2,
      y: 3.4,
      w: 7.6,
      h: 0.4,
      fontSize: 10,
      color: '94A3B8',
      italic: true,
    });
  }

  // 2. Table Slides for Selected Sheets
  const activeSheets = inspection.sheets.filter((s) => selectedSheetNames.includes(s.name));

  for (const sheet of activeSheets) {
    if (sheet.isEmpty || sheet.rows.length === 0) {
      const emptySlide = pptx.addSlide();
      emptySlide.background = { color: 'FFFFFF' };
      addSlideHeader(emptySlide, sheet.name, 'Empty Worksheet', primaryHex);
      emptySlide.addText('This worksheet contains no tabular data.', {
        x: 0.8,
        y: 2.2,
        w: 8.4,
        h: 0.8,
        fontSize: 14,
        color: '94A3B8',
        align: 'center',
      });
      continue;
    }

    const totalRows = sheet.rows.length;
    const numParts = Math.ceil(totalRows / maxRowsPerSlide);

    for (let part = 0; part < numParts; part++) {
      const startIdx = part * maxRowsPerSlide;
      const endIdx = Math.min(startIdx + maxRowsPerSlide, totalRows);
      const chunkRows = sheet.rows.slice(startIdx, endIdx);

      const isFirst = part === 0;
      const slideTitle = isFirst ? sheet.name : `${sheet.name} (Cont. - Part ${part + 1})`;
      const subtitle = `Rows ${startIdx + 1}–${endIdx} of ${totalRows} | Source: Sheet '${sheet.name}'`;

      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      addSlideHeader(slide, slideTitle, subtitle, primaryHex);

      // Build Table
      const pptxTableRows: any[] = [];

      // Header row
      const headerCells = sheet.headers.map((h) => ({
        text: h,
        options: {
          fill: { color: primaryHex },
          color: 'FFFFFF',
          bold: true,
          fontSize: 11,
          align: 'center' as const,
          valign: 'middle' as const,
          margin: [4, 6, 4, 6],
        },
      }));
      pptxTableRows.push(headerCells);

      // Data rows
      chunkRows.forEach((row, rIdx) => {
        const isEven = rIdx % 2 === 0;
        const fill = isEven ? 'FFFFFF' : bgLightHex;

        const cells = row.map((cell) => ({
          text: cell.formatted,
          options: {
            fill: { color: fill },
            color: '0F172A',
            fontSize: 10,
            align: cell.align,
            valign: 'middle' as const,
            margin: [3, 5, 3, 5],
          },
        }));
        pptxTableRows.push(cells);
      });

      slide.addTable(pptxTableRows, {
        x: 0.4,
        y: 1.25,
        w: 9.2,
        border: { pt: 0.5, color: 'E2E8F0' },
        autoPage: false,
      });

      addSlideFooter(slide, includeSlideNumbers);
    }
  }

  // 3. Output as Blob
  const blobOutput = await pptx.write({ outputType: 'blob' });
  return blobOutput as Blob;
}

function addSlideHeader(slide: any, title: string, subtitle: string, primaryHex: string) {
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: primaryHex },
    line: { color: primaryHex },
  });

  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9.0,
    h: 0.45,
    fontSize: 20,
    bold: true,
    color: '0F172A',
  });

  slide.addText(subtitle, {
    x: 0.5,
    y: 0.75,
    w: 9.0,
    h: 0.3,
    fontSize: 10.5,
    color: '64748B',
  });
}

function addSlideFooter(slide: any, includeSlideNumbers: boolean) {
  slide.addText('Exact data from source workbook | No AI summarization', {
    x: 0.5,
    y: 5.25,
    w: 7.0,
    h: 0.25,
    fontSize: 8.5,
    color: '94A3B8',
  });

  if (includeSlideNumbers) {
    slide.addText('Converted with Excel to PPTX', {
      x: 7.5,
      y: 5.25,
      w: 2.0,
      h: 0.25,
      fontSize: 8.5,
      color: '94A3B8',
      align: 'right',
    });
  }
}
