import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShellLayout } from '../../components/ShellLayout.tsx';

describe('ShellLayout Component (C4 Contract)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/ShellLayout.tsx');

  test('AC1 & Contract C4: has "use client" directive and exports ShellLayout', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must have "use client" directive'
    );
    assert.equal(typeof ShellLayout, 'function');
  });

  test('AC1: renders horizontal PanelGroup with h-screen, sidebar, resize handle, and main pane', () => {
    const html = renderToStaticMarkup(
      <ShellLayout
        sidebar={<div data-testid="sidebar">Sidebar Content</div>}
        main={<div data-testid="main">Main Content</div>}
      />
    );

    assert.ok(html.includes('Sidebar Content'), 'Must render sidebar prop');
    assert.ok(html.includes('Main Content'), 'Must render main prop');
    assert.ok(html.includes('h-screen'), 'PanelGroup must have h-screen class');
    assert.ok(html.includes('data-panel-group-direction="horizontal"'), 'PanelGroup must be horizontal');
    assert.ok(html.includes('data-panel-resize-handle-id'), 'Must render PanelResizeHandle');
    assert.ok(html.includes('w-1'), 'ResizeHandle must be 4px (w-1)');
  });

  test('Contract C4: configures left panel (25/15/collapsible) and right panel (75/40) with no store dependency', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('defaultSize={25}'), 'Left panel defaultSize must be 25');
    assert.ok(content.includes('minSize={15}'), 'Left panel minSize must be 15');
    assert.ok(content.includes('collapsible'), 'Left panel must be collapsible');
    assert.ok(content.includes('defaultSize={75}'), 'Right panel defaultSize must be 75');
    assert.ok(content.includes('minSize={40}'), 'Right panel minSize must be 40');
    assert.ok(!content.includes('useSpreadsheetStore'), 'ShellLayout must be purely presentational with no store dependency');
  });
});
