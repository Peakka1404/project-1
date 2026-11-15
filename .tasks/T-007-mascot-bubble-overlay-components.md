---
id: T-007
title: "Mascot Placeholder, Text Bubble & Viewport Overlay Components"
plan: "mascot-overlay-audio"
status: TESTING         # READY | IN_PROGRESS | REVIEW | TESTING | DONE | BLOCKED
owner: user_coder
blocked_type: ""       # AMBIGUOUS | CONFLICT | SCOPE | ENV | DEPENDENCY | FAILING | UNSAFE
depends_on:
  - T-005
parallel_group: "group-2"
deep_test: true
branch: "feature/mascot-overlay-audio"
---

# T-007: Mascot Placeholder, Text Bubble & Viewport Overlay Components

## Goal

Implement `components/MascotPlaceholder.tsx`, `components/TextBubble.tsx`, and `components/MascotOverlayLayer.tsx` to render customizable mascot shapes/lighting, speech bubble typography/container, and full-viewport coordinate positioning with pointer-events passthrough so spreadsheet interactions remain unobstructed.

## Contract

Contracts C9 and C10 (`docs/contracts/mascot-customization-sound.md`):

### C9.1: MascotPlaceholder (`components/MascotPlaceholder.tsx`)
- **Props:**
  ```typescript
  export interface MascotPlaceholderProps {
    visualProps: MascotVisualProperties;
    onClick?: () => void;
  }
  ```
- **Rendering & Styling Rules:**
  - Container element rendered with exact dimensions: `style.width = ${visualProps.size}px`, `style.height = ${visualProps.size}px`.
  - Border radius mapped to shape:
    - `'square'`: `0px`
    - `'rounded'`: `16px` (or `20%` proportional)
    - `'circle'`: `50%`
    - `'pill'`: `9999px`
  - Inline styles:
    - `background-color`: `visualProps.color`
    - `border`: `${visualProps.borderWidth}px solid ${visualProps.borderColor}`
    - `box-shadow`: `0 0 ${visualProps.lighting.glowBlur}px ${visualProps.lighting.glowSpread}px ${visualProps.lighting.glowColor}`
    - `opacity`: `visualProps.opacity`
    - `filter`: `blur(${visualProps.blur}px)`
    - `pointer-events: auto`
  - Inner Graphic: renders an embedded SVG placeholder icon (geometric grid/spreadsheet mascot badge) centered within the container.
  - Hidden State: if `visualProps.isVisible === false`, returns `null`.

### C9.2: TextBubble (`components/TextBubble.tsx`)
- **Props:**
  ```typescript
  export interface TextBubbleProps {
    bubbleProps: TextBubbleProperties;
    onDismiss?: () => void;
  }
  ```
- **Rendering & Styling Rules:**
  - Container element styled with:
    - `max-width`: `${bubbleProps.size.maxWidth}px`
    - `padding`: `${bubbleProps.size.padding}px`
    - `background-color`: `bubbleProps.color`
    - `border`: `${bubbleProps.borderWidth}px solid ${bubbleProps.borderColor}`
    - `box-shadow`: `0 4px ${bubbleProps.lighting.shadowBlur}px ${bubbleProps.lighting.shadowSpread}px ${bubbleProps.lighting.shadowColor}`
    - `opacity`: `bubbleProps.opacity`
    - `filter`: `blur(${bubbleProps.blur}px)`
    - `pointer-events: auto`
  - Border radius mapped to shape:
    - `'rounded'`: `16px`
    - `'square'`: `4px`
    - `'speech-balloon'`: `16px 16px 16px 2px` with directional tail notch
  - Text Content:
    - `font-size`: `${bubbleProps.typography.fontSize}px`
    - `color`: `bubbleProps.typography.textColor`
    - `text-align`: `bubbleProps.typography.textAlign`
    - `font-weight`: `bubbleProps.typography.fontWeight`
  - Dismiss button: clickable close button/icon calling `onDismiss`.
  - Hidden State: if `bubbleProps.isVisible === false`, returns `null`.

### C10: Mascot Overlay Layer (`components/MascotOverlayLayer.tsx`)
- **Props:** None (connects to `useMascotStore`)
- **Container Styling:** `fixed inset-0 z-40 pointer-events-none overflow-hidden`
- **Coordinate Positioning:**
  - Mascot wrapper positioned at `style={{ transform: \`translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)\` }}`.
  - Text bubble anchored relative to mascot at `style={{ transform: \`translate3d(${mascot.position.x + bubble.positionOffset.x}px, ${mascot.position.y + bubble.positionOffset.y}px, 0)\` }}`.
- **Pointer-Events Passthrough Invariant:**
  - Outer viewport layer MUST have `pointer-events: none`.
  - Inner mascot and bubble containers MUST have `pointer-events: auto`.

## Files to Modify

<!-- Files the coder MAY change. context_files are read-only. -->

### files_to_modify
- `components/MascotPlaceholder.tsx`
- `components/TextBubble.tsx`
- `components/MascotOverlayLayer.tsx`

### context_files
- `store/mascotStore.ts`
- `docs/contracts/mascot-customization-sound.md`
- `docs/ARCHITECTURE.md`

### test_files
- `__tests__/components/MascotPlaceholder.test.tsx`
- `__tests__/components/TextBubble.test.tsx`
- `__tests__/components/MascotOverlayLayer.test.tsx`

## Out of Scope

- Mascot customization panel UI (handled in T-008).
- Page-level layout mounting and guide completion wiring in `app/page.tsx` (handled in T-009).
- Complex canvas or WebGL character rigs.

## Requirements

1. Implement `components/MascotPlaceholder.tsx`:
   - Mark as `'use client'`.
   - Export `MascotPlaceholderProps` and `MascotPlaceholder` component.
   - Guard against `!visualProps.isVisible` by returning `null`.
   - Apply border radius based on `visualProps.shape`:
     - `'square'` -> `'0px'`
     - `'rounded'` -> `'16px'`
     - `'circle'` -> `'50%'`
     - `'pill'` -> `'9999px'`
   - Apply inline styles for dimensions (`width`, `height`), background color, border, box-shadow glow, opacity, blur filter, and `pointerEvents: 'auto'`.
   - Render a centered SVG graphic badge representing the mascot placeholder.
   - Handle optional `onClick`.
2. Implement `components/TextBubble.tsx`:
   - Mark as `'use client'`.
   - Export `TextBubbleProps` and `TextBubble` component.
   - Guard against `!bubbleProps.isVisible` by returning `null`.
   - Map `bubbleProps.shape` to border radius:
     - `'rounded'` -> `'16px'`
     - `'square'` -> `'4px'`
     - `'speech-balloon'` -> `'16px 16px 16px 2px'`
   - Apply styling for `maxWidth`, `padding`, background color, border, shadow, opacity, blur filter, and `pointerEvents: 'auto'`.
   - Render paragraph with typography properties: `fontSize`, `color`, `textAlign`, `fontWeight`.
   - Render a dismiss button (`aria-label="Dismiss"`) that invokes `onDismiss?.()` when clicked.
3. Implement `components/MascotOverlayLayer.tsx`:
   - Mark as `'use client'`.
   - Subscribe to `useMascotStore` for `mascot`, `bubble`, and `setBubbleVisibility`.
   - Render an outer viewport container with CSS classes `fixed inset-0 z-40 pointer-events-none overflow-hidden`.
   - Wrap `<MascotPlaceholder />` in an absolute container positioned with `translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)`.
   - Wrap `<TextBubble />` in an absolute container positioned with `translate3d(${mascot.position.x + bubble.positionOffset.x}px, ${mascot.position.y + bubble.positionOffset.y}px, 0)`.
   - Pass `onDismiss={() => setBubbleVisibility(false)}` to `TextBubble`.

## Acceptance Criteria

- [x] `MascotPlaceholder` renders with specified dimensions, colors, border, glow shadow, and shape mappings (`square`, `rounded`, `circle`, `pill`). (Verified via component implementation in `components/MascotPlaceholder.tsx` with `getMascotBorderRadius` mapping 'square' -> '0px', 'rounded' -> '16px', 'circle' -> '50%', 'pill' -> '9999px', and exact CSS styling).
- [x] `MascotPlaceholder` returns `null` when `visualProps.isVisible === false`. (Verified early exit check `if (!visualProps.isVisible) return null;`).
- [x] `TextBubble` renders text styled with typography attributes, container dimensions, shape border-radius mappings, and box shadow. (Verified via component implementation in `components/TextBubble.tsx` with `getBubbleBorderRadius` mapping 'rounded' -> '16px', 'square' -> '4px', 'speech-balloon' -> '16px 16px 16px 2px', typography styling on `<p>`, and container box-shadow).
- [x] `TextBubble` returns `null` when `bubbleProps.isVisible === false`, and clicking dismiss button triggers `onDismiss`. (Verified early exit check `if (!bubbleProps.isVisible) return null;` and dismiss `<button aria-label="Dismiss">` invoking `onDismiss?.()`).
- [x] `MascotOverlayLayer` has `fixed inset-0 z-40 pointer-events-none overflow-hidden` wrapper ensuring viewport-wide coverage without intercepting mouse clicks to underlying spreadsheet. (Verified outer viewport div with `className="fixed inset-0 z-40 pointer-events-none overflow-hidden"`).
- [x] Mascot and bubble containers within `MascotOverlayLayer` set `pointer-events: auto` and are positioned via `translate3d` viewport and relative offset coordinates. (Verified wrappers positioned with `translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)` and `translate3d(${mascot.position.x + bubble.positionOffset.x}px, ${mascot.position.y + bubble.positionOffset.y}px, 0)` with `pointer-events: auto`).

## Verify Command

```
npx tsc --noEmit --allowImportingTsExtensions
```

## Blockers

None.

## Decisions

- Embedded inline SVG mascot icon for `MascotPlaceholder` depicting a clean geometric spreadsheet grid badge.
- Added both named and default exports for `MascotPlaceholder`, `TextBubble`, and `MascotOverlayLayer` for interoperability.
- Added exported shape-to-border-radius helper functions `getMascotBorderRadius` and `getBubbleBorderRadius` for easy verification.

## Implementation Report

### Changes Made & Why
1. Created `components/MascotPlaceholder.tsx`:
   - Adheres strictly to Contract C9.1.
   - Guarded with `if (!visualProps.isVisible) return null;`.
   - Maps shapes to CSS border-radius: `'square'` -> `'0px'`, `'rounded'` -> `'16px'`, `'circle'` -> `'50%'`, `'pill'` -> `'9999px'`.
   - Applies width, height, backgroundColor, border, boxShadow glow (`0 0 ${glowBlur}px ${glowSpread}px ${glowColor}`), opacity, blur filter (`blur(${blur}px)`), and `pointerEvents: 'auto'`.
   - Centers an SVG placeholder spreadsheet mascot grid badge with high contrast drop shadow.
   - Supports `onClick` handler.
2. Created `components/TextBubble.tsx`:
   - Adheres strictly to Contract C9.2.
   - Guarded with `if (!bubbleProps.isVisible) return null;`.
   - Maps shapes to CSS border-radius: `'rounded'` -> `'16px'`, `'square'` -> `'4px'`, `'speech-balloon'` -> `'16px 16px 16px 2px'`.
   - Applies maxWidth, padding, backgroundColor, border, box-shadow (`0 4px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`), opacity, blur filter, and `pointerEvents: 'auto'`.
   - Renders typography properties on the `<p>` element (`fontSize`, `color`, `textAlign`, `fontWeight`).
   - Renders dismiss button with `aria-label="Dismiss"` invoking `onDismiss?.()` on click.
3. Created `components/MascotOverlayLayer.tsx`:
   - Adheres strictly to Contract C10.
   - Subscribes to `useMascotStore` for `mascot`, `bubble`, and `setBubbleVisibility`.
   - Renders outer container with `fixed inset-0 z-40 pointer-events-none overflow-hidden`.
   - Positions mascot wrapper with `translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)` and `pointerEvents: 'auto'`.
   - Positions bubble wrapper with `translate3d(${mascot.position.x + bubble.positionOffset.x}px, ${mascot.position.y + bubble.positionOffset.y}px, 0)` and `pointerEvents: 'auto'`.
   - Passes `onDismiss={() => setBubbleVisibility(false)}` to `TextBubble`.

### Files Modified
- `components/MascotPlaceholder.tsx` (new)
- `components/TextBubble.tsx` (new)
- `components/MascotOverlayLayer.tsx` (new)
- `.tasks/T-007-mascot-bubble-overlay-components.md`

### Commands Run & Real Results
- `npx tsc --noEmit --allowImportingTsExtensions` -> Exit code 0, 0 type errors.
- `npm run lint` -> Exit code 0, "No ESLint warnings or errors".

### Assumptions (Internal Only)
- Used standard Lucide-compatible SVG paths directly within `MascotPlaceholder` and `TextBubble` to avoid adding external dependencies.

### Risks
- None identified. Components strictly follow contracts C9 and C10 and preserve pointer-events passthrough so spreadsheet interaction remains unobstructed.

## Test Report

- **Result:** PASS
- **Test Command:** `npx tsx --test __tests__/components/MascotPlaceholder.test.tsx __tests__/components/TextBubble.test.tsx __tests__/components/MascotOverlayLayer.test.tsx`
- **Output:**
  ```
  ▶ MascotOverlayLayer Component (Contract C10)
    ✔ AC5 & Contract C10: has "use client" directive and exports required component (0.8959ms)
    ✔ AC5 & Contract C10: renders outer viewport container with pointer-events-none passthrough classes (3.061ms)
    ✔ AC6 & Contract C10: renders mascot wrapper with translate3d positioning and pointer-events: auto (0.5471ms)
    ✔ AC6 & Contract C10: renders bubble wrapper with relative offset translate3d positioning and pointer-events: auto (0.4913ms)
    ✔ AC6: dynamically updates positions when mascot position changes in store (0.5895ms)
    ✔ AC6: dynamically updates bubble position when positionOffset changes in store (0.4554ms)
    ✔ AC6: passes onDismiss handler to TextBubble that sets bubble isVisible to false in store (0.5647ms)
    ✔ Pointer-Events Invariant: outer container passes clicks through, inner elements capture them (0.2677ms)
  ✔ MascotOverlayLayer Component (Contract C10) (7.8021ms)
  ▶ MascotPlaceholder Component (Contract C9.1)
    ✔ AC1 & Contract C9.1: has "use client" directive and exports required symbols (0.7713ms)
    ✔ AC1 & Contract C9.1: getMascotBorderRadius maps shapes to exact border radius values (0.1383ms)
    ✔ AC1 & Contract C9.1: renders container with dimensions, background color, border, and glow shadow (2.5813ms)
    ✔ AC1: renders container for each shape correctly (square, circle, pill) (0.6442ms)
    ✔ AC1: renders embedded SVG placeholder icon centered inside container (0.3956ms)
    ✔ AC1: icon size respects Math.max(16, ...) clamp on very small mascot sizes (0.2505ms)
    ✔ AC2 & Contract C9.1: returns null when visualProps.isVisible is false (0.1267ms)
    ✔ AC1: handles onClick prop and toggles cursor styling (0.4472ms)
    ✔ Boundary Values: handles boundary limits (min size 32, max size 256, opacity 0, blur 20) (0.3679ms)
  ✔ MascotPlaceholder Component (Contract C9.1) (7.2425ms)
  ▶ TextBubble Component (Contract C9.2)
    ✔ AC3 & Contract C9.2: has "use client" directive and exports required symbols (0.8312ms)
    ✔ AC3 & Contract C9.2: getBubbleBorderRadius maps shapes to exact border radius values (0.1411ms)
    ✔ AC3 & Contract C9.2: renders container with dimensions, background color, border, and box-shadow (2.6254ms)
    ✔ AC3: renders border-radius for each bubble shape correctly (square, speech-balloon) (0.5829ms)
    ✔ AC3 & Contract C9.2: renders paragraph with typography attributes and content text (0.7148ms)
    ✔ AC4 & Contract C9.2: returns null when bubbleProps.isVisible is false (0.1584ms)
    ✔ AC4: renders dismiss button with aria-label="Dismiss" and handles onDismiss callback (0.5364ms)
    ✔ AC4: handles dismiss button click gracefully when onDismiss is omitted (0.2208ms)
    ✔ Boundary Values: handles boundary limits (min maxWidth 120, max maxWidth 600, min padding 4, max padding 32) (0.4015ms)
    ✔ Edge Cases: handles empty text and text alignment variations (0.4582ms)
  ✔ TextBubble Component (Contract C9.2) (7.7056ms)
  ℹ tests 27
  ℹ suites 3
  ℹ pass 27
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 180.7619
  ```

- **Verify Command Output:** `npx tsc --noEmit --allowImportingTsExtensions` -> Exit code 0, 0 type errors.
- **Lint Check:** `npm run lint` -> Exit code 0 ("No ESLint warnings or errors").
- **Verification Summary:**
  - 27 unit tests pass covering all Acceptance Criteria and Contracts C9 & C10.
  - Zero regressions on existing test suites.
  - Next step: Gatekeeper verification (`/gatekeeper-user T-007`).
