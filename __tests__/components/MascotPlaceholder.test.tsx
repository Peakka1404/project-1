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

import {
  MascotPlaceholder,
  getMascotBorderRadius,
} from '../../components/MascotPlaceholder.tsx';
import {
  DEFAULT_MASCOT_PROPERTIES,
  type MascotVisualProperties,
} from '../../store/mascotStore.ts';

describe('MascotPlaceholder Component (Contract C9.1)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/MascotPlaceholder.tsx');

  test('AC1 & Contract C9.1: has "use client" directive and exports required symbols', () => {
    assert.ok(fs.existsSync(componentPath), 'components/MascotPlaceholder.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must contain "use client" directive at top of file'
    );
    assert.ok(content.includes('export interface MascotPlaceholderProps'), 'Must export MascotPlaceholderProps');
    assert.ok(content.includes('export const getMascotBorderRadius'), 'Must export getMascotBorderRadius helper');
    assert.ok(content.includes('export function MascotPlaceholder'), 'Must export MascotPlaceholder component');
  });

  test('AC1 & Contract C9.1: getMascotBorderRadius maps shapes to exact border radius values', () => {
    assert.equal(getMascotBorderRadius('square'), '0px', 'square must map to 0px');
    assert.equal(getMascotBorderRadius('rounded'), '16px', 'rounded must map to 16px');
    assert.equal(getMascotBorderRadius('circle'), '50%', 'circle must map to 50%');
    assert.equal(getMascotBorderRadius('pill'), '9999px', 'pill must map to 9999px');
    // Fallback for unknown shape
    assert.equal(getMascotBorderRadius('unknown' as any), '16px', 'fallback must be 16px');
  });

  test('AC1 & Contract C9.1: renders container with dimensions, background color, border, and glow shadow', () => {
    const visualProps: MascotVisualProperties = {
      ...DEFAULT_MASCOT_PROPERTIES,
      shape: 'rounded',
      size: 96,
      color: '#3b82f6',
      borderColor: '#1d4ed8',
      borderWidth: 3,
      lighting: {
        glowColor: 'rgba(59, 130, 246, 0.7)',
        glowBlur: 14,
        glowSpread: 4,
      },
      opacity: 0.95,
      blur: 2,
      isVisible: true,
    };

    const html = renderToStaticMarkup(<MascotPlaceholder visualProps={visualProps} />);

    assert.ok(html.includes('role="img"'), 'Must have role="img"');
    assert.ok(html.includes('aria-label="Mascot Placeholder"'), 'Must have aria-label');
    assert.ok(html.includes('data-testid="mascot-placeholder"'), 'Must have data-testid');

    // Inline style assertions
    assert.ok(html.includes('width:96px'), 'Must apply width matching size');
    assert.ok(html.includes('height:96px'), 'Must apply height matching size');
    assert.ok(html.includes('border-radius:16px'), 'Must apply border-radius for rounded shape');
    assert.ok(html.includes('background-color:#3b82f6'), 'Must apply background-color');
    assert.ok(html.includes('border:3px solid #1d4ed8'), 'Must apply border styling');
    assert.ok(html.includes('box-shadow:0 0 14px 4px rgba(59, 130, 246, 0.7)'), 'Must apply glow box shadow');
    assert.ok(html.includes('opacity:0.95'), 'Must apply opacity');
    assert.ok(html.includes('filter:blur(2px)'), 'Must apply blur filter');
    assert.ok(html.includes('pointer-events:auto'), 'Must set pointer-events: auto');
  });

  test('AC1: renders container for each shape correctly (square, circle, pill)', () => {
    // Square
    const squareHtml = renderToStaticMarkup(
      <MascotPlaceholder visualProps={{ ...DEFAULT_MASCOT_PROPERTIES, shape: 'square' }} />
    );
    assert.ok(squareHtml.includes('border-radius:0px'), 'Square shape must render with border-radius: 0px');

    // Circle
    const circleHtml = renderToStaticMarkup(
      <MascotPlaceholder visualProps={{ ...DEFAULT_MASCOT_PROPERTIES, shape: 'circle' }} />
    );
    assert.ok(circleHtml.includes('border-radius:50%'), 'Circle shape must render with border-radius: 50%');

    // Pill
    const pillHtml = renderToStaticMarkup(
      <MascotPlaceholder visualProps={{ ...DEFAULT_MASCOT_PROPERTIES, shape: 'pill' }} />
    );
    assert.ok(pillHtml.includes('border-radius:9999px'), 'Pill shape must render with border-radius: 9999px');
  });

  test('AC1: renders embedded SVG placeholder icon centered inside container', () => {
    const visualProps: MascotVisualProperties = {
      ...DEFAULT_MASCOT_PROPERTIES,
      size: 100,
    };
    const html = renderToStaticMarkup(<MascotPlaceholder visualProps={visualProps} />);

    // Expected icon size: Math.max(16, Math.round(100 * 0.45)) = 45
    assert.ok(html.includes('width="45"'), 'SVG badge must have calculated width');
    assert.ok(html.includes('height="45"'), 'SVG badge must have calculated height');
    assert.ok(html.includes('data-testid="mascot-badge-icon"'), 'Must have badge icon testid');
    assert.ok(html.includes('<svg'), 'Must render SVG element');
    assert.ok(html.includes('viewBox="0 0 24 24"'), 'SVG must have 24x24 viewBox');
    assert.ok(html.includes('<rect'), 'SVG must contain rect for grid badge');
    assert.ok(html.includes('<line'), 'SVG must contain grid lines');
  });

  test('AC1: icon size respects Math.max(16, ...) clamp on very small mascot sizes', () => {
    const visualProps: MascotVisualProperties = {
      ...DEFAULT_MASCOT_PROPERTIES,
      size: 32, // 32 * 0.45 = 14.4 -> clamped to 16
    };
    const html = renderToStaticMarkup(<MascotPlaceholder visualProps={visualProps} />);
    assert.ok(html.includes('width="16"'), 'SVG badge width must clamp to minimum 16');
    assert.ok(html.includes('height="16"'), 'SVG badge height must clamp to minimum 16');
  });

  test('AC2 & Contract C9.1: returns null when visualProps.isVisible is false', () => {
    const hiddenProps: MascotVisualProperties = {
      ...DEFAULT_MASCOT_PROPERTIES,
      isVisible: false,
    };

    const rendered = MascotPlaceholder({ visualProps: hiddenProps });
    assert.equal(rendered, null, 'Component must return null when isVisible is false');

    const html = renderToStaticMarkup(<MascotPlaceholder visualProps={hiddenProps} />);
    assert.equal(html, '', 'Static markup must be empty string when isVisible is false');
  });

  test('AC1: handles onClick prop and toggles cursor styling', () => {
    let clicked = false;
    const onClick = () => {
      clicked = true;
    };

    // With onClick: cursor pointer
    const withClickHtml = renderToStaticMarkup(
      <MascotPlaceholder visualProps={DEFAULT_MASCOT_PROPERTIES} onClick={onClick} />
    );
    assert.ok(withClickHtml.includes('cursor:pointer'), 'Cursor must be pointer when onClick provided');

    // Without onClick: cursor default
    const withoutClickHtml = renderToStaticMarkup(
      <MascotPlaceholder visualProps={DEFAULT_MASCOT_PROPERTIES} />
    );
    assert.ok(withoutClickHtml.includes('cursor:default'), 'Cursor must be default when onClick omitted');

    // Element invocation verification
    const element = MascotPlaceholder({ visualProps: DEFAULT_MASCOT_PROPERTIES, onClick });
    assert.ok(element !== null);
    assert.equal(typeof element?.props.onClick, 'function');
    element?.props.onClick();
    assert.equal(clicked, true, 'onClick handler must be invoked');
  });

  test('Boundary Values: handles boundary limits (min size 32, max size 256, opacity 0, blur 20)', () => {
    const minProps: MascotVisualProperties = {
      ...DEFAULT_MASCOT_PROPERTIES,
      size: 32,
      borderWidth: 0,
      opacity: 0,
      blur: 20,
    };
    const minHtml = renderToStaticMarkup(<MascotPlaceholder visualProps={minProps} />);
    assert.ok(minHtml.includes('width:32px'));
    assert.ok(minHtml.includes('height:32px'));
    assert.ok(minHtml.includes('border:0px solid #1d4ed8'));
    assert.ok(minHtml.includes('opacity:0'));
    assert.ok(minHtml.includes('filter:blur(20px)'));

    const maxProps: MascotVisualProperties = {
      ...DEFAULT_MASCOT_PROPERTIES,
      size: 256,
      borderWidth: 12,
      opacity: 1,
      blur: 0,
    };
    const maxHtml = renderToStaticMarkup(<MascotPlaceholder visualProps={maxProps} />);
    assert.ok(maxHtml.includes('width:256px'));
    assert.ok(maxHtml.includes('height:256px'));
    assert.ok(maxHtml.includes('border:12px solid #1d4ed8'));
    assert.ok(maxHtml.includes('opacity:1'));
    assert.ok(maxHtml.includes('filter:blur(0px)'));
  });
});
