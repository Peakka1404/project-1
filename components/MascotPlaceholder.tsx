'use client';

import React from 'react';
import type { MascotVisualProperties } from '@/store/mascotStore';

export interface MascotPlaceholderProps {
  visualProps: MascotVisualProperties;
  onClick?: () => void;
}

/**
 * Maps mascot shape to CSS border-radius value.
 * - 'square' -> '0px'
 * - 'rounded' -> '16px'
 * - 'circle' -> '50%'
 * - 'pill' -> '9999px'
 */
export const getMascotBorderRadius = (shape: MascotVisualProperties['shape']): string => {
  switch (shape) {
    case 'square':
      return '0px';
    case 'rounded':
      return '16px';
    case 'circle':
      return '50%';
    case 'pill':
      return '9999px';
    default:
      return '16px';
  }
};

export function MascotPlaceholder({ visualProps, onClick }: MascotPlaceholderProps) {
  // Hidden state: return null if not visible
  if (!visualProps.isVisible) {
    return null;
  }

  const borderRadius = getMascotBorderRadius(visualProps.shape);
  const iconSize = Math.max(16, Math.round(visualProps.size * 0.45));

  const containerStyle: React.CSSProperties = {
    width: `${visualProps.size}px`,
    height: `${visualProps.size}px`,
    borderRadius,
    /* background-color */
    backgroundColor: visualProps.color,
    /* border */
    border: `${visualProps.borderWidth}px solid ${visualProps.borderColor}`,
    /* box-shadow glow */
    boxShadow: `0 0 ${visualProps.lighting.glowBlur}px ${visualProps.lighting.glowSpread}px ${visualProps.lighting.glowColor}`,
    /* opacity */
    opacity: visualProps.opacity,
    /* filter: blur */
    filter: `blur(${visualProps.blur}px)`,
    /* pointer-events: auto */
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    userSelect: 'none',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'border-radius 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div
      role="img"
      aria-label="Mascot Placeholder"
      data-testid="mascot-placeholder"
      onClick={onClick}
      style={containerStyle}
    >
      {/* Centered SVG mascot placeholder icon (geometric grid / spreadsheet badge) */}
      <svg
        data-testid="mascot-badge-icon"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))' }}
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    </div>
  );
}

export default MascotPlaceholder;
