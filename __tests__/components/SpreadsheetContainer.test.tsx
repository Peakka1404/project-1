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
import { SpreadsheetContainer } from '../../components/SpreadsheetContainer.tsx';

describe('SpreadsheetContainer Component (C3 Contract)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/SpreadsheetContainer.tsx');

  beforeEach(() => {
    useSpreadsheetStore.getState().resetDisplay();
  });

  test('AC2 & Contract C3: has "use client" directive and renders children with default styles', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must have "use client" directive'
    );

    const html = renderToStaticMarkup(
      <SpreadsheetContainer>
        <div>Spreadsheet Grid</div>
      </SpreadsheetContainer>
    );

    assert.ok(html.includes('Spreadsheet Grid'), 'Must render children when not minimized');
    assert.ok(html.includes('opacity:1'), 'Default opacity must be 1');
    assert.ok(html.includes('filter:blur(0px)'), 'Default blur must be 0px');
    assert.ok(html.includes('height:100%'), 'Default height must be 100%');
    assert.ok(html.includes('overflow:visible'), 'Default overflow must be visible');
    assert.ok(html.includes('pointer-events:auto'), 'Default pointer-events must be auto');
    assert.ok(html.includes('300ms ease'), 'Must apply 300ms ease transition');
  });

  test('AC2: subscribes to opacity, blurAmount, isMinimized, isMaximized, isInteractive and applies dynamic styles', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('state.opacity'), 'Must read opacity from store');
    assert.ok(content.includes('state.blurAmount'), 'Must read blurAmount from store');
    assert.ok(content.includes('state.isMinimized'), 'Must read isMinimized from store');
    assert.ok(content.includes('state.isMaximized'), 'Must read isMaximized from store');
    assert.ok(content.includes('state.isInteractive'), 'Must read isInteractive from store');
    assert.ok(content.includes('blur(${blurAmount}px)'), 'Must apply blur(${blurAmount}px) filter');
    assert.ok(content.includes("isInteractive ? 'auto' : 'none'"), 'Must toggle pointerEvents based on isInteractive');
  });

  test('AC2: maps isMinimized/isMaximized/normal to 48px/100vh/100% height and overflow', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.includes("isMinimized ? '48px' : isMaximized ? '100vh' : '100%'"),
      'Must map height to 48px (minimized), 100vh (maximized), 100% (normal)'
    );
    assert.ok(
      content.includes("isMinimized ? 'hidden' : 'visible'"),
      'Must set overflow hidden when minimized and visible otherwise'
    );

    // Verify store transitions that drive these states
    useSpreadsheetStore.getState().toggleMaximize();
    assert.equal(useSpreadsheetStore.getState().isMaximized, true);
    assert.equal(useSpreadsheetStore.getState().isMinimized, false);

    useSpreadsheetStore.getState().toggleMinimize();
    assert.equal(useSpreadsheetStore.getState().isMinimized, true);
    assert.equal(useSpreadsheetStore.getState().isMaximized, false);
  });

  test('AC3: renders minimized bar with "Spreadsheet (minimized)" and Expand button wired to toggleMinimize', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('Spreadsheet (minimized)'), 'Must include minimized label');
    assert.ok(content.includes('Expand'), 'Must include Expand button');
    assert.ok(content.includes('onClick={toggleMinimize}'), 'Expand button must call toggleMinimize');
    assert.ok(content.includes("pointerEvents: 'auto'"), 'Expand button must remain clickable when container is non-interactive');
  });
});
