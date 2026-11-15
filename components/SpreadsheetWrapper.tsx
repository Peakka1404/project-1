'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LocaleType, Tools, Univer, UniverInstanceType } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import DesignEnUS from '@univerjs/design/locale/en-US';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import DocsUIEnUS from '@univerjs/docs-ui/locale/en-US';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import SheetsEnUS from '@univerjs/sheets/locale/en-US';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import SheetsUIEnUS from '@univerjs/sheets-ui/locale/en-US';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import SheetsFormulaEnUS from '@univerjs/sheets-formula/locale/en-US';
import { UniverUIPlugin } from '@univerjs/ui';
import UIEnUS from '@univerjs/ui/locale/en-US';
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
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: Tools.deepMerge(
            DesignEnUS,
            UIEnUS,
            DocsUIEnUS,
            SheetsEnUS,
            SheetsUIEnUS,
            SheetsFormulaEnUS
          ),
        },
      });

      univer.registerPlugin(UniverRenderEnginePlugin);
      univer.registerPlugin(UniverFormulaEnginePlugin);
      univer.registerPlugin(UniverUIPlugin, {
        container: containerRef.current,
      });
      univer.registerPlugin(UniverDocsPlugin);
      univer.registerPlugin(UniverDocsUIPlugin);
      univer.registerPlugin(UniverSheetsPlugin);
      univer.registerPlugin(UniverSheetsUIPlugin);
      univer.registerPlugin(UniverSheetsFormulaPlugin);

      univer.createUnit(UniverInstanceType.UNIVER_SHEET, {});
    } catch (err) {
      console.error('Failed to initialize Univer:', err);
      setError('Spreadsheet failed to load');
    }

    return () => {
      setTimeout(() => {
        try {
          univer?.dispose();
        } catch (disposeErr) {
          console.error('Failed to dispose Univer:', disposeErr);
        }
      }, 0);
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
