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
import { Interactive3DBackground } from '../components/Interactive3DBackground';
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
    <div className="min-h-screen flex flex-col font-sans relative text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* 3D Interactive WebGL Background */}
      <Interactive3DBackground />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-xl shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Exact Data Preservation • Native PowerPoint Charts & Tables</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-indigo-200 tracking-tight leading-tight drop-shadow-md">
            Convert Excel Workbooks into Executive PowerPoint Presentations
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            100% numerical fidelity: cell values, currencies, percentages, and formulas are reproduced exactly.
            Hover, click, and interact with the 3D data space while configuring your presentation.
          </p>
        </div>

        {/* Error Alert */}
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        {/* Persistent Ready Download Card */}
        {readyDownload && (
          <div className="glass-panel-glow border-2 border-emerald-400/50 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-in fade-in">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-white text-lg">Your Presentation is Ready!</h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {formatFileSize(readyDownload.size)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium">
                  File: <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-emerald-300 border border-white/10">{readyDownload.filename}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={readyDownload.url}
                download={readyDownload.filename}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
          <div className="space-y-8 animate-in fade-in duration-300">
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
      <footer className="border-t border-white/10 py-8 bg-slate-950/80 backdrop-blur-xl text-center text-xs text-slate-400 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-medium text-slate-300">Excel to PowerPoint Presentation Converter — Production Standard</span>
          <span className="text-slate-500">
            In-Memory Processing • No Server Persistence • Real-Time 3D Interactive Canvas
          </span>
        </div>
      </footer>
    </div>
  );
}
