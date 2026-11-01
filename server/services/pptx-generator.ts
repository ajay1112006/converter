import PptxGenJS from 'pptxgenjs';
import {
  ParsedWorkbook,
  ExtractedChart,
  ExtractedImage,
  ConversionOptions,
  SupportedNativeChartType,
} from '../types';
import { getTheme } from './themes';
import { chunkTableForSlides } from './table-formatter';

/**
 * Generates an editable PowerPoint presentation from a parsed Excel workbook.
 * Entirely data-driven: no invented data, exact numerical reproduction.
 */
export async function generatePresentationBuffer(
  workbook: ParsedWorkbook,
  charts: ExtractedChart[] = [],
  images: ExtractedImage[] = [],
  options: ConversionOptions = {}
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Set 16:9 widescreen layout
  pptx.layout = 'LAYOUT_16x9';

  const theme = getTheme(options.themeId);
  const maxRowsPerSlide = options.maxRowsPerSlide || 10;
  const includeTitleSlide = options.includeTitleSlide !== false;
  const includeSlideNumbers = options.includeSlideNumbers !== false;

  // 1. Title Slide
  if (includeTitleSlide) {
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: theme.lightBgColor };

    // Accent header ribbon
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.2,
      fill: { color: theme.primaryColor },
      line: { color: theme.primaryColor },
    });

    // Main Card
    titleSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 0.8,
      w: 8.4,
      h: 4.0,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.15,
    });

    // Badge
    titleSlide.addText('EXCEL TO POWERPOINT REPORT', {
      x: 1.2,
      y: 1.2,
      w: 7.6,
      h: 0.3,
      fontSize: 10,
      fontFace: theme.fontFace,
      bold: true,
      color: theme.primaryColor,
      charSpacing: 2,
    });

    // Presentation Title
    titleSlide.addText(workbook.metadata.title || workbook.filename, {
      x: 1.2,
      y: 1.6,
      w: 7.6,
      h: 0.9,
      fontSize: 28,
      fontFace: theme.fontFace,
      bold: true,
      color: theme.textColor,
    });

    // Subtitle / Date
    const dateStr = workbook.metadata.created || new Date().toLocaleDateString();
    const sheetCount = workbook.sheets.length;
    const chartCount = charts.length;
    const subtitle = `Generated on ${dateStr} • ${sheetCount} ${sheetCount === 1 ? 'Sheet' : 'Sheets'} • ${workbook.totalRows} Data Rows${chartCount > 0 ? ` • ${chartCount} Charts` : ''}`;

    titleSlide.addText(subtitle, {
      x: 1.2,
      y: 2.6,
      w: 7.6,
      h: 0.4,
      fontSize: 13,
      fontFace: theme.fontFace,
      color: '64748B',
    });

    // Fidelity assurance notice
    titleSlide.addText('Data-Only Conversion: All values reproduced exactly from the workbook cells without alteration or summarization.', {
      x: 1.2,
      y: 3.4,
      w: 7.6,
      h: 0.4,
      fontSize: 10,
      fontFace: theme.fontFace,
      color: '94A3B8',
      italic: true,
    });
  }

  // 2. Process each Sheet's tables
  for (const sheet of workbook.sheets) {
    if (sheet.isEmpty || sheet.tables.length === 0) {
      // Empty sheet slide
      const emptySlide = pptx.addSlide();
      emptySlide.background = { color: 'FFFFFF' };
      addSlideHeader(emptySlide, sheet.name, 'Empty Worksheet', theme);
      emptySlide.addText('This worksheet contains no tabular data.', {
        x: 0.8,
        y: 2.2,
        w: 8.4,
        h: 0.8,
        fontSize: 14,
        fontFace: theme.fontFace,
        color: '94A3B8',
        align: 'center',
      });
      continue;
    }

    for (const table of sheet.tables) {
      const chunks = chunkTableForSlides(table, sheet.name, maxRowsPerSlide, theme);

      for (const chunk of chunks) {
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };

        // Add Header
        addSlideHeader(slide, chunk.slideTitle, chunk.subtitle, theme);

        // Add Table
        slide.addTable(chunk.pptxTableRows, {
          x: 0.4,
          y: 1.25,
          w: 9.2,
          colW: chunk.colWidths,
          border: { pt: 0.5, color: 'E2E8F0' },
          autoPage: false,
        });

        // Add Footer
        addSlideFooter(slide, theme, includeSlideNumbers);
      }
    }
  }

  // 3. Process Charts (Each chart gets its own dedicated slide)
  for (const chart of charts) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    const chartSubtitle = chart.isNativeSupported
      ? `Native Editable PowerPoint Chart (${chart.type.toUpperCase()}) • Source: Excel Chart`
      : `High-Resolution Image (${chart.fallbackReason || 'Non-native chart type'})`;

    addSlideHeader(slide, chart.title, chartSubtitle, theme);

    if (chart.isNativeSupported && chart.nativeType) {
      // Map to PptxGenJS native chart
      const { chartType, barDir } = mapToPptxChartType(pptx, chart.nativeType);
      const chartData = chart.series.map((s) => ({
        name: s.name,
        labels: s.categories.map(String),
        values: s.values,
      }));

      try {
        slide.addChart(chartType, chartData, {
          x: 0.6,
          y: 1.3,
          w: 8.8,
          h: 3.8,
          showTitle: false,
          showLegend: true,
          legendPos: 'b',
          barDir,
          chartColors: [theme.primaryColor, theme.secondaryColor, '06B6D4', '10B981', 'F59E0B', 'EF4444'],
        });
      } catch (err) {
        // If native addChart fails for any reason, gracefully fall back to image rendering
        if (chart.fallbackImageData) {
          slide.addImage({
            data: chart.fallbackImageData,
            x: 0.8,
            y: 1.3,
            w: 8.4,
            h: 3.8,
          });
        }
      }
    } else if (chart.fallbackImageData) {
      // Render as high resolution vector image
      slide.addImage({
        data: chart.fallbackImageData,
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 3.8,
      });
    }

    addSlideFooter(slide, theme, includeSlideNumbers);
  }

  // 4. Process Embedded Images
  for (const img of images) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    addSlideHeader(slide, `Embedded Image: ${img.name}`, 'Extracted from source workbook media', theme);

    slide.addImage({
      data: img.dataUrl,
      x: 1.5,
      y: 1.3,
      w: 7.0,
      h: 3.8,
      sizing: { type: 'contain', w: 7.0, h: 3.8 },
    });

    addSlideFooter(slide, theme, includeSlideNumbers);
  }

  // Generate buffer in-memory
  const output = await pptx.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}

function mapToPptxChartType(
  pptx: PptxGenJS,
  type: SupportedNativeChartType
): { chartType: any; barDir?: 'col' | 'bar' } {
  switch (type) {
    case 'bar':
      return { chartType: pptx.ChartType.bar, barDir: 'bar' };
    case 'col':
      return { chartType: pptx.ChartType.bar, barDir: 'col' };
    case 'line':
      return { chartType: pptx.ChartType.line };
    case 'pie':
      return { chartType: pptx.ChartType.pie };
    case 'doughnut':
      return { chartType: pptx.ChartType.doughnut };
    case 'scatter':
      return { chartType: pptx.ChartType.scatter };
    case 'area':
      return { chartType: pptx.ChartType.area };
    default:
      return { chartType: pptx.ChartType.bar, barDir: 'col' };
  }
}

function addSlideHeader(slide: any, title: string, subtitle: string, theme: any) {
  // Accent bar on top
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: theme.primaryColor },
    line: { color: theme.primaryColor },
  });

  // Slide Title
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9.0,
    h: 0.45,
    fontSize: 20,
    fontFace: theme.fontFace,
    bold: true,
    color: theme.textColor,
  });

  // Slide Subtitle
  slide.addText(subtitle, {
    x: 0.5,
    y: 0.75,
    w: 9.0,
    h: 0.3,
    fontSize: 10.5,
    fontFace: theme.fontFace,
    color: '64748B',
  });
}

function addSlideFooter(slide: any, theme: any, includeSlideNumbers: boolean) {
  // Footer text
  slide.addText('Exact data from source workbook | No AI summarization', {
    x: 0.5,
    y: 5.25,
    w: 7.0,
    h: 0.25,
    fontSize: 8.5,
    fontFace: theme.fontFace,
    color: '94A3B8',
  });

  if (includeSlideNumbers) {
    slide.addText('Converted with Excel to PPTX', {
      x: 7.5,
      y: 5.25,
      w: 2.0,
      h: 0.25,
      fontSize: 8.5,
      fontFace: theme.fontFace,
      color: '94A3B8',
      align: 'right',
    });
  }
}
