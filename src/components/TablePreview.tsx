'use client';

import React, { useState } from 'react';
import { Table, ArrowRight, Split, AlertCircle } from 'lucide-react';
import { ClientSheet } from '../types';

interface TablePreviewProps {
  sheet: ClientSheet | undefined;
  maxRowsPerSlide: number;
}

export function TablePreview({ sheet, maxRowsPerSlide }: TablePreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!sheet) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        No sheet selected for preview.
      </div>
    );
  }

  if (sheet.isEmpty || sheet.rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-900 text-sm">Worksheet is Empty</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Sheet <span className="font-medium text-slate-700">'{sheet.name}'</span> has no data rows.
          An empty placeholder slide will be generated if included.
        </p>
      </div>
    );
  }

  const totalRows = sheet.rows.length;
  const numSlides = Math.ceil(totalRows / maxRowsPerSlide);

  // Pagination for preview
  const pageSize = 8;
  const totalPreviewPages = Math.ceil(totalRows / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRows);
  const displayedRows = sheet.rows.slice(startIdx, endIdx);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Worksheet Data Preview: <span className="text-indigo-600">{sheet.name}</span>
            </h4>
            <p className="text-xs text-slate-500">
              Exact cell values and formatting as parsed from workbook
            </p>
          </div>
        </div>

        {/* Slide Splitting Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 font-medium">
          <Split className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            {numSlides} {numSlides === 1 ? 'Presentation Slide' : `Slides (Max ${maxRowsPerSlide} rows/slide)`}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="py-2.5 px-3 font-semibold text-slate-400 w-12 text-center border-r border-slate-800">
                #
              </th>
              {sheet.headers.map((h, i) => (
                <th
                  key={i}
                  className="py-2.5 px-3 font-semibold tracking-wide border-r border-slate-800 last:border-r-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-mono">
            {displayedRows.map((row, rIdx) => {
              const actualRowIndex = startIdx + rIdx + 1;
              const isEven = rIdx % 2 === 0;

              return (
                <tr
                  key={rIdx}
                  className={`hover:bg-indigo-50/40 transition-colors ${
                    isEven ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  <td className="py-2 px-3 text-slate-400 font-sans text-center border-r border-slate-100">
                    {actualRowIndex}
                  </td>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-2 px-3 text-slate-800 border-r border-slate-100 last:border-r-0 whitespace-nowrap ${
                        cell.align === 'right'
                          ? 'text-right'
                          : cell.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {cell.formatted !== '' ? (
                        cell.formatted
                      ) : (
                        <span className="text-slate-300 italic font-sans">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Controls */}
      <div className="flex items-center justify-between pt-3 mt-1 text-xs text-slate-500">
        <span>
          Showing rows {startIdx + 1}–{endIdx} of {totalRows}
        </span>

        {totalPreviewPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Prev
            </button>
            <span className="px-2 font-medium text-slate-700">
              {currentPage} / {totalPreviewPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPreviewPages))}
              disabled={currentPage === totalPreviewPages}
              className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
