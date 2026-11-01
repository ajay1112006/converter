'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { DropZone } from '../components/DropZone';
import { SheetSelector } from '../components/SheetSelector';
import { TablePreview } from '../components/TablePreview';
import { SlideStoryboard } from '../components/SlideStoryboard';
import { ThemeOptions, THEME_CONFIGS } from '../components/ThemeOptions';
import { ProgressModal } from '../components/ProgressModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { inspectFileClientSide, buildStoryboardSlides } from '../lib/client-parser';
import { generateClientSidePptx } from '../lib/client-pptx';
import { ClientInspectionResult, ClientStoryboardSlide } from '../types';
import { Sparkles, CheckCircle2, Download, FileSpreadsheet, ExternalLink } from 'lucide-react';

interface ReadyDownloadInfo {
  url: string;
  filename: string;
  size: number;
}

export default function Home() {
  const [inspection, setInspection] = useState<ClientInspectionResult | null>(null);
  const [selectedSheetNames, setSelectedSheetNames] = useState<string[]>([]);
  const [activePreviewSheet, setActivePreviewSheet] = useState<string>('');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('indigo');
  const [maxRowsPerSlide, setMaxRowsPerSlide] = useState<number>(10);
  const [includeTitleSlide, setIncludeTitleSlide] = useState<boolean>(true);
  const [includeSlideNumbers, setIncludeSlideNumbers] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<number>(1);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [readyDownload, setReadyDownload] = useState<ReadyDownloadInfo | null>(null);

  // Storyboard slides computed reactively
  const [storyboardSlides, setStoryboardSlides] = useState<ClientStoryboardSlide[]>([]);

  useEffect(() => {
    if (inspection) {
      const slides = buildStoryboardSlides(
        inspection,
        selectedSheetNames,
        maxRowsPerSlide,
        includeTitleSlide
      );
      setStoryboardSlides(slides);
    } else {
      setStoryboardSlides([]);
    }
  }, [inspection, selectedSheetNames, maxRowsPerSlide, includeTitleSlide]);

  const handleFileSelected = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setReadyDownload(null);

    try {
      const result = await inspectFileClientSide(file);
      setInspection(result);
      const allSheetNames = result.sheets.map((s) => s.name);
      setSelectedSheetNames(allSheetNames);
      setActivePreviewSheet(allSheetNames[0] || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to inspect Excel file. Please ensure it is a valid .xlsx or .xls file.');
      setInspection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSheet = (sheetName: string) => {
    setSelectedSheetNames((prev) => {
      if (prev.includes(sheetName)) {
        return prev.filter((n) => n !== sheetName);
      } else {
        return [...prev, sheetName];
      }
    });
  };

  const handleSelectAll = () => {
    if (inspection) {
      setSelectedSheetNames(inspection.sheets.map((s) => s.name));
    }
  };

  const handleDeselectAll = () => {
    setSelectedSheetNames([]);
  };

  const handleReset = () => {
    setInspection(null);
    setSelectedSheetNames([]);
    setActivePreviewSheet('');
    setError(null);
    setReadyDownload(null);
  };

  const handleConvert = async () => {
    if (!inspection || selectedSheetNames.length === 0) return;

    setError(null);
    setIsConverting(true);
    setProgressStep(1);
    setStatusText('Preparing in-memory workbook payload...');

    const baseName = inspection.filename.replace(/\.[^/.]+$/, '');
    const downloadFilename = `${baseName}_Presentation.pptx`;

    try {
      // Step 1: Upload payload
      setProgressStep(1);
      setStatusText('Processing workbook in memory...');

      const formData = new FormData();
      formData.append('file', inspection.rawFile);
      formData.append('themeId', selectedThemeId);
      formData.append('maxRowsPerSlide', String(maxRowsPerSlide));
      formData.append('includeTitleSlide', String(includeTitleSlide));
      formData.append('includeSlideNumbers', String(includeSlideNumbers));
      formData.append('selectedSheets', JSON.stringify(selectedSheetNames));

      // Visual pipeline progress increments
      const t1 = setTimeout(() => {
        setProgressStep(2);
        setStatusText('Extracting sheets & formatting numbers...');
      }, 300);

      const t2 = setTimeout(() => {
        setProgressStep(3);
        setStatusText('Mapping native charts and vector fallbacks...');
      }, 700);

      const t3 = setTimeout(() => {
        setProgressStep(4);
        setStatusText('Splitting tables and building PowerPoint slides...');
      }, 1100);

      let pptxBlob: Blob | null = null;

      // 1. Try Express backend conversion
      try {
        let response = await fetch('/api/backend/convert', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          // Try direct Express server port 5001
          response = await fetch('http://localhost:5001/api/convert', {
            method: 'POST',
            body: formData,
          });
        }

        if (response.ok) {
          pptxBlob = await response.blob();
        }
      } catch (backendErr) {
        console.warn('Backend conversion unavailable, falling back to client-side engine:', backendErr);
      }

      // 2. Client-side fallback if server was unreachable
      if (!pptxBlob) {
        setStatusText('Generating presentation via client-side engine...');
        pptxBlob = await generateClientSidePptx(
          inspection,
          selectedSheetNames,
          selectedThemeId,
          maxRowsPerSlide,
          includeTitleSlide,
          includeSlideNumbers
        );
      }

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setProgressStep(5);
      setStatusText('Presentation ready! Triggering download...');

      // Create persistent Blob URL
      const blobUrl = window.URL.createObjectURL(pptxBlob);
      setReadyDownload({
        url: blobUrl,
        filename: downloadFilename,
        size: pptxBlob.size,
      });

      // Trigger automatic download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();

      // Clean up DOM element safely after browser has started download
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 3000);
    } catch (err: any) {
      console.error('Conversion failed:', err);
      setError(err?.message || 'Failed to generate presentation. Please verify your Excel file.');
    } finally {
      setIsConverting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedTheme = THEME_CONFIGS.find((t) => t.id === selectedThemeId) || THEME_CONFIGS[0];
  const activeSheetObj = inspection?.sheets.find((s) => s.name === activePreviewSheet);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Exact Data Preservation • Native PowerPoint Charts & Tables</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Convert Excel Workbooks into Executive PowerPoint Presentations
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            100% data fidelity: cell values, currencies, percentages, and formulas are reproduced exactly.
            Large tables are cleanly split across readable slides with repeating headers.
          </p>
        </div>

        {/* Error Alert */}
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        {/* Persistent Ready Download Card */}
        {readyDownload && (
          <div className="bg-emerald-50 border-2 border-emerald-400/80 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-emerald-950 text-base">Your Presentation is Ready!</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800">
                    {formatFileSize(readyDownload.size)}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                  File: <code className="bg-emerald-100/70 px-1 py-0.5 rounded font-mono text-emerald-900">{readyDownload.filename}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={readyDownload.url}
                download={readyDownload.filename}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save .PPTX File</span>
              </a>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <DropZone
          onFileSelected={handleFileSelected}
          inspection={inspection}
          isLoading={isLoading}
          onReset={handleReset}
        />

        {/* Inspection Details & Configuration */}
        {inspection && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Sheet Selector */}
            <SheetSelector
              sheets={inspection.sheets}
              selectedSheetNames={selectedSheetNames}
              activePreviewSheet={activePreviewSheet}
              onToggleSheet={handleToggleSheet}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onSetActivePreviewSheet={(name) => setActivePreviewSheet(name)}
            />

            {/* Table Preview */}
            <TablePreview
              sheet={activeSheetObj}
              maxRowsPerSlide={maxRowsPerSlide}
            />

            {/* Storyboard Preview */}
            <SlideStoryboard
              slides={storyboardSlides}
              themeColor={selectedTheme.primary}
            />

            {/* Theme & Options */}
            <ThemeOptions
              selectedThemeId={selectedThemeId}
              onSelectTheme={setSelectedThemeId}
              maxRowsPerSlide={maxRowsPerSlide}
              onChangeMaxRows={setMaxRowsPerSlide}
              includeTitleSlide={includeTitleSlide}
              onToggleTitleSlide={setIncludeTitleSlide}
              includeSlideNumbers={includeSlideNumbers}
              onToggleSlideNumbers={setIncludeSlideNumbers}
              onConvert={handleConvert}
              isConverting={isConverting}
              canConvert={selectedSheetNames.length > 0}
            />
          </div>
        )}
      </main>

      {/* Progress Dialog */}
      <ProgressModal
        isOpen={isConverting}
        step={progressStep}
        statusText={statusText}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 bg-white text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Excel to PowerPoint Presentation Converter — Production Standard</span>
          <span className="text-slate-400">
            In-Memory Processing • No Server Persistence • Client-Side Previews
          </span>
        </div>
      </footer>
    </div>
  );
}
