import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('SpreadsheetWrapper Component (C2 Contract & Lifecycle)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/SpreadsheetWrapper.tsx');

  test('AC6 & Contract: file exists and has "use client" directive', () => {
    assert.ok(fs.existsSync(componentPath), 'components/SpreadsheetWrapper.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.startsWith("'use client'") || content.startsWith('"use client"'), 'Must have "use client" directive for SSR safety');
  });

  test('AC6 & Contract: registers all required Univer plugins and creates workbook', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('UniverRenderEnginePlugin'), 'Must register UniverRenderEnginePlugin');
    assert.ok(content.includes('UniverFormulaEnginePlugin'), 'Must register UniverFormulaEnginePlugin');
    assert.ok(content.includes('UniverUIPlugin'), 'Must register UniverUIPlugin');
    assert.ok(content.includes('UniverSheetsPlugin'), 'Must register UniverSheetsPlugin');
    assert.ok(content.includes('UniverSheetsUIPlugin'), 'Must register UniverSheetsUIPlugin');
    assert.ok(content.includes('UniverSheetsFormulaPlugin'), 'Must register UniverSheetsFormulaPlugin');
    assert.ok(content.includes('univer.createUnit(UniverInstanceType.UNIVER_SHEET'), 'Must create default sheet workbook');
  });

  test('AC6 & Contract: implements dispose cleanup in useEffect', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('univer?.dispose()'), 'Must call dispose on unmount');
  });

  test('AC7: implements error boundary fallback text "Spreadsheet failed to load"', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('Spreadsheet failed to load'), 'Must render "Spreadsheet failed to load" when init fails');
    assert.ok(content.includes('try {') && content.includes('} catch'), 'Must wrap initialization in try/catch block');
  });

  test('Contract C2: container div has full width and height styles', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes("width: '100%'"), 'Container must have width: 100%');
    assert.ok(content.includes("height: '100%'"), 'Container must have height: 100%');
  });

  test('Contract C2: connects to Zustand store', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('useSpreadsheetStore'), 'Wrapper must connect to useSpreadsheetStore');
  });
});
