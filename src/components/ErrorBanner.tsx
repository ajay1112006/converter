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
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-150">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-rose-100 text-rose-600 shrink-0 mt-0.5">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-rose-900 text-sm">Processing Error</h4>
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{error}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
