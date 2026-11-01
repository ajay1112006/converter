export interface ClientCell {
  raw: any;
  formatted: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'empty' | 'error';
  isNumber: boolean;
  align: 'left' | 'center' | 'right';
}

export type ClientRow = ClientCell[];

export interface ClientSheet {
  name: string;
  index: number;
  rowCount: number;
  colCount: number;
  headers: string[];
  rows: ClientRow[];
  isEmpty: boolean;
  selected: boolean;
}

export interface ClientChartInfo {
  id: string;
  title: string;
  type: string;
  isNativeSupported: boolean;
  fallbackReason?: string;
  sheetName?: string;
}

export interface ClientStoryboardSlide {
  id: string;
  slideNumber: number;
  type: 'title' | 'table' | 'chart' | 'image' | 'empty';
  title: string;
  subtitle: string;
  sheetName?: string;
  rowCount?: number;
  rowRange?: string;
  previewData?: any;
}

export interface ClientInspectionResult {
  filename: string;
  fileSize: number;
  totalRows: number;
  sheets: ClientSheet[];
  charts: ClientChartInfo[];
  imageCount: number;
  createdDate?: string;
  rawFile: File;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  bgLight: string;
  accent: string;
}
