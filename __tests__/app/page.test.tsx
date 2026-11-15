import test, { describe } from 'node:test';
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

import HomePage from '../../app/page.tsx';

describe('HomePage Integration (app/page.tsx)', () => {
  const pagePath = path.resolve(process.cwd(), 'app/page.tsx');

  test('AC4: composes ShellLayout with sidebar placeholder and main container', () => {
    const html = renderToStaticMarkup(<HomePage />);

    assert.ok(html.includes('data-panel-group-direction="horizontal"'), 'Must render ShellLayout horizontal PanelGroup');
    assert.ok(html.includes('Lesson Outline'), 'Must render sidebar heading');
    assert.ok(html.includes('Lesson sidebar placeholder'), 'Must render sidebar placeholder text');
    assert.ok(html.includes('Opacity: 100%'), 'Must render SpreadsheetControls in main area');
    assert.ok(html.includes('relative flex-1 overflow-hidden'), 'Must render relative container for spreadsheet + overlay');
  });

  test('AC5: dynamically loads SpreadsheetWrapper with { ssr: false }', () => {
    const content = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must have "use client" directive'
    );
    assert.ok(content.includes("import dynamic from 'next/dynamic'"), 'Must import next/dynamic');
    assert.ok(
      content.includes("import('@/components/SpreadsheetWrapper')") && content.includes('ssr: false'),
      'Must dynamically import SpreadsheetWrapper with { ssr: false }'
    );
  });

  test('AC6: co-locates SpreadsheetContainer and OverlayLayer inside relative container', () => {
    const content = fs.readFileSync(pagePath, 'utf-8');
    const relBlockStart = content.indexOf('relative flex-1 overflow-hidden');
    assert.ok(relBlockStart !== -1, 'Must have relative flex-1 overflow-hidden container');
    const relBlock = content.slice(relBlockStart);
    assert.ok(relBlock.includes('<SpreadsheetContainer>'), 'Must contain SpreadsheetContainer');
    assert.ok(relBlock.includes('<SpreadsheetWrapper />'), 'Must nest SpreadsheetWrapper inside SpreadsheetContainer');
    assert.ok(relBlock.includes('<OverlayLayer />'), 'Must co-locate OverlayLayer inside relative container');
  });
});
