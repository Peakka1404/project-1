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

// Hook adapters for Zustand useSyncExternalStore in Node test runner
(React as any).useSyncExternalStore = (_subscribe: any, getSnapshot: any) => getSnapshot();
(React as any).useCallback = (fn: any) => fn;
(React as any).useDebugValue = () => {};

import { MascotOverlayLayer } from '../../components/MascotOverlayLayer.tsx';
import { useMascotStore } from '../../store/mascotStore.ts';

describe('MascotOverlayLayer Component (Contract C10)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/MascotOverlayLayer.tsx');

  beforeEach(() => {
    useMascotStore.getState().resetAll();
  });

  test('AC5 & Contract C10: has "use client" directive and exports required component', () => {
    assert.ok(fs.existsSync(componentPath), 'components/MascotOverlayLayer.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must contain "use client" directive at top of file'
    );
    assert.ok(content.includes('export function MascotOverlayLayer'), 'Must export MascotOverlayLayer component');
    assert.ok(content.includes('export default MascotOverlayLayer'), 'Must have default export MascotOverlayLayer');
  });

  test('AC5 & Contract C10: renders outer viewport container with pointer-events-none passthrough classes', () => {
    const html = renderToStaticMarkup(<MascotOverlayLayer />);

    assert.ok(html.includes('data-testid="mascot-overlay-layer"'), 'Must have data-testid="mascot-overlay-layer"');
    assert.ok(
      html.includes('fixed inset-0 z-40 pointer-events-none overflow-hidden'),
      'Outer container must have classes "fixed inset-0 z-40 pointer-events-none overflow-hidden"'
    );
  });

  test('AC6 & Contract C10: renders mascot wrapper with translate3d positioning and pointer-events: auto', () => {
    const { mascot } = useMascotStore.getState();
    const html = renderToStaticMarkup(<MascotOverlayLayer />);

    assert.ok(html.includes('data-testid="mascot-wrapper"'), 'Must render mascot-wrapper container');
    assert.ok(
      html.includes(`transform:translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)`),
      `Mascot wrapper must be positioned at translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)`
    );
    assert.ok(html.includes('pointer-events-auto'), 'Mascot wrapper must have pointer-events-auto class');
    assert.ok(html.includes('pointer-events:auto'), 'Mascot wrapper must have inline pointer-events: auto');
    assert.ok(html.includes('data-testid="mascot-placeholder"'), 'Must render MascotPlaceholder inside wrapper');
  });

  test('AC6 & Contract C10: renders bubble wrapper with relative offset translate3d positioning and pointer-events: auto', () => {
    const { mascot, bubble } = useMascotStore.getState();
    const expectedX = mascot.position.x + bubble.positionOffset.x;
    const expectedY = mascot.position.y + bubble.positionOffset.y;

    const html = renderToStaticMarkup(<MascotOverlayLayer />);

    assert.ok(html.includes('data-testid="bubble-wrapper"'), 'Must render bubble-wrapper container');
    assert.ok(
      html.includes(`transform:translate3d(${expectedX}px, ${expectedY}px, 0)`),
      `Bubble wrapper must be positioned at translate3d(${expectedX}px, ${expectedY}px, 0)`
    );
    assert.ok(html.includes('pointer-events-auto'), 'Bubble wrapper must have pointer-events-auto class');
    assert.ok(html.includes('data-testid="text-bubble"'), 'Must render TextBubble inside wrapper');
  });

  test('AC6: dynamically updates positions when mascot position changes in store', () => {
    useMascotStore.getState().setMascotPosition({ x: 200, y: 350 });

    const state = useMascotStore.getState();
    assert.equal(state.mascot.position.x, 200);
    assert.equal(state.mascot.position.y, 350);

    const html = renderToStaticMarkup(<MascotOverlayLayer />);

    assert.ok(
      html.includes('transform:translate3d(200px, 350px, 0)'),
      'Mascot wrapper must update to translate3d(200px, 350px, 0)'
    );

    const expectedBubbleX = 200 + state.bubble.positionOffset.x;
    const expectedBubbleY = 350 + state.bubble.positionOffset.y;
    assert.ok(
      html.includes(`transform:translate3d(${expectedBubbleX}px, ${expectedBubbleY}px, 0)`),
      `Bubble wrapper must follow mascot anchor at translate3d(${expectedBubbleX}px, ${expectedBubbleY}px, 0)`
    );
  });

  test('AC6: dynamically updates bubble position when positionOffset changes in store', () => {
    useMascotStore.getState().setBubbleProperties({
      positionOffset: { x: 120, y: -40 },
    });

    const state = useMascotStore.getState();
    const expectedBubbleX = state.mascot.position.x + 120;
    const expectedBubbleY = state.mascot.position.y - 40;

    const html = renderToStaticMarkup(<MascotOverlayLayer />);
    assert.ok(
      html.includes(`transform:translate3d(${expectedBubbleX}px, ${expectedBubbleY}px, 0)`),
      `Bubble wrapper must reflect updated offset at translate3d(${expectedBubbleX}px, ${expectedBubbleY}px, 0)`
    );
  });

  test('AC6: passes onDismiss handler to TextBubble that sets bubble isVisible to false in store', () => {
    assert.equal(useMascotStore.getState().bubble.isVisible, true);

    const element = MascotOverlayLayer();
    assert.ok(element !== null);

    const children = React.Children.toArray(element.props.children);
    const bubbleWrapper = children.find(
      (c: any) => c?.props && c.props['data-testid'] === 'bubble-wrapper'
    ) as React.ReactElement<any>;

    assert.ok(bubbleWrapper, 'Must find bubble-wrapper in element children');
    const textBubbleChild = bubbleWrapper.props.children as React.ReactElement<any>;
    assert.ok(textBubbleChild, 'Must find TextBubble child in bubble-wrapper');
    assert.equal(typeof textBubbleChild.props.onDismiss, 'function');

    // Trigger onDismiss
    textBubbleChild.props.onDismiss();

    // Verify store state updated
    assert.equal(useMascotStore.getState().bubble.isVisible, false);

    // Verify subsequent render has no text bubble
    const htmlAfterDismiss = renderToStaticMarkup(<MascotOverlayLayer />);
    assert.ok(
      !htmlAfterDismiss.includes('data-testid="text-bubble"'),
      'TextBubble must not render after visibility is set to false'
    );
  });

  test('Pointer-Events Invariant: outer container passes clicks through, inner elements capture them', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');

    // Verify outer layer contains pointer-events-none
    assert.ok(content.includes('pointer-events-none'), 'Outer container must have pointer-events-none class');

    // Verify inner mascot wrapper has pointer-events-auto
    assert.ok(content.includes('data-testid="mascot-wrapper"'));
    assert.ok(content.includes("pointerEvents: 'auto'"));

    // Verify inner bubble wrapper has pointer-events-auto
    assert.ok(content.includes('data-testid="bubble-wrapper"'));
    assert.ok(content.includes("className=\"absolute top-0 left-0 pointer-events-auto\""));
  });
});
