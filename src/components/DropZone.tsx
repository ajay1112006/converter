'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import { SAMPLE_OPTIONS, generateSampleWorkbook } from '../lib/sample-generator';
import { ClientInspectionResult } from '../types';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  inspection: ClientInspectionResult | null;
  isLoading: boolean;
  onReset: () => void;
}

export function DropZone({ onFileSelected, inspection, isLoading, onReset }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected(file);
    }
  };

  const handleSampleClick = (sampleId: string) => {
    const file = generateSampleWorkbook(sampleId);
    onFileSelected(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
      />

      {!inspection ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group ${
            isDragOver
              ? 'border-indigo-400 bg-indigo-900/40 scale-[1.01] shadow-2xl shadow-indigo-500/30'
              : 'border-white/20 hover:border-indigo-400/70 glass-panel hover:shadow-2xl hover:shadow-indigo-500/15'
          }`}
        >
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/30 text-indigo-400 border border-indigo-400/30 flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 group-hover:border-indigo-400/60 transition-all duration-300">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
              Drop your Excel workbook here, or <span className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300">browse</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 font-normal">
              Supports Microsoft Excel (.xlsx and .xls) files up to 50MB. Read entirely in-memory.
            </p>

            {/* Quick Sample Dataset Loaders */}
            <div className="w-full pt-5 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Or test instantly with a verified sample workbook:</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {SAMPLE_OPTIONS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSampleClick(sample.id)}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-xl bg-white/10 hover:bg-indigo-600/40 text-slate-200 hover:text-white border border-white/15 hover:border-indigo-400/40 transition-all backdrop-blur-md shadow-sm hover:scale-[1.03] cursor-pointer"
                  >
                    {sample.name} ({sample.sheetCount} sheets)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Loaded File Summary Card */
        <div className="glass-panel-glow rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-400/30">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{inspection.filename}</h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Parsed
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {formatFileSize(inspection.fileSize)} • {inspection.sheets.length} sheets detected • {inspection.totalRows} data rows
                {inspection.charts.length > 0 && ` • ${inspection.charts.length} charts`}
                {inspection.imageCount > 0 && ` • ${inspection.imageCount} media`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Change File
            </button>
            <button
              onClick={onReset}
              className="p-2 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
              title="Reset workbook"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
