'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Univer, UniverInstanceType } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverUIPlugin } from '@univerjs/ui';
import { useSpreadsheetStore } from '@/store/spreadsheetStore';

export function SpreadsheetWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Read state from Zustand store per C2 contract
  useSpreadsheetStore();

  useEffect(() => {
    let univer: Univer | null = null;

    try {
      if (!containerRef.current) {
        throw new Error('Container reference is null');
      }

      univer = new Univer({
        theme: defaultTheme,
      });

      univer.registerPlugin(UniverRenderEnginePlugin);
      univer.registerPlugin(UniverFormulaEnginePlugin);
      univer.registerPlugin(UniverUIPlugin, {
        container: containerRef.current,
      });
      univer.registerPlugin(UniverSheetsPlugin);
      univer.registerPlugin(UniverSheetsUIPlugin);
      univer.registerPlugin(UniverSheetsFormulaPlugin);

      univer.createUnit(UniverInstanceType.UNIVER_SHEET, {});
    } catch (err) {
      console.error('Failed to initialize Univer:', err);
      setError('Spreadsheet failed to load');
    }

    return () => {
      try {
        univer?.dispose();
      } catch (disposeErr) {
        console.error('Failed to dispose Univer:', disposeErr);
      }
    };
  }, []);

  if (error) {
    return (
      <div className="error text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default SpreadsheetWrapper;
