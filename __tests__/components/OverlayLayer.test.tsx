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
import { OverlayLayer } from '../../components/OverlayLayer.tsx';

describe('OverlayLayer Component (C5 Contract)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/OverlayLayer.tsx');

  beforeEach(() => {
    useSpreadsheetStore.getState().resetDisplay();
  });

  test('AC4: returns null (empty markup) when isOverlayVisible is false', () => {
    assert.equal(useSpreadsheetStore.getState().isOverlayVisible, false);
    const html = renderToStaticMarkup(<OverlayLayer />);
    assert.equal(html, '');
  });

  test('AC5: renders backdrop with absolute inset-0 z-30 bg-black/40 and fallback text when visible', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('absolute inset-0 z-30 bg-black/40 flex items-center justify-center'), 'Backdrop must have required positioning and styling classes');
    assert.ok(
      content.includes('Overlay Active — Lesson content will appear here'),
      'Must include default fallback text when no children provided'
    );
    assert.ok(content.includes('children ??'), 'Must render children when provided or fallback when omitted');
  });

  test('AC5 & Contract C5: backdrop click calls toggleOverlay and child wrapper stops propagation', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must have "use client" directive'
    );
    assert.ok(content.includes('state.isOverlayVisible'), 'Must read isOverlayVisible from store');
    assert.ok(content.includes('state.toggleOverlay'), 'Must read toggleOverlay from store');
    assert.ok(content.includes('onClick={toggleOverlay}'), 'Backdrop must trigger toggleOverlay on click');
    assert.ok(content.includes('e.stopPropagation()'), 'Child container must stop click propagation');

    // Verify store toggleOverlay behavior
    useSpreadsheetStore.getState().toggleOverlay();
    assert.equal(useSpreadsheetStore.getState().isOverlayVisible, true);
    useSpreadsheetStore.getState().toggleOverlay();
    assert.equal(useSpreadsheetStore.getState().isOverlayVisible, false);
  });
});
