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
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-slate-50/50 shadow-sm'
          }`}
        >
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Drop your Excel workbook here, or <span className="text-indigo-600 underline underline-offset-2">browse</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Supports Microsoft Excel (.xlsx and .xls) files up to 50MB. Read entirely in-memory.
            </p>

            {/* Quick Sample Dataset Loaders */}
            <div className="w-full pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Or test instantly with a verified sample workbook:</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {SAMPLE_OPTIONS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSampleClick(sample.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{inspection.filename}</h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Parsed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatFileSize(inspection.fileSize)} • {inspection.sheets.length} sheets detected • {inspection.totalRows} data rows
                {inspection.charts.length > 0 && ` • ${inspection.charts.length} charts`}
                {inspection.imageCount > 0 && ` • ${inspection.imageCount} media`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Change File
            </button>
            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
