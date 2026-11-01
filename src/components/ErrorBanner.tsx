'use client';

import React from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="bg-rose-950/60 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-4 sm:p-5 flex items-start justify-between gap-3 shadow-2xl animate-in fade-in duration-150 text-rose-200">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">Processing Error</h4>
          <p className="text-xs text-rose-300 mt-0.5 leading-relaxed">{error}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
