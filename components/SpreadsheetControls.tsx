'use client';

import React from 'react';
import { useSpreadsheetStore } from '@/store/spreadsheetStore';

export function SpreadsheetControls() {
  const opacity = useSpreadsheetStore((state) => state.opacity);
  const setOpacity = useSpreadsheetStore((state) => state.setOpacity);
  const blurAmount = useSpreadsheetStore((state) => state.blurAmount);
  const setBlurAmount = useSpreadsheetStore((state) => state.setBlurAmount);
  const isMinimized = useSpreadsheetStore((state) => state.isMinimized);
  const toggleMinimize = useSpreadsheetStore((state) => state.toggleMinimize);
  const isMaximized = useSpreadsheetStore((state) => state.isMaximized);
  const toggleMaximize = useSpreadsheetStore((state) => state.toggleMaximize);
  const isOverlayVisible = useSpreadsheetStore((state) => state.isOverlayVisible);
  const toggleOverlay = useSpreadsheetStore((state) => state.toggleOverlay);
  const resetDisplay = useSpreadsheetStore((state) => state.resetDisplay);

  return (
    <div className="flex flex-wrap items-center gap-4 p-2 bg-gray-100 border-b text-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="opacity-slider" className="font-medium text-gray-700">
          Opacity: {Math.round(opacity * 100)}%
        </label>
        <input
          id="opacity-slider"
          aria-label="Opacity"
          type="range"
          min="0"
          max="100"
          value={Math.round(opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          className="cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="blur-slider" className="font-medium text-gray-700">
          Blur: {blurAmount}px
        </label>
        <input
          id="blur-slider"
          aria-label="Blur"
          type="range"
          min="0"
          max="20"
          value={blurAmount}
          onChange={(e) => setBlurAmount(Number(e.target.value))}
          className="cursor-pointer"
        />
      </div>

      <button
        type="button"
        onClick={toggleMinimize}
        className={`px-3 py-1 rounded font-medium border transition-colors ${
          isMinimized
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        Minimize
      </button>

      <button
        type="button"
        onClick={toggleMaximize}
        className={`px-3 py-1 rounded font-medium border transition-colors ${
          isMaximized
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        Maximize
      </button>

      <button
        type="button"
        onClick={toggleOverlay}
        className={`px-3 py-1 rounded font-medium border transition-colors ${
          isOverlayVisible
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        Overlay
      </button>

      <button
        type="button"
        onClick={resetDisplay}
        className="px-3 py-1 rounded font-medium border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

export default SpreadsheetControls;
