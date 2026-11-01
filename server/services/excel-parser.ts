import * as XLSX from 'xlsx';
import {
  ParsedWorkbook,
  ParsedWorksheet,
  ParsedTable,
  ParsedRow,
  ParsedCell,
  CellType,
} from '../types';

export interface ParseOptions {
  filename?: string;
  selectedSheets?: string[];
}

/**
 * Formats a single cell into a ParsedCell with exact fidelity to the source workbook.
 */
export function parseCell(cell: XLSX.CellObject | undefined): ParsedCell {
  if (!cell || cell.v === undefined || cell.v === null || cell.v === '') {
    return {
      raw: '',
      formatted: '',
      type: 'empty',
      isNumber: false,
      align: 'left',
    };
  }

  const raw = cell.v;
  let formatted = '';
  let type: CellType = 'string';
  let isNumber = false;
  let align: 'left' | 'center' | 'right' = 'left';

  // 1. Determine cell type and initial formatted text
  if (cell.t === 'n') {
    type = 'number';
    isNumber = true;
    align = 'right';

    // SheetJS provides cell.w as the formatted text if formatted, or cell.z as number format
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

  return {
    raw,
    formatted,
    type,
    isNumber,
    numFormat: cell.z !== undefined ? String(cell.z) : undefined,
    align,
  };
}

/**
 * Parses a SheetJS worksheet into clean tabular data structure.
 * Front-loads exact data preservation: no summarization, no hallucination.
 */
export function parseSheetData(sheet: XLSX.WorkSheet, sheetName: string, index: number): ParsedWorksheet {
  const ref = sheet['!ref'];
  if (!ref) {
    return {
      name: sheetName,
      index,
      tables: [],
      charts: [],
      images: [],
      rowCount: 0,
      colCount: 0,
      isEmpty: true,
    };
  }

  const range = XLSX.utils.decode_range(ref);
  const totalRowsInRange = range.e.r - range.s.r + 1;
  const totalColsInRange = range.e.c - range.s.c + 1;

  if (totalRowsInRange <= 0 || totalColsInRange <= 0) {
    return {
      name: sheetName,
      index,
      tables: [],
      charts: [],
      images: [],
      rowCount: 0,
      colCount: 0,
      isEmpty: true,
    };
  }

  // Extract raw rows
  const allRows: ParsedRow[] = [];
  let headerRowIndex = -1;

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: ParsedRow = [];
    let hasContent = false;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellAddress];
      const parsed = parseCell(cell);
      row.push(parsed);

      if (parsed.formatted !== '') {
        hasContent = true;
      }
    }

    if (hasContent) {
      if (headerRowIndex === -1) {
        headerRowIndex = allRows.length;
      }
      allRows.push(row);
    }
  }

  if (allRows.length === 0) {
    return {
      name: sheetName,
      index,
      tables: [],
      charts: [],
      images: [],
      rowCount: 0,
      colCount: 0,
      isEmpty: true,
    };
  }

  // Header extraction: first non-empty row becomes table headers
  const headerRow = allRows[0];
  const headers: string[] = headerRow.map((cell, idx) => {
    const val = cell.formatted.trim();
    return val.length > 0 ? val : `Col ${idx + 1}`;
  });

  // Data rows are all subsequent rows
  const dataRows = allRows.slice(1);

  const table: ParsedTable = {
    headers,
    rows: dataRows,
    range: ref,
    numColumns: headers.length,
    numRows: dataRows.length,
  };

  return {
    name: sheetName,
    index,
    tables: [table],
    charts: [],
    images: [],
    rowCount: dataRows.length,
    colCount: headers.length,
    isEmpty: false,
  };
}

/**
 * Validates and parses an entire workbook buffer.
 */
export function parseWorkbookBuffer(
  buffer: Buffer | ArrayBuffer,
  options: ParseOptions = {}
): ParsedWorkbook {
  if (!buffer || (buffer instanceof Buffer && buffer.length === 0) || (buffer instanceof ArrayBuffer && buffer.byteLength === 0)) {
    throw new Error('The uploaded file is empty (0 bytes). Please upload a valid Excel spreadsheet.');
  }

  // Validate Excel magic bytes
  const bytes = buffer instanceof Buffer ? buffer : new Uint8Array(buffer);
  if (bytes.length < 4) {
    throw new Error('Failed to parse Excel workbook: File is too small or corrupted.');
  }

  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // PK (XLSX, XLSM)
  const isOle2 = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0; // OLE2 (XLS 97-2004)

  if (!isZip && !isOle2) {
    throw new Error('Failed to parse Excel workbook: File is not a valid Excel format (.xlsx or .xls).');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: buffer instanceof Buffer ? 'buffer' : 'array',
      cellDates: true,
      cellNF: true,
      cellStyles: true,
      raw: false, // ensures cell.w is computed
    });
  } catch (err: any) {
    throw new Error(`Failed to parse Excel workbook: ${err?.message || 'Unsupported or corrupted file format'}`);
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded workbook contains no worksheets.');
  }

  const filename = options.filename || 'Workbook.xlsx';
  const selectedSheets = options.selectedSheets;

  const sheets: ParsedWorksheet[] = [];
  let totalRows = 0;

  workbook.SheetNames.forEach((sheetName, index) => {
    // If selectedSheets specified, skip unselected sheets
    if (selectedSheets && selectedSheets.length > 0 && !selectedSheets.includes(sheetName)) {
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
      const parsedSheet = parseSheetData(worksheet, sheetName, index);
      sheets.push(parsedSheet);
      totalRows += parsedSheet.rowCount;
    }
  });

  if (sheets.length === 0) {
    throw new Error('None of the selected worksheets could be parsed.');
  }

  // Extract workbook properties if available
  const props = workbook.Props || {};

  return {
    filename,
    sheets,
    totalRows,
    totalCharts: 0,
    totalImages: 0,
    metadata: {
      title: props.Title || filename.replace(/\.[^/.]+$/, ''),
      author: props.Author || 'Excel Presentation Generator',
      created: props.CreatedDate ? new Date(props.CreatedDate).toLocaleDateString() : new Date().toLocaleDateString(),
    },
  };
}
