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
  TextBubble,
  getBubbleBorderRadius,
} from '../../components/TextBubble.tsx';
import {
  DEFAULT_BUBBLE_PROPERTIES,
  type TextBubbleProperties,
} from '../../store/mascotStore.ts';

describe('TextBubble Component (Contract C9.2)', () => {
  const componentPath = path.resolve(process.cwd(), 'components/TextBubble.tsx');

  test('AC3 & Contract C9.2: has "use client" directive and exports required symbols', () => {
    assert.ok(fs.existsSync(componentPath), 'components/TextBubble.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(
      content.startsWith("'use client'") || content.startsWith('"use client"'),
      'Must contain "use client" directive at top of file'
    );
    assert.ok(content.includes('export interface TextBubbleProps'), 'Must export TextBubbleProps');
    assert.ok(content.includes('export const getBubbleBorderRadius'), 'Must export getBubbleBorderRadius helper');
    assert.ok(content.includes('export function TextBubble'), 'Must export TextBubble component');
  });

  test('AC3 & Contract C9.2: getBubbleBorderRadius maps shapes to exact border radius values', () => {
    assert.equal(getBubbleBorderRadius('rounded'), '16px', 'rounded must map to 16px');
    assert.equal(getBubbleBorderRadius('square'), '4px', 'square must map to 4px');
    assert.equal(getBubbleBorderRadius('speech-balloon'), '16px 16px 16px 2px', 'speech-balloon must map to 16px 16px 16px 2px');
    // Fallback for unknown shape
    assert.equal(getBubbleBorderRadius('unknown' as any), '16px', 'fallback must be 16px');
  });

  test('AC3 & Contract C9.2: renders container with dimensions, background color, border, and box-shadow', () => {
    const bubbleProps: TextBubbleProperties = {
      ...DEFAULT_BUBBLE_PROPERTIES,
      shape: 'rounded',
      size: {
        maxWidth: 320,
        padding: 16,
      },
      color: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 2,
      lighting: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: 16,
        shadowSpread: 2,
      },
      opacity: 0.9,
      blur: 1,
      isVisible: true,
    };

    const html = renderToStaticMarkup(<TextBubble bubbleProps={bubbleProps} />);

    assert.ok(html.includes('role="region"'), 'Must have role="region"');
    assert.ok(html.includes('aria-label="Mascot Text Bubble"'), 'Must have aria-label');
    assert.ok(html.includes('data-testid="text-bubble"'), 'Must have data-testid');

    // Container style assertions
    assert.ok(html.includes('max-width:320px'), 'Must apply max-width matching size.maxWidth');
    assert.ok(html.includes('padding:16px'), 'Must apply padding matching size.padding');
    assert.ok(html.includes('background-color:#ffffff'), 'Must apply background-color');
    assert.ok(html.includes('border:2px solid #cbd5e1'), 'Must apply border styling');
    assert.ok(html.includes('box-shadow:0 4px 16px 2px rgba(0, 0, 0, 0.2)'), 'Must apply box-shadow');
    assert.ok(html.includes('opacity:0.9'), 'Must apply opacity');
    assert.ok(html.includes('filter:blur(1px)'), 'Must apply blur filter');
    assert.ok(html.includes('pointer-events:auto'), 'Must set pointer-events: auto');
    assert.ok(html.includes('border-radius:16px'), 'Must set border-radius: 16px for rounded shape');
  });

  test('AC3: renders border-radius for each bubble shape correctly (square, speech-balloon)', () => {
    // Square
    const squareHtml = renderToStaticMarkup(
      <TextBubble bubbleProps={{ ...DEFAULT_BUBBLE_PROPERTIES, shape: 'square' }} />
    );
    assert.ok(squareHtml.includes('border-radius:4px'), 'Square bubble must render with border-radius: 4px');

    // Speech-balloon
    const balloonHtml = renderToStaticMarkup(
      <TextBubble bubbleProps={{ ...DEFAULT_BUBBLE_PROPERTIES, shape: 'speech-balloon' }} />
    );
    assert.ok(
      balloonHtml.includes('border-radius:16px 16px 16px 2px'),
      'Speech-balloon bubble must render with border-radius: 16px 16px 16px 2px'
    );
  });

  test('AC3 & Contract C9.2: renders paragraph with typography attributes and content text', () => {
    const bubbleProps: TextBubbleProperties = {
      ...DEFAULT_BUBBLE_PROPERTIES,
      text: 'Click on cell B4 to enter formula.',
      typography: {
        fontSize: 18,
        textColor: '#0f172a',
        textAlign: 'center',
        fontWeight: '600',
      },
    };

    const html = renderToStaticMarkup(<TextBubble bubbleProps={bubbleProps} />);

    assert.ok(html.includes('data-testid="text-bubble-content"'), 'Must have content data-testid');
    assert.ok(html.includes('Click on cell B4 to enter formula.'), 'Must render specified text content');
    assert.ok(html.includes('font-size:18px'), 'Must apply fontSize');
    assert.ok(html.includes('color:#0f172a'), 'Must apply textColor');
    assert.ok(html.includes('text-align:center'), 'Must apply textAlign');
    assert.ok(html.includes('font-weight:600'), 'Must apply fontWeight');
  });

  test('AC4 & Contract C9.2: returns null when bubbleProps.isVisible is false', () => {
    const hiddenProps: TextBubbleProperties = {
      ...DEFAULT_BUBBLE_PROPERTIES,
      isVisible: false,
    };

    const rendered = TextBubble({ bubbleProps: hiddenProps });
    assert.equal(rendered, null, 'Component must return null when isVisible is false');

    const html = renderToStaticMarkup(<TextBubble bubbleProps={hiddenProps} />);
    assert.equal(html, '', 'Static markup must be empty string when isVisible is false');
  });

  test('AC4: renders dismiss button with aria-label="Dismiss" and handles onDismiss callback', () => {
    let dismissed = false;
    let propagationStopped = false;

    const onDismiss = () => {
      dismissed = true;
    };

    const html = renderToStaticMarkup(
      <TextBubble bubbleProps={DEFAULT_BUBBLE_PROPERTIES} onDismiss={onDismiss} />
    );

    assert.ok(html.includes('aria-label="Dismiss"'), 'Dismiss button must have aria-label="Dismiss"');
    assert.ok(html.includes('data-testid="text-bubble-dismiss-button"'), 'Dismiss button must have data-testid');
    assert.ok(html.includes('type="button"'), 'Dismiss button must have type="button"');

    // Verify interaction wiring
    const element = TextBubble({ bubbleProps: DEFAULT_BUBBLE_PROPERTIES, onDismiss });
    assert.ok(element !== null);

    // Find the dismiss button in children
    const children = React.Children.toArray(element?.props.children);
    const buttonElement = children.find(
      (child: any) => child?.props && child.props['data-testid'] === 'text-bubble-dismiss-button'
    ) as React.ReactElement<any>;

    assert.ok(buttonElement, 'Must find dismiss button element in children');
    assert.equal(typeof buttonElement.props.onClick, 'function');

    // Simulate click with stopPropagation event object
    buttonElement.props.onClick({
      stopPropagation: () => {
        propagationStopped = true;
      },
    });

    assert.equal(dismissed, true, 'onDismiss must be called on click');
    assert.equal(propagationStopped, true, 'stopPropagation must be called to prevent backdrop click');
  });

  test('AC4: handles dismiss button click gracefully when onDismiss is omitted', () => {
    const element = TextBubble({ bubbleProps: DEFAULT_BUBBLE_PROPERTIES });
    assert.ok(element !== null);

    const children = React.Children.toArray(element?.props.children);
    const buttonElement = children.find(
      (child: any) => child?.props && child.props['data-testid'] === 'text-bubble-dismiss-button'
    ) as React.ReactElement<any>;

    assert.ok(buttonElement);
    // Should not throw
    assert.doesNotThrow(() => {
      buttonElement.props.onClick({
        stopPropagation: () => {},
      });
    });
  });

  test('Boundary Values: handles boundary limits (min maxWidth 120, max maxWidth 600, min padding 4, max padding 32)', () => {
    const minProps: TextBubbleProperties = {
      ...DEFAULT_BUBBLE_PROPERTIES,
      size: { maxWidth: 120, padding: 4 },
      borderWidth: 0,
      opacity: 0,
      blur: 20,
    };
    const minHtml = renderToStaticMarkup(<TextBubble bubbleProps={minProps} />);
    assert.ok(minHtml.includes('max-width:120px'));
    assert.ok(minHtml.includes('padding:4px'));
    assert.ok(minHtml.includes('border:0px solid #e2e8f0'));
    assert.ok(minHtml.includes('opacity:0'));
    assert.ok(minHtml.includes('filter:blur(20px)'));

    const maxProps: TextBubbleProperties = {
      ...DEFAULT_BUBBLE_PROPERTIES,
      size: { maxWidth: 600, padding: 32 },
      borderWidth: 8,
      opacity: 1,
      blur: 0,
    };
    const maxHtml = renderToStaticMarkup(<TextBubble bubbleProps={maxProps} />);
    assert.ok(maxHtml.includes('max-width:600px'));
    assert.ok(maxHtml.includes('padding:32px'));
    assert.ok(maxHtml.includes('border:8px solid #e2e8f0'));
    assert.ok(maxHtml.includes('opacity:1'));
    assert.ok(maxHtml.includes('filter:blur(0px)'));
  });

  test('Edge Cases: handles empty text and text alignment variations', () => {
    const emptyTextProps: TextBubbleProperties = {
      ...DEFAULT_BUBBLE_PROPERTIES,
      text: '',
    };
    const emptyHtml = renderToStaticMarkup(<TextBubble bubbleProps={emptyTextProps} />);
    assert.ok(emptyHtml.includes('data-testid="text-bubble-content"'));

    const rightAlignProps: TextBubbleProperties = {
      ...DEFAULT_BUBBLE_PROPERTIES,
      typography: {
        ...DEFAULT_BUBBLE_PROPERTIES.typography,
        textAlign: 'right',
      },
    };
    const rightHtml = renderToStaticMarkup(<TextBubble bubbleProps={rightAlignProps} />);
    assert.ok(rightHtml.includes('text-align:right'));
  });
});
