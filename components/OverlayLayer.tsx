'use client';

import React from 'react';
import { useSpreadsheetStore } from '@/store/spreadsheetStore';

export interface OverlayLayerProps {
  children?: React.ReactNode;
}

export function OverlayLayer({ children }: OverlayLayerProps) {
  const isOverlayVisible = useSpreadsheetStore((state) => state.isOverlayVisible);
  const toggleOverlay = useSpreadsheetStore((state) => state.toggleOverlay);

  if (!isOverlayVisible) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center"
      onClick={toggleOverlay}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children ?? (
          <p className="text-white text-lg font-medium">
            Overlay Active — Lesson content will appear here
          </p>
        )}
      </div>
    </div>
  );
}

export default OverlayLayer;
