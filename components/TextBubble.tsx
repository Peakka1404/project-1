'use client';

import React from 'react';
import type { TextBubbleProperties } from '@/store/mascotStore';

export interface TextBubbleProps {
  bubbleProps: TextBubbleProperties;
  onDismiss?: () => void;
}

/**
 * Maps bubble shape to CSS border-radius value.
 * - 'rounded' -> '16px'
 * - 'square' -> '4px'
 * - 'speech-balloon' -> '16px 16px 16px 2px'
 */
export const getBubbleBorderRadius = (shape: TextBubbleProperties['shape']): string => {
  switch (shape) {
    case 'rounded':
      return '16px';
    case 'square':
      return '4px';
    case 'speech-balloon':
      return '16px 16px 16px 2px';
    default:
      return '16px';
  }
};

export function TextBubble({ bubbleProps, onDismiss }: TextBubbleProps) {
  // Hidden state: return null if not visible
  if (!bubbleProps.isVisible) {
    return null;
  }

  const borderRadius = getBubbleBorderRadius(bubbleProps.shape);

  const containerStyle: React.CSSProperties = {
    maxWidth: `${bubbleProps.size.maxWidth}px`,
    padding: `${bubbleProps.size.padding}px`,
    /* background-color */
    backgroundColor: bubbleProps.color,
    /* border */
    border: `${bubbleProps.borderWidth}px solid ${bubbleProps.borderColor}`,
    /* box-shadow */
    boxShadow: `0 4px ${bubbleProps.lighting.shadowBlur}px ${bubbleProps.lighting.shadowSpread}px ${bubbleProps.lighting.shadowColor}`,
    /* opacity */
    opacity: bubbleProps.opacity,
    /* filter: blur */
    filter: `blur(${bubbleProps.blur}px)`,
    /* pointer-events: auto */
    pointerEvents: 'auto',
    borderRadius,
    position: 'relative',
    transition: 'border-radius 0.15s ease, box-shadow 0.15s ease',
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${bubbleProps.typography.fontSize}px`,
    color: bubbleProps.typography.textColor,
    textAlign: bubbleProps.typography.textAlign,
    fontWeight: bubbleProps.typography.fontWeight,
    margin: 0,
    paddingRight: '16px',
    wordBreak: 'break-word',
    lineHeight: 1.4,
  };

  return (
    <div
      role="region"
      aria-label="Mascot Text Bubble"
      data-testid="text-bubble"
      style={containerStyle}
    >
      <p data-testid="text-bubble-content" style={textStyle}>
        {bubbleProps.text}
      </p>

      {/* Dismiss Button */}
      <button
        type="button"
        aria-label="Dismiss"
        data-testid="text-bubble-dismiss-button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss?.();
        }}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: bubbleProps.typography.textColor,
          opacity: 0.6,
          lineHeight: 1,
          borderRadius: '50%',
          pointerEvents: 'auto',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default TextBubble;
