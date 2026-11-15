'use client';

import React from 'react';
import { useSpreadsheetStore } from '@/store/spreadsheetStore';

export interface SpreadsheetContainerProps {
  children: React.ReactNode;
}

export function SpreadsheetContainer({ children }: SpreadsheetContainerProps) {
  const opacity = useSpreadsheetStore((state) => state.opacity);
  const blurAmount = useSpreadsheetStore((state) => state.blurAmount);
  const isMinimized = useSpreadsheetStore((state) => state.isMinimized);
  const isMaximized = useSpreadsheetStore((state) => state.isMaximized);
  const isInteractive = useSpreadsheetStore((state) => state.isInteractive);
  const toggleMinimize = useSpreadsheetStore((state) => state.toggleMinimize);

  const containerStyle: React.CSSProperties = {
    opacity,
    filter: `blur(${blurAmount}px)`,
    transition: 'opacity 300ms ease, filter 300ms ease, height 300ms ease',
    height: isMinimized ? '48px' : isMaximized ? '100vh' : '100%',
    overflow: isMinimized ? 'hidden' : 'visible',
    pointerEvents: isInteractive ? 'auto' : 'none',
  };

  return (
    <div style={containerStyle} className="w-full">
      {isMinimized ? (
        <div className="flex items-center justify-between h-full px-4 bg-gray-100 border-b border-gray-300">
          <span className="text-sm font-medium text-gray-700">Spreadsheet (minimized)</span>
          <button
            type="button"
            onClick={toggleMinimize}
            style={{ pointerEvents: 'auto' }}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none"
          >
            Expand
          </button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default SpreadsheetContainer;
