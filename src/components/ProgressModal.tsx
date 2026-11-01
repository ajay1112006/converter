'use client';

import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Presentation } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  step: number; // 1 to 5
  statusText: string;
}

const STEPS = [
  { id: 1, label: 'Reading Workbook in Memory' },
  { id: 2, label: 'Parsing Sheets & Preserving Numbers' },
  { id: 3, label: 'Extracting Charts & Embedded Media' },
  { id: 4, label: 'Splitting Tables & Formatting Slides' },
  { id: 5, label: 'Generating PowerPoint (.pptx) Presentation' },
];

export function ProgressModal({ isOpen, step, statusText }: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Presentation className="w-7 h-7 animate-pulse" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">Converting Workbook</h3>
        <p className="text-xs text-slate-500 mb-6">{statusText || 'Processing workbook data...'}</p>

        {/* Progress steps */}
        <div className="space-y-3 text-left mb-6">
          {STEPS.map((s) => {
            const isDone = step > s.id;
            const isCurrent = step === s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-xs ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                    : isCurrent
                    ? 'border-indigo-200 bg-indigo-50/60 text-indigo-900 font-semibold'
                    : 'border-slate-100 text-slate-400 bg-slate-50/30'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[10px] text-slate-400">
                    {s.id}
                  </div>
                )}
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(Math.min(step, 5) / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
