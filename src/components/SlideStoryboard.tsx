'use client';

import React from 'react';
import { Presentation, Table, BarChart3, Image as ImageIcon, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { ClientStoryboardSlide } from '../types';

interface SlideStoryboardProps {
  slides: ClientStoryboardSlide[];
  themeColor: string;
}

export function SlideStoryboard({ slides, themeColor }: SlideStoryboardProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl text-slate-200">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              Presentation Storyboard ({slides.length} Slides)
            </h4>
            <p className="text-xs text-slate-400">
              Live preview outline of the slides that will be generated in PowerPoint
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slides.map((slide) => {
          return (
            <div
              key={slide.id}
              className="group relative rounded-2xl border border-white/10 hover:border-indigo-400/60 bg-white/5 hover:bg-white/10 p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02]"
            >
              {/* Slide Number Header */}
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  Slide {slide.slideNumber}
                </span>

                {slide.type === 'title' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Title Slide
                  </span>
                )}

                {slide.type === 'table' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/15 flex items-center gap-1">
                    <Table className="w-3 h-3 text-slate-400" />
                    {slide.rowRange}
                  </span>
                )}

                {slide.type === 'chart' && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      slide.previewData?.isNativeSupported
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    }`}
                  >
                    <BarChart3 className="w-3 h-3" />
                    {slide.previewData?.isNativeSupported ? 'Native Chart' : 'High-Res Image'}
                  </span>
                )}

                {slide.type === 'image' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-blue-400" />
                    Embedded Media
                  </span>
                )}
              </div>

              {/* Slide Miniature Body Preview */}
              <div className="aspect-16/10 rounded-xl bg-slate-900/90 border border-white/15 p-3 flex flex-col justify-between shadow-inner group-hover:border-indigo-400/40">
                <div>
                  <div
                    className="h-1.5 w-9 rounded-full mb-2"
                    style={{ backgroundColor: themeColor }}
                  />
                  <h5 className="font-bold text-white text-[11px] leading-tight line-clamp-2">
                    {slide.title}
                  </h5>
                </div>

                {slide.type === 'title' && (
                  <div className="py-2 text-[10px] text-slate-400 text-center font-medium">
                    Workbook Title & Metadata
                  </div>
                )}

                {slide.type === 'table' && (
                  <div className="space-y-1 my-1">
                    <div className="h-2 bg-indigo-500/40 rounded w-full" />
                    <div className="h-1.5 bg-white/15 rounded w-5/6" />
                    <div className="h-1.5 bg-white/15 rounded w-4/6" />
                    <div className="h-1.5 bg-white/15 rounded w-full" />
                  </div>
                )}

                {slide.type === 'chart' && (
                  <div className="flex items-end justify-center gap-1.5 h-10 py-1">
                    <div className="w-2.5 bg-indigo-400/60 rounded-t h-4" />
                    <div className="w-2.5 bg-indigo-500 rounded-t h-7" />
                    <div className="w-2.5 bg-cyan-400 rounded-t h-5" />
                    <div className="w-2.5 bg-indigo-400 rounded-t h-9" />
                  </div>
                )}

                {slide.type === 'image' && (
                  <div className="flex items-center justify-center h-10 text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                {/* Subtitle / Note */}
                <p className="text-[9px] text-slate-400 truncate mt-1">
                  {slide.subtitle}
                </p>
              </div>

              {/* Footer Note if non-native chart */}
              {slide.type === 'chart' && !slide.previewData?.isNativeSupported && (
                <div className="mt-2 text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-400/20 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Stated in UI: Rendered as high-res vector image fallback.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
