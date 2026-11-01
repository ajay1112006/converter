'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Presentation, ShieldCheck, Info, X, Cpu, Server, CheckCircle2 } from 'lucide-react';

export function Header() {
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  return (
    <>
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">ExcelToPPTX</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/25">
                  Data-Fidelity Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Exact numerical workbook reproduction without AI invention
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchitectureModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-all backdrop-blur-md"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>Client vs Server Split</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 px-2.5 py-1 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>In-Memory • Zero Logging</span>
            </div>
          </div>
        </div>
      </header>

      {/* Architecture Explanation Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel-glow rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowArchitectureModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Processing Architecture & Run Notes</h3>
                <p className="text-xs text-slate-400">Client-Side vs. Node.js/Express Server Responsibility</p>
              </div>
            </div>

            <div className="space-y-4 my-4 text-sm text-slate-300">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 font-semibold text-white mb-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>1. Client-Side (Browser Processing)</span>
                </div>
                <ul className="space-y-1.5 text-xs list-disc list-inside text-slate-300">
                  <li><strong>Instant File Inspection:</strong> Reads the workbook instantly in browser memory via SheetJS.</li>
                  <li><strong>Worksheet Detection:</strong> Detects sheet names, row/col counts, and preview tables before conversion.</li>
                  <li><strong>Interactive Controls:</strong> Enables selecting specific sheets, customizing themes, and setting max rows per slide.</li>
                  <li><strong>Live Storyboard Preview:</strong> Previews the exact slide sequence, pagination splits, and chart mapping in the UI.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 font-semibold text-white mb-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>2. Express Backend (In-Memory Layer)</span>
                </div>
                <ul className="space-y-1.5 text-xs list-disc list-inside text-slate-300">
                  <li><strong>OpenXML Deep Parsing:</strong> Inspects ZIP package structure (<code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300">xl/charts/</code>, <code className="bg-white/10 px-1 py-0.5 rounded text-indigo-300">xl/media/</code>).</li>
                  <li><strong>Native PowerPoint Charts:</strong> Generates editable native charts for Bar, Col, Line, Pie, Area, Scatter, and Doughnut.</li>
                  <li><strong>High-Res Fallback Vector Charts:</strong> Generates crisp SVG renderings for unsupported types (Radar, Waterfall, etc.).</li>
                  <li><strong>Zero Persistence:</strong> Uploads processed strictly in RAM; no files are saved or logged to disk.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Data-Only Conversion Guarantee:</strong> Values, decimals, currencies, and percentages are reproduced exactly as written in Excel without summarization or hallucination.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] cursor-pointer"
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
