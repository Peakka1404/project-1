import test, { describe, beforeEach, afterEach } from 'node:test';
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

import HomePage from '../../app/page.tsx';
import { useMascotStore } from '../../store/mascotStore.ts';
import { useSpreadsheetStore } from '../../store/spreadsheetStore.ts';
import { soundController } from '../../lib/audio/soundController.ts';
import { ShellLayout } from '../../components/ShellLayout.tsx';
import { MascotOverlayLayer } from '../../components/MascotOverlayLayer.tsx';
import { MascotCustomizerPanel } from '../../components/MascotCustomizerPanel.tsx';
import { SpreadsheetContainer } from '../../components/SpreadsheetContainer.tsx';
import { OverlayLayer } from '../../components/OverlayLayer.tsx';

/**
 * Recursively search a React element tree for an element matching data-testid
 */
function findElementByTestId(node: any, testId: string): any {
  if (!node || typeof node !== 'object') return null;
  if (node.props && node.props['data-testid'] === testId) return node;
  if (node.props && node.props.children) {
    const children = React.Children.toArray(node.props.children);
    for (const child of children) {
      const found = findElementByTestId(child, testId);
      if (found) return found;
    }
  }
  if (node.props) {
    for (const key of Object.keys(node.props)) {
      if (key !== 'children' && React.isValidElement(node.props[key])) {
        const found = findElementByTestId(node.props[key], testId);
        if (found) return found;
      }
    }
  }
  return null;
}

describe('HomePage Integration (app/page.tsx)', () => {
  const pagePath = path.resolve(process.cwd(), 'app/page.tsx');

  beforeEach(() => {
    useMascotStore.getState().resetAll();
    useSpreadsheetStore.getState().resetDisplay();
  });

  // --- Phase 1 Baseline Invariants ---

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

  // --- T-009 / Contract C12 Acceptance Criteria ---

  test('T-009 AC1 & Contract C12: renders MascotOverlayLayer and MascotCustomizerPanel in the component tree', () => {
    // 1. Inspect JSX element tree returned by HomePage
    const tree = HomePage() as any;
    assert.ok(tree, 'HomePage must return a valid React element');
    assert.equal(tree.type, React.Fragment, 'HomePage root must be a React Fragment');

    const children = React.Children.toArray(tree.props.children);
    assert.equal(children.length, 3, 'HomePage root must render ShellLayout, MascotOverlayLayer, and MascotCustomizerPanel');

    const [shellElem, overlayElem, customizerElem] = children as any[];
    assert.equal(shellElem.type, ShellLayout, 'First child must be ShellLayout');
    assert.equal(overlayElem.type, MascotOverlayLayer, 'Second child must be MascotOverlayLayer');
    assert.equal(customizerElem.type, MascotCustomizerPanel, 'Third child must be MascotCustomizerPanel');

    // 2. Inspect rendered HTML static markup
    const html = renderToStaticMarkup(<HomePage />);
    assert.ok(html.includes('data-testid="mascot-overlay-layer"'), 'Must render MascotOverlayLayer in markup');
    assert.ok(html.includes('data-testid="mascot-customizer-panel"'), 'Must render MascotCustomizerPanel in markup');
    assert.ok(
      html.includes('fixed inset-0 z-40 pointer-events-none overflow-hidden'),
      'MascotOverlayLayer must have fixed inset-0 z-40 pointer-events-none classes'
    );
    assert.ok(
      html.includes('fixed bottom-4 right-4 z-50'),
      'MascotCustomizerPanel must have fixed bottom-4 right-4 z-50 classes'
    );
  });

  test('T-009 AC2 & Contract C12: Sidebar includes an interactive "Complete Guide" button', () => {
    const tree = HomePage() as any;
    const button = findElementByTestId(tree, 'complete-guide-btn');

    assert.ok(button, 'Sidebar must contain an element with data-testid="complete-guide-btn"');
    assert.equal(button.type, 'button', 'Complete Guide trigger must be a <button> element');
    assert.equal(button.props.type, 'button', 'Button must have type="button" attribute');
    assert.equal(typeof button.props.onClick, 'function', 'Button must have an onClick event handler function');

    // Verify button styling and text content in rendered markup
    const html = renderToStaticMarkup(<HomePage />);
    assert.ok(html.includes('data-testid="complete-guide-btn"'), 'Markup must include complete-guide-btn');
    assert.ok(html.includes('Complete Guide'), 'Button text must contain "Complete Guide"');
    assert.ok(html.includes('bg-green-600'), 'Button must have green accent styling classes');
  });

  test('T-009 AC3 & Contract C12: Clicking "Complete Guide" triggers soundController.playCompletion() and updates text bubble celebratory message and visibility', async () => {
    // Setup spy for soundController.playCompletion
    let playCompletionCalls = 0;
    let playedUrl: string | undefined = undefined;
    const origPlayCompletion = soundController.playCompletion;
    soundController.playCompletion = async (url?: string) => {
      playCompletionCalls++;
      playedUrl = url;
    };

    try {
      // Initialize store to a non-celebratory hidden state
      useMascotStore.getState().setBubbleVisibility(false);
      useMascotStore.getState().setBubbleText('Initial placeholder text');

      assert.equal(useMascotStore.getState().bubble.isVisible, false, 'Bubble should initially be hidden');
      assert.equal(useMascotStore.getState().bubble.text, 'Initial placeholder text');
      assert.equal(playCompletionCalls, 0, 'Audio should not have played yet');

      // Obtain button and invoke click handler
      const tree = HomePage() as any;
      const button = findElementByTestId(tree, 'complete-guide-btn');
      assert.ok(button, 'Button must be found in tree');

      button.props.onClick();

      // Verify audio invocation
      assert.equal(playCompletionCalls, 1, 'soundController.playCompletion must be called exactly once');

      // Verify store updates
      const updatedState = useMascotStore.getState();
      assert.equal(updatedState.bubble.isVisible, true, 'Bubble visibility must be set to true');
      assert.ok(
        updatedState.bubble.text.includes('Excellent work!') && updatedState.bubble.text.includes('completed this guide'),
        `Bubble text must contain celebratory completion message, got: "${updatedState.bubble.text}"`
      );
    } finally {
      soundController.playCompletion = origPlayCompletion;
    }
  });

  test('T-009 AC3: Repeated clicks on "Complete Guide" repeatedly trigger sound and maintain celebratory state', async () => {
    let playCompletionCalls = 0;
    const origPlayCompletion = soundController.playCompletion;
    soundController.playCompletion = async () => {
      playCompletionCalls++;
    };

    try {
      const tree = HomePage() as any;
      const button = findElementByTestId(tree, 'complete-guide-btn');

      // Click 3 times
      button.props.onClick();
      button.props.onClick();
      button.props.onClick();

      assert.equal(playCompletionCalls, 3, 'playCompletion must be invoked on every click');
      assert.equal(useMascotStore.getState().bubble.isVisible, true);
      assert.ok(useMascotStore.getState().bubble.text.includes('Excellent work!'));
    } finally {
      soundController.playCompletion = origPlayCompletion;
    }
  });

  test('T-009 AC4 & Contract C12: Mascot and customizer elements coexist with ShellLayout and SpreadsheetContainer without breaking layout constraints', () => {
    // Enable modal overlay in spreadsheet store to inspect complete layer stack
    useSpreadsheetStore.getState().toggleOverlay();

    const html = renderToStaticMarkup(<HomePage />);

    // 1. ShellLayout and resizing handle
    assert.ok(html.includes('data-panel-group-direction="horizontal"'), 'PanelGroup must be present');
    assert.ok(html.includes('cursor-col-resize'), 'PanelResizeHandle must be present with resize cursor');

    // 2. Spreadsheet flex container
    assert.ok(html.includes('relative flex-1 overflow-hidden'), 'Main area must maintain relative flex-1 container');

    // 3. Layer stacking order verification:
    // Modal Overlay (z-30) < Mascot Overlay (z-40) < Customizer Panel (z-50)
    assert.ok(html.includes('z-30'), 'OverlayLayer must use z-30');
    assert.ok(html.includes('z-40'), 'MascotOverlayLayer must use z-40');
    assert.ok(html.includes('z-50'), 'MascotCustomizerPanel must use z-50');

    // 4. Pointer-events passthrough verification:
    // MascotOverlayLayer outer container has pointer-events-none so spreadsheet and sidebar clicks pass through unobstructed
    assert.ok(
      html.includes('pointer-events-none'),
      'MascotOverlayLayer must pass pointer events through to spreadsheet and shell controls'
    );
  });

  test('T-009 AC3 & Invariant: Guide completion handler works correctly when sound is muted or volume is zero', async () => {
    let playCompletionCalls = 0;
    const origPlayCompletion = soundController.playCompletion;
    soundController.playCompletion = async () => {
      playCompletionCalls++;
    };

    try {
      // Mute audio and set volume to 0
      useMascotStore.getState().setSoundSettings({ isMuted: true, volume: 0 });
      useMascotStore.getState().setBubbleVisibility(false);
      useMascotStore.getState().setBubbleText('Pre-completion text');

      const tree = HomePage() as any;
      const button = findElementByTestId(tree, 'complete-guide-btn');
      assert.ok(button);

      // Trigger click
      button.props.onClick();

      // Verify audio method was called and bubble updated
      assert.equal(playCompletionCalls, 1);
      const state = useMascotStore.getState();
      assert.equal(state.bubble.isVisible, true);
      assert.ok(state.bubble.text.includes('Excellent work!'));
    } finally {
      soundController.playCompletion = origPlayCompletion;
    }
  });

  test('T-009 AC4: Expanded customizer panel and mascot overlay layer coexist without interfering with shell layout', () => {
    // Open customizer panel
    useMascotStore.getState().setCustomizerOpen(true);

    const html = renderToStaticMarkup(<HomePage />);

    // Customizer panel expanded state rendered
    assert.ok(html.includes('data-testid="customizer-card"'), 'Expanded customizer panel must render card');
    assert.ok(html.includes('Customize Mascot'), 'Expanded panel must show header title');
    assert.ok(html.includes('Mascot'), 'Expanded panel must show Mascot tab');
    assert.ok(html.includes('Bubble'), 'Expanded panel must show Bubble tab');
    assert.ok(html.includes('Audio'), 'Expanded panel must show Audio tab');

    // Mascot overlay layer and ShellLayout remain present
    assert.ok(html.includes('data-testid="mascot-overlay-layer"'), 'Overlay layer remains rendered');
    assert.ok(html.includes('cursor-col-resize'), 'Shell resize handle remains rendered');
    assert.ok(html.includes('data-testid="complete-guide-btn"'), 'Complete guide button remains rendered');
  });

  test('T-009 AC5 & Contract C12: Univer spreadsheet container maintains independent lifecycle without re-rendering on mascot state updates', () => {
    // 1. Static Invariant Check:
    // Verify HomePage does NOT subscribe directly to reactive mascot state hooks
    // (i.e. does not call `useMascotStore((state) => ...)` at component body)
    const content = fs.readFileSync(pagePath, 'utf-8');
    const reactiveSubscriptionMatches = content.match(/useMascotStore\(\s*\(/g);
    assert.equal(
      reactiveSubscriptionMatches,
      null,
      'HomePage must not subscribe to reactive useMascotStore state; it must only use .getState() in handlers'
    );

    // 2. Dynamic Stability Check:
    // Mutate various mascot store properties (position, lighting, shape, bubble text, audio, customizer open)
    // and verify that HomePage's SpreadsheetContainer / SpreadsheetWrapper subtree remains stable.
    const initialTree = HomePage() as any;
    const initialMain = initialTree.props.children[0].props.main;

    // Dispatch multiple store changes
    useMascotStore.getState().setMascotPosition({ x: 350, y: 550 });
    useMascotStore.getState().setMascotProperties({ size: 140, color: '#ef4444' });
    useMascotStore.getState().setBubbleText('Testing dynamic mutation');
    useMascotStore.getState().setBubbleVisibility(true);
    useMascotStore.getState().setCustomizerOpen(true);

    const postMutationTree = HomePage() as any;
    const postMutationMain = postMutationTree.props.children[0].props.main;

    // Spreadsheet wrapper element should remain identical structure with ssr: false
    const spreadsheetWrapper = postMutationMain.props.children[1].props.children[0].props.children;
    assert.ok(spreadsheetWrapper, 'SpreadsheetWrapper must be nested in SpreadsheetContainer');

    // Verify HomePage function returns equivalent shell structure
    assert.equal(
      initialMain.props.className,
      postMutationMain.props.className,
      'Main container layout structure must remain unaffected'
    );
  });

  test('T-009 AC5 & Boundary Invariants: Rapid mascot state mutations across boundaries do not corrupt page layout structure', () => {
    const boundaryPositions = [
      { x: 0, y: 0 },
      { x: 1920, y: 1080 },
      { x: 50, y: 50 },
    ];

    for (const pos of boundaryPositions) {
      useMascotStore.getState().setMascotPosition(pos);
      useMascotStore.getState().setMascotProperties({
        size: 32,
        opacity: 0,
        blur: 20,
      });

      const html = renderToStaticMarkup(<HomePage />);
      assert.ok(html.includes('data-panel-group-direction="horizontal"'), 'PanelGroup must remain intact');
      assert.ok(html.includes('relative flex-1 overflow-hidden'), 'Main spreadsheet container must remain intact');
      assert.ok(html.includes('data-testid="mascot-overlay-layer"'), 'Overlay layer must remain intact');
    }
  });
});

