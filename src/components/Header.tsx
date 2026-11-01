'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Presentation, ShieldCheck, Info, X, Cpu, Server, CheckCircle2 } from 'lucide-react';

export function Header() {
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  return (
    <>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">ExcelToPPTX</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Data-Fidelity Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Exact numerical workbook reproduction without AI invention
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchitectureModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4 text-slate-500" />
              <span>Client vs Server Split</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>In-Memory • Zero Logging</span>
            </div>
          </div>
        </div>
      </header>

      {/* Architecture Explanation Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowArchitectureModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Processing Architecture & Run Notes</h3>
                <p className="text-xs text-slate-500">Client-Side vs. Node.js/Express Server Responsibility</p>
              </div>
            </div>

            <div className="space-y-4 my-4 text-sm text-slate-600">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>1. Client-Side (Browser Processing)</span>
                </div>
                <ul className="space-y-1.5 text-xs list-disc list-inside text-slate-600">
                  <li><strong>Instant File Inspection:</strong> Reads the workbook instantly in browser memory via SheetJS.</li>
                  <li><strong>Worksheet Detection:</strong> Detects sheet names, row/col counts, and preview tables before conversion.</li>
                  <li><strong>Interactive Controls:</strong> Enables selecting specific sheets, customizing themes, and setting max rows per slide.</li>
                  <li><strong>Live Storyboard Preview:</strong> Previews the exact slide sequence, pagination splits, and chart mapping in the UI.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>2. Express Backend (In-Memory Layer)</span>
                </div>
                <ul className="space-y-1.5 text-xs list-disc list-inside text-slate-600">
                  <li><strong>OpenXML Deep Parsing:</strong> Inspects ZIP package structure (<code className="bg-slate-200 px-1 rounded">xl/charts/</code>, <code className="bg-slate-200 px-1 rounded">xl/media/</code>).</li>
                  <li><strong>Native PowerPoint Charts:</strong> Generates editable native charts for Bar, Col, Line, Pie, Area, Scatter, and Doughnut.</li>
                  <li><strong>High-Res Fallback Vector Charts:</strong> Generates crisp SVG renderings for unsupported types (Radar, Waterfall, etc.).</li>
                  <li><strong>Zero Persistence:</strong> Uploads processed strictly in RAM; no files are saved or logged to disk.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Data-Only Conversion Guarantee:</strong> Values, decimals, currencies, and percentages are reproduced exactly as written in Excel without summarization or hallucination.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
