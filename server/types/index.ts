export type CellType = 'string' | 'number' | 'boolean' | 'date' | 'empty' | 'error';

export interface ParsedCell {
  raw: any;
  formatted: string;
  type: CellType;
  isNumber: boolean;
  numFormat?: string;
  align: 'left' | 'center' | 'right';
}

export type ParsedRow = ParsedCell[];

export interface ParsedTable {
  headers: string[];
  rows: ParsedRow[];
  range: string;
  numColumns: number;
  numRows: number;
}

export interface ChartSeries {
  name: string;
  categories: (string | number)[];
  values: number[];
}

export type SupportedNativeChartType = 'bar' | 'col' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'area';
export type UnsupportedChartType = 'radar' | 'waterfall' | 'treemap' | 'sunburst' | 'surface' | 'stock' | 'bubble' | 'combo' | 'unknown';
export type AnyChartType = SupportedNativeChartType | UnsupportedChartType;

export interface ExtractedChart {
  id: string;
  title: string;
  type: AnyChartType;
  isNativeSupported: boolean;
  nativeType?: SupportedNativeChartType;
  series: ChartSeries[];
  fallbackImageData?: string; // base64 SVG or PNG data URL
  fallbackReason?: string;
  sheetName?: string;
}

export interface ExtractedImage {
  id: string;
  sheetName?: string;
  name: string;
  extension: string;
  base64: string;
  dataUrl: string;
  width?: number;
  height?: number;
}

export interface ParsedWorksheet {
  name: string;
  index: number;
  tables: ParsedTable[];
  charts: ExtractedChart[];
  images: ExtractedImage[];
  rowCount: number;
  colCount: number;
  isEmpty: boolean;
}

export interface ParsedWorkbook {
  filename: string;
  sheets: ParsedWorksheet[];
  totalRows: number;
  totalCharts: number;
  totalImages: number;
  metadata: {
    title?: string;
    author?: string;
    created?: string;
  };
}

export interface PresentationTheme {
  id: string;
  name: string;
  primaryColor: string; // hex without #
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  lightBgColor: string;
  headerBgColor: string;
  headerTextColor: string;
  fontFace: string;
}

export interface ConversionOptions {
  maxRowsPerSlide?: number;
  themeId?: string;
  includeTitleSlide?: boolean;
  includeSlideNumbers?: boolean;
  selectedSheets?: string[];
}
