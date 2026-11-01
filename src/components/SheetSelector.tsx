'use client';

import React from 'react';
import { Layers, CheckSquare, Square, Eye, AlertCircle } from 'lucide-react';
import { ClientSheet } from '../types';

interface SheetSelectorProps {
  sheets: ClientSheet[];
  selectedSheetNames: string[];
  activePreviewSheet: string;
  onToggleSheet: (name: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSetActivePreviewSheet: (name: string) => void;
}

export function SheetSelector({
  sheets,
  selectedSheetNames,
  activePreviewSheet,
  onToggleSheet,
  onSelectAll,
  onDeselectAll,
  onSetActivePreviewSheet,
}: SheetSelectorProps) {
  const allSelected = sheets.length > 0 && selectedSheetNames.length === sheets.length;

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white text-sm">
            Detected Worksheets ({selectedSheetNames.length}/{sheets.length} Selected)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sheets.map((sheet) => {
          const isSelected = selectedSheetNames.includes(sheet.name);
          const isPreviewing = activePreviewSheet === sheet.name;

          return (
            <div
              key={sheet.name}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-indigo-400/50 bg-indigo-600/20 shadow-md shadow-indigo-600/10'
                  : 'border-white/10 bg-white/5 opacity-70 hover:opacity-90'
              } ${isPreviewing ? 'ring-2 ring-indigo-400' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleSheet(sheet.name)}
                  className="text-indigo-400 hover:text-indigo-300 shrink-0 cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white truncate" title={sheet.name}>
                      {sheet.name}
                    </span>
                    {sheet.isEmpty && (
                      <span className="text-[10px] font-medium text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                        Empty
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {sheet.rowCount} rows • {sheet.colCount} cols
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSetActivePreviewSheet(sheet.name)}
                className={`p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isPreviewing
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Preview this sheet's data"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
