'use client';

import React from 'react';
import { useMascotStore } from '@/store/mascotStore';
import { MascotPlaceholder } from './MascotPlaceholder';
import { TextBubble } from './TextBubble';

export function MascotOverlayLayer() {
  const mascot = useMascotStore((state) => state.mascot);
  const bubble = useMascotStore((state) => state.bubble);
  const setBubbleVisibility = useMascotStore((state) => state.setBubbleVisibility);

  return (
    <div
      data-testid="mascot-overlay-layer"
      className="fixed inset-0 z-40 pointer-events-none overflow-hidden"
    >
      {/* Absolute mascot container positioned via viewport coordinates */}
      <div
        data-testid="mascot-wrapper"
        className="absolute top-0 left-0 pointer-events-auto"
        style={{
          transform: `translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)`,
          pointerEvents: 'auto',
        }}
      >
        <MascotPlaceholder visualProps={mascot} />
      </div>

      {/* Absolute text bubble container anchored relative to mascot position */}
      <div
        data-testid="bubble-wrapper"
        className="absolute top-0 left-0 pointer-events-auto"
        style={{
          transform: `translate3d(${mascot.position.x + bubble.positionOffset.x}px, ${mascot.position.y + bubble.positionOffset.y}px, 0)`,
          pointerEvents: 'auto',
        }}
      >
        <TextBubble
          bubbleProps={bubble}
          onDismiss={() => setBubbleVisibility(false)}
        />
      </div>
    </div>
  );
}

export default MascotOverlayLayer;
