import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Resolve '@/...' alias for Node test execution
const origResolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request.startsWith('@/')) {
    const resolved = path.resolve(process.cwd(), request.slice(2));
    return origResolve.call(this, resolved, parent, isMain, options);
  }
  return origResolve.call(this, request, parent, isMain, options);
};

import { useSpreadsheetStore } from '../../store/spreadsheetStore.ts';
import { SpreadsheetControls } from '../../components/SpreadsheetControls.tsx';

describe('SpreadsheetControls Component (C6 Contract)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/SpreadsheetControls.tsx');

  beforeEach(() => {
    useSpreadsheetStore.getState().resetDisplay();
  });

  test('AC1 & Contract C6: renders opacity slider, blur slider, minimize, maximize, overlay, and reset buttons', () => {
    const html = renderToStaticMarkup(<SpreadsheetControls />);

    assert.ok(html.includes('bg-gray-100 border-b'), 'Toolbar must have bg-gray-100 border-b classes');
    assert.ok(html.includes('Opacity: 100%'), 'Must render Opacity readout at 100%');
    assert.ok(html.includes('type="range"'), 'Must render range sliders');
    assert.ok(html.includes('min="0" max="100"'), 'Opacity slider must have range 0-100');
    assert.ok(html.includes('Blur: 0px'), 'Must render Blur readout at 0px');
    assert.ok(html.includes('min="0" max="20"'), 'Blur slider must have range 0-20');
    assert.ok(html.includes('>Minimize<'), 'Must render Minimize button');
    assert.ok(html.includes('>Maximize<'), 'Must render Maximize button');
    assert.ok(html.includes('>Overlay<'), 'Must render Overlay button');
    assert.ok(html.includes('>Reset<'), 'Must render Reset button');
  });

  test('AC2: visibly highlights active toggle states for Minimize, Maximize, and Overlay', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.includes("isMinimized\n            ? 'bg-blue-600 text-white") || content.includes('isMinimized ?'),
      'Minimize button must highlight when isMinimized is true'
    );
    assert.ok(
      content.includes("isMaximized\n            ? 'bg-blue-600 text-white") || content.includes('isMaximized ?'),
      'Maximize button must highlight when isMaximized is true'
    );
    assert.ok(
      content.includes("isOverlayVisible\n            ? 'bg-blue-600 text-white") || content.includes('isOverlayVisible ?'),
      'Overlay button must highlight when isOverlayVisible is true'
    );
    assert.ok(content.includes('bg-blue-600 text-white'), 'Active state must use highlighted blue styling');
  });

  test('AC3: controls map to corresponding useSpreadsheetStore actions', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must have "use client" directive'
    );
    assert.ok(content.includes('setOpacity(Number(e.target.value) / 100)'), 'Opacity slider must call setOpacity(v / 100)');
    assert.ok(content.includes('setBlurAmount(Number(e.target.value))'), 'Blur slider must call setBlurAmount(v)');
    assert.ok(content.includes('onClick={toggleMinimize}'), 'Minimize button must call toggleMinimize');
    assert.ok(content.includes('onClick={toggleMaximize}'), 'Maximize button must call toggleMaximize');
    assert.ok(content.includes('onClick={toggleOverlay}'), 'Overlay button must call toggleOverlay');
    assert.ok(content.includes('onClick={resetDisplay}'), 'Reset button must call resetDisplay');
  });
});
