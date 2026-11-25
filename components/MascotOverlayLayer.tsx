'use client';

import React from 'react';
import { create } from 'zustand';
import { useMascotStore } from '@/store/mascotStore';
import { MascotPlaceholder } from './MascotPlaceholder';
import { TextBubble } from './TextBubble';

/* -------------------------------------------------------------------------- */
/* Overlay-local layout state (viewport size, measured bubble size, dragging) */
/* -------------------------------------------------------------------------- */

interface Size {
  width: number;
  height: number;
}

interface OverlayLayoutState {
  viewport: Size | null; // null until measured on the client (SSR / tests)
  bubbleSize: Size;
  isDragging: boolean;
}

const useOverlayLayoutStore = create<OverlayLayoutState>(() => ({
  viewport: null,
  bubbleSize: { width: 0, height: 0 },
  isDragging: false,
}));

const clampRange = (val: number, min: number, max: number): number =>
  Math.min(Math.max(min, max), Math.max(min, val));

/** Clamps a mascot position so the whole mascot stays inside the viewport. */
export const clampMascotPosition = (
  pos: { x: number; y: number },
  size: number,
  viewport: Size | null
): { x: number; y: number } => {
  if (!viewport) return { x: Math.max(0, pos.x), y: Math.max(0, pos.y) };
  return {
    x: clampRange(pos.x, 0, viewport.width - size),
    y: clampRange(pos.y, 0, viewport.height - size),
  };
};

/**
 * Computes the bubble position so it is always inside the viewport.
 * Preferred placement is `mascot + offset`. If that overflows horizontally,
 * the bubble is mirrored to the other side of the mascot; if it still does
 * not fit, it is clamped to the viewport edges. Vertically it is clamped.
 */
export const computeBubblePosition = (
  mascotPos: { x: number; y: number },
  mascotSize: number,
  offset: { x: number; y: number },
  bubbleSize: Size,
  viewport: Size | null
): { x: number; y: number } => {
  const preferredX = mascotPos.x + offset.x;
  const preferredY = mascotPos.y + offset.y;
  if (!viewport) return { x: preferredX, y: preferredY };

  const { width: bw, height: bh } = bubbleSize;
  const fitsX = (x: number) => x >= 0 && x + bw <= viewport.width;

  let x = preferredX;
  if (!fitsX(x)) {
    // Mirror placement across the mascot's vertical center line.
    const mirroredX = mascotPos.x + mascotSize - offset.x - bw;
    if (fitsX(mirroredX)) {
      x = mirroredX;
    } else {
      // Neither side fits fully: pick the side with more room, then clamp.
      const roomRight = viewport.width - (mascotPos.x + mascotSize);
      const roomLeft = mascotPos.x;
      x = roomRight >= roomLeft ? preferredX : mirroredX;
    }
  }

  return {
    x: clampRange(x, 0, viewport.width - bw),
    y: clampRange(preferredY, 0, viewport.height - bh),
  };
};

/* -------------------------------------------------------------------------- */
/* Stable DOM ref callbacks (module-level so they are not re-attached on      */
/* every render)                                                              */
/* -------------------------------------------------------------------------- */

let viewportObserver: ResizeObserver | null = null;
let bubbleObserver: ResizeObserver | null = null;

const syncMascotIntoViewport = () => {
  const { viewport } = useOverlayLayoutStore.getState();
  const { mascot, setMascotPosition } = useMascotStore.getState();
  const clamped = clampMascotPosition(mascot.position, mascot.size, viewport);
  if (clamped.x !== mascot.position.x || clamped.y !== mascot.position.y) {
    setMascotPosition(clamped);
  }
};

const attachViewportNode = (node: HTMLDivElement | null) => {
  viewportObserver?.disconnect();
  viewportObserver = null;
  if (!node) return;

  const measure = () => {
    useOverlayLayoutStore.setState({
      viewport: { width: node.clientWidth, height: node.clientHeight },
    });
    syncMascotIntoViewport();
  };
  measure();
  if (typeof ResizeObserver !== 'undefined') {
    viewportObserver = new ResizeObserver(measure);
    viewportObserver.observe(node);
  }
};

const attachBubbleNode = (node: HTMLDivElement | null) => {
  bubbleObserver?.disconnect();
  bubbleObserver = null;
  if (!node) return;

  const measure = () => {
    const { bubbleSize } = useOverlayLayoutStore.getState();
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    if (width !== bubbleSize.width || height !== bubbleSize.height) {
      useOverlayLayoutStore.setState({ bubbleSize: { width, height } });
    }
  };
  measure();
  if (typeof ResizeObserver !== 'undefined') {
    bubbleObserver = new ResizeObserver(measure);
    bubbleObserver.observe(node);
  }
};

/* -------------------------------------------------------------------------- */
/* Drag handling (pointer events, works with mouse, pen and touch)            */
/* -------------------------------------------------------------------------- */

let dragGrabOffset: { x: number; y: number } | null = null;

const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const { mascot } = useMascotStore.getState();
  const { viewport } = useOverlayLayoutStore.getState();
  const current = clampMascotPosition(mascot.position, mascot.size, viewport);

  dragGrabOffset = { x: e.clientX - current.x, y: e.clientY - current.y };
  e.currentTarget.setPointerCapture?.(e.pointerId);
  e.preventDefault(); // avoid text selection / native drag
  useOverlayLayoutStore.setState({ isDragging: true });
};

const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!dragGrabOffset) return;
  const { mascot, setMascotPosition } = useMascotStore.getState();
  const { viewport } = useOverlayLayoutStore.getState();
  setMascotPosition(
    clampMascotPosition(
      { x: e.clientX - dragGrabOffset.x, y: e.clientY - dragGrabOffset.y },
      mascot.size,
      viewport
    )
  );
};

const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!dragGrabOffset) return;
  dragGrabOffset = null;
  if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  useOverlayLayoutStore.setState({ isDragging: false });
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function MascotOverlayLayer() {
  const mascot = useMascotStore((state) => state.mascot);
  const bubble = useMascotStore((state) => state.bubble);
  const setBubbleVisibility = useMascotStore((state) => state.setBubbleVisibility);
  const viewport = useOverlayLayoutStore((state) => state.viewport);
  const bubbleSize = useOverlayLayoutStore((state) => state.bubbleSize);
  const isDragging = useOverlayLayoutStore((state) => state.isDragging);

  const mascotPos = clampMascotPosition(mascot.position, mascot.size, viewport);
  const bubblePos = computeBubblePosition(
    mascotPos,
    mascot.size,
    bubble.positionOffset,
    bubbleSize,
    viewport
  );

  return (
    <div
      ref={attachViewportNode}
      data-testid="mascot-overlay-layer"
      className="fixed inset-0 z-40 pointer-events-none overflow-hidden"
    >
      {/* Absolute mascot container positioned via viewport coordinates (draggable) */}
      <div
        data-testid="mascot-wrapper"
        className="absolute top-0 left-0 pointer-events-auto"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          transform: `translate3d(${mascotPos.x}px, ${mascotPos.y}px, 0)`,
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <MascotPlaceholder visualProps={mascot} />
      </div>

      {/* Absolute text bubble container anchored to mascot, kept inside the viewport */}
      <div
        ref={attachBubbleNode}
        data-testid="bubble-wrapper"
        className="absolute top-0 left-0 pointer-events-auto"
        style={{
          transform: `translate3d(${bubblePos.x}px, ${bubblePos.y}px, 0)`,
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
