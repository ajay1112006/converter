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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Presentation Storyboard ({slides.length} Slides)
            </h4>
            <p className="text-xs text-slate-500">
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
              className="group relative rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white p-3.5 flex flex-col justify-between transition-all duration-150 hover:shadow-md"
            >
              {/* Slide Number Header */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  Slide {slide.slideNumber}
                </span>

                {slide.type === 'title' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Title Slide
                  </span>
                )}

                {slide.type === 'table' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <Table className="w-3 h-3 text-slate-500" />
                    {slide.rowRange}
                  </span>
                )}

                {slide.type === 'chart' && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      slide.previewData?.isNativeSupported
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <BarChart3 className="w-3 h-3" />
                    {slide.previewData?.isNativeSupported ? 'Native Chart' : 'High-Res Image'}
                  </span>
                )}

                {slide.type === 'image' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-blue-500" />
                    Embedded Media
                  </span>
                )}
              </div>

              {/* Slide Miniature Body Preview */}
              <div className="aspect-16/10 rounded-lg bg-white border border-slate-200 p-2.5 flex flex-col justify-between shadow-2xs group-hover:border-slate-300">
                <div>
                  <div
                    className="h-1 w-8 rounded-full mb-1.5"
                    style={{ backgroundColor: themeColor }}
                  />
                  <h5 className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-2">
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
                    <div className="h-2 bg-slate-200 rounded w-full" />
                    <div className="h-1.5 bg-slate-100 rounded w-5/6" />
                    <div className="h-1.5 bg-slate-100 rounded w-4/6" />
                    <div className="h-1.5 bg-slate-100 rounded w-full" />
                  </div>
                )}

                {slide.type === 'chart' && (
                  <div className="flex items-end justify-center gap-1 h-10 py-1">
                    <div className="w-2.5 bg-indigo-300 rounded-t h-4" />
                    <div className="w-2.5 bg-indigo-500 rounded-t h-7" />
                    <div className="w-2.5 bg-indigo-400 rounded-t h-5" />
                    <div className="w-2.5 bg-indigo-600 rounded-t h-9" />
                  </div>
                )}

                {slide.type === 'image' && (
                  <div className="flex items-center justify-center h-10 text-slate-300">
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
                <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
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
