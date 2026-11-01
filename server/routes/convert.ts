import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseWorkbookBuffer } from '../services/excel-parser';
import { extractChartsAndMediaFromBuffer } from '../services/chart-extractor';
import { generatePresentationBuffer } from '../services/pptx-generator';
import { ConversionOptions } from '../types';

export const convertRouter = Router();

// Configure Multer for in-memory storage (Zero disk persistence)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum
  },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) files are supported.'));
    }
  },
});

/**
 * POST /api/inspect
 * Deeply inspects an Excel workbook in memory and returns detected sheets,
 * charts (native vs fallback), tables, and media info.
 */
convertRouter.post(
  '/inspect',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ error: 'No file uploaded or file buffer is empty.' });
        return;
      }

      const filename = req.file.originalname || 'Workbook.xlsx';
      const workbook = parseWorkbookBuffer(req.file.buffer, { filename });
      const { charts, images } = await extractChartsAndMediaFromBuffer(req.file.buffer);

      // Map sheets summary
      const sheetsSummary = workbook.sheets.map((s) => ({
        name: s.name,
        index: s.index,
        rowCount: s.rowCount,
        colCount: s.colCount,
        isEmpty: s.isEmpty,
        headers: s.tables[0]?.headers || [],
        previewRows: (s.tables[0]?.rows || []).slice(0, 5).map((row) =>
          row.map((c) => c.formatted)
        ),
      }));

      // Charts summary
      const chartsSummary = charts.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        isNativeSupported: c.isNativeSupported,
        fallbackReason: c.fallbackReason,
        seriesCount: c.series.length,
      }));

      res.json({
        filename: workbook.filename,
        metadata: workbook.metadata,
        totalRows: workbook.totalRows,
        sheets: sheetsSummary,
        charts: chartsSummary,
        imageCount: images.length,
      });
    } catch (err: any) {
      console.error('Inspection error:', err);
      res.status(400).json({
        error: err.message || 'Failed to inspect Excel workbook.',
      });
    }
  }
);

/**
 * POST /api/convert
 * Converts an uploaded Excel file to a PowerPoint (.pptx) presentation.
 * Front-loads exact data reproduction constraint with zero persistence.
 */
convertRouter.post(
  '/convert',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ error: 'No file uploaded or file buffer is empty.' });
        return;
      }

      const filename = req.file.originalname || 'Workbook.xlsx';

      // Parse options from body
      let selectedSheets: string[] | undefined;
      if (req.body.selectedSheets) {
        try {
          selectedSheets = typeof req.body.selectedSheets === 'string'
            ? JSON.parse(req.body.selectedSheets)
            : req.body.selectedSheets;
        } catch {
          selectedSheets = undefined;
        }
      }

      const maxRowsPerSlide = req.body.maxRowsPerSlide
        ? parseInt(String(req.body.maxRowsPerSlide), 10)
        : 10;
      const themeId = req.body.themeId || 'indigo';
      const includeTitleSlide = req.body.includeTitleSlide !== 'false';
      const includeSlideNumbers = req.body.includeSlideNumbers !== 'false';

      const options: ConversionOptions = {
        maxRowsPerSlide: isNaN(maxRowsPerSlide) || maxRowsPerSlide < 3 ? 10 : maxRowsPerSlide,
        themeId,
        includeTitleSlide,
        includeSlideNumbers,
        selectedSheets,
      };

      // 1. Parse Excel data
      const workbook = parseWorkbookBuffer(req.file.buffer, {
        filename,
        selectedSheets,
      });

      // 2. Extract charts & embedded media from OpenXML package
      const { charts, images } = await extractChartsAndMediaFromBuffer(req.file.buffer);

      // 3. Generate presentation
      const pptxBuffer = await generatePresentationBuffer(workbook, charts, images, options);

      // 4. Return as downloadable PPTX file
      const baseName = filename.replace(/\.[^/.]+$/, '');
      const downloadFilename = `${baseName}_Presentation.pptx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Length', pptxBuffer.length);

      res.send(pptxBuffer);
    } catch (err: any) {
      console.error('Conversion error:', err);
      res.status(400).json({
        error: err.message || 'Failed to convert Excel workbook to PowerPoint.',
      });
    }
  }
);
