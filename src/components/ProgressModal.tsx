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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel-glow rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center text-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Presentation className="w-8 h-8 animate-pulse text-indigo-400" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Converting Workbook</h3>
        <p className="text-xs text-slate-300 mb-6">{statusText || 'Processing workbook data...'}</p>

        {/* Progress steps */}
        <div className="space-y-3 text-left mb-6">
          {STEPS.map((s) => {
            const isDone = step > s.id;
            const isCurrent = step === s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-xs ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : isCurrent
                    ? 'border-indigo-400/50 bg-indigo-600/25 text-white font-semibold shadow-md shadow-indigo-600/20'
                    : 'border-white/10 text-slate-400 bg-white/5'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 shrink-0 flex items-center justify-center text-[10px] text-slate-400">
                    {s.id}
                  </div>
                )}
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 h-2.5 rounded-full transition-all duration-300 shadow-sm shadow-indigo-400/50"
            style={{ width: `${(Math.min(step, 5) / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
