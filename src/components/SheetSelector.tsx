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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            Detected Worksheets ({selectedSheetNames.length}/{sheets.length} Selected)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sheets.map((sheet) => {
          const isSelected = selectedSheetNames.includes(sheet.name);
          const isPreviewing = activePreviewSheet === sheet.name;

          return (
            <div
              key={sheet.name}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'border-indigo-200 bg-indigo-50/40'
                  : 'border-slate-200 bg-slate-50/50 opacity-70'
              } ${isPreviewing ? 'ring-2 ring-indigo-500/30' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleSheet(sheet.name)}
                  className="text-indigo-600 hover:text-indigo-800 shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-900 truncate" title={sheet.name}>
                      {sheet.name}
                    </span>
                    {sheet.isEmpty && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Empty
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {sheet.rowCount} rows • {sheet.colCount} cols
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSetActivePreviewSheet(sheet.name)}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isPreviewing
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
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
