'use client';

import React from 'react';
import { Palette, Sliders, Download, Check, Sparkles, FileDown } from 'lucide-react';
import { ThemeConfig } from '../types';

export const THEME_CONFIGS: ThemeConfig[] = [
  { id: 'indigo', name: 'Modern Indigo', primary: '#4F46E5', bgLight: '#EEF2FF', accent: '#6366F1' },
  { id: 'slate', name: 'Executive Slate', primary: '#1E293B', bgLight: '#F1F5F9', accent: '#334155' },
  { id: 'emerald', name: 'Emerald Growth', primary: '#059669', bgLight: '#ECFDF5', accent: '#047857' },
  { id: 'navy', name: 'Royal Navy', primary: '#1E3A8A', bgLight: '#EFF6FF', accent: '#1D4ED8' },
  { id: 'crimson', name: 'Vibrant Crimson', primary: '#E11D48', bgLight: '#FFF1F2', accent: '#BE123C' },
];

const ROW_SPLIT_OPTIONS = [6, 8, 10, 12, 15, 20];

interface ThemeOptionsProps {
  selectedThemeId: string;
  onSelectTheme: (id: string) => void;
  maxRowsPerSlide: number;
  onChangeMaxRows: (rows: number) => void;
  includeTitleSlide: boolean;
  onToggleTitleSlide: (val: boolean) => void;
  includeSlideNumbers: boolean;
  onToggleSlideNumbers: (val: boolean) => void;
  onConvert: () => void;
  isConverting: boolean;
  canConvert: boolean;
}

export function ThemeOptions({
  selectedThemeId,
  onSelectTheme,
  maxRowsPerSlide,
  onChangeMaxRows,
  includeTitleSlide,
  onToggleTitleSlide,
  includeSlideNumbers,
  onToggleSlideNumbers,
  onConvert,
  isConverting,
  canConvert,
}: ThemeOptionsProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-6 text-slate-200">
      {/* 1. Theme Color Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Palette className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-white text-sm">Presentation Theme & Accent</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {THEME_CONFIGS.map((th) => {
            const isSelected = selectedThemeId === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => onSelectTheme(th.id)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-600/30 ring-2 ring-indigo-400/40 shadow-lg shadow-indigo-600/20'
                    : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: th.primary }}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-white truncate">{th.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Slide Splitting / Pagination Controls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Table Pagination (Max Rows Per Slide)</h4>
          </div>
          <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-xl border border-indigo-400/30">
            {maxRowsPerSlide} rows / slide
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-3.5">
          Prevents unreadable shrunk text on slides. Headers are cleanly repeated on every continuation slide.
        </p>

        <div className="flex flex-wrap gap-2">
          {ROW_SPLIT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onChangeMaxRows(count)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                maxRowsPerSlide === count
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40 scale-105'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {count} Rows
            </button>
          ))}
        </div>
      </div>

      {/* 3. Toggles */}
      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeTitleSlide}
            onChange={(e) => onToggleTitleSlide(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/20 bg-slate-900"
          />
          <span>Include Title Slide (Workbook Name & Date)</span>
        </label>

        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeSlideNumbers}
            onChange={(e) => onToggleSlideNumbers(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/20 bg-slate-900"
          />
          <span>Include Slide Footers & Attribution</span>
        </label>
      </div>

      {/* 4. Action Button */}
      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onConvert}
          disabled={!canConvert || isConverting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
        >
          {isConverting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Presentation in Memory...</span>
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5" />
              <span>Generate & Download PowerPoint (.pptx)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
