---
id: T-004
title: "SpreadsheetControls + Demo Page Integration"
plan: "excel-frontend-foundation"
status: DONE
owner: coder-agent-user
blocked_type: ""
depends_on: [T-002, T-003]
parallel_group: "4"
deep_test: true
branch: feature/excel-frontend-foundation
---

# T-004: SpreadsheetControls + Demo Page Integration

## Goal

Implement the `SpreadsheetControls` toolbar component (C6) and compose the full demo page in `app/page.tsx`, bringing together `ShellLayout`, sidebar placeholder, controls, `SpreadsheetContainer`, dynamically imported `SpreadsheetWrapper`, and `OverlayLayer`.

## Contract

### C6: SpreadsheetControls Component

File: `components/SpreadsheetControls.tsx`

```
Props: none
Reads/Writes: SpreadsheetDisplayState from store
Render: horizontal toolbar (flex gap-4 items-center p-2 bg-gray-100 border-b)
Controls:
  | Control | Type | Maps to |
  |---------|------|---------|
  | Opacity | range slider (0–100) | setOpacity(v / 100) |
  | Blur | range slider (0–20) | setBlurAmount(v) |
  | Minimize | toggle button | toggleMinimize() |
  | Maximize | toggle button | toggleMaximize() |
  | Overlay | toggle button | toggleOverlay() |
  | Reset | button | resetDisplay() |
Visual feedback: active toggles show highlighted state (e.g. bg-blue-500 text-white)
```

### Component Composition (Page Level)

```
app/page.tsx
└── ShellLayout
    ├── sidebar: <div className="p-4">Lesson sidebar placeholder</div>
    └── main:
        ├── SpreadsheetControls
        └── <div className="relative flex-1">  <!-- relative container for overlay positioning -->
            ├── SpreadsheetContainer
            │   └── SpreadsheetWrapper (dynamic import, ssr: false)
            └── OverlayLayer
```

## Files to Modify

### files_to_modify
- components/SpreadsheetControls.tsx
- app/page.tsx

### context_files
- components/ShellLayout.tsx
- components/SpreadsheetContainer.tsx
- components/SpreadsheetWrapper.tsx
- components/OverlayLayer.tsx
- store/spreadsheetStore.ts
- docs/contracts/excel-frontend-foundation.md
- docs/ARCHITECTURE.md

### test_files
- __tests__/components/SpreadsheetControls.test.tsx
- __tests__/app/page.test.tsx

## Out of Scope

- Lesson content, curricula, or video players (future phases).
- Mascot or chat assistant panels (future phases).
- Backend / API persistence.
- Creating or editing test files (reserved for tester-user).

## Requirements

1. Implement `components/SpreadsheetControls.tsx` (`'use client'`):
   - Subscribe to and interact with `useSpreadsheetStore`:
     - `opacity`, `setOpacity`
     - `blurAmount`, `setBlurAmount`
     - `isMinimized`, `toggleMinimize`
     - `isMaximized`, `toggleMaximize`
     - `isOverlayVisible`, `toggleOverlay`
     - `resetDisplay`
   - Render toolbar with `flex flex-wrap items-center gap-4 p-2 bg-gray-100 border-b text-sm`:
     - Opacity slider with label and readout (input range `min="0"` `max="100"` `value={Math.round(opacity * 100)}` `onChange={(e) => setOpacity(Number(e.target.value) / 100)}`).
     - Blur slider with label and readout (input range `min="0"` `max="20"` `value={blurAmount}` `onChange={(e) => setBlurAmount(Number(e.target.value))}`).
     - Minimize button: toggles minimize. Active styling when `isMinimized` is true (e.g. `bg-blue-600 text-white`).
     - Maximize button: toggles maximize. Active styling when `isMaximized` is true.
     - Overlay button: toggles overlay. Active styling when `isOverlayVisible` is true.
     - Reset button: calls `resetDisplay()`.
2. Implement `app/page.tsx` (`'use client'`):
   - Dynamically import `SpreadsheetWrapper` via `next/dynamic(() => import('@/components/SpreadsheetWrapper'), { ssr: false })` (or relative path `./components/SpreadsheetWrapper`).
   - Import `ShellLayout`, `SpreadsheetControls`, `SpreadsheetContainer`, `OverlayLayer`.
   - Pass sidebar JSX: `<div className="h-full p-4 bg-gray-50 border-r"><h2 className="font-semibold text-gray-700">Lesson Outline</h2><p className="text-sm text-gray-500 mt-2">Lesson sidebar placeholder</p></div>`.
   - Pass main JSX:
     - Outer flex column `h-full flex flex-col`.
     - `SpreadsheetControls` at top.
     - Relative container `relative flex-1 overflow-hidden` containing `SpreadsheetContainer` (which wraps dynamically loaded `SpreadsheetWrapper`) and `OverlayLayer`.
3. Verify that `npm run build` succeeds without type errors.

## Acceptance Criteria

- [x] `components/SpreadsheetControls.tsx` renders opacity slider, blur slider, minimize button, maximize button, overlay toggle, and reset button.
- [x] Active toggle states are visibly highlighted on the control buttons.
- [x] Controls call the corresponding `useSpreadsheetStore` actions on change or click.
- [x] `app/page.tsx` composes `ShellLayout` with sidebar placeholder and main container.
- [x] `SpreadsheetWrapper` is dynamically loaded with `{ ssr: false }`.
- [x] `SpreadsheetContainer` and `OverlayLayer` are co-located in the main area relative container.
- [x] `npm run build` succeeds with exit code 0.

## Verify Command

```bash
npm run build
```

## Blockers

<!-- AGENT-WRITTEN: filled by the coder when blocked -->

## Decisions

<!-- AGENT-WRITTEN: filled by the architect when unblocking -->

## Implementation Report

### Summary
Implemented the `SpreadsheetControls` toolbar component and composed the full demo page in `app/page.tsx` integrating `ShellLayout`, sidebar placeholder, `SpreadsheetControls`, `SpreadsheetContainer`, dynamically loaded `SpreadsheetWrapper` (`ssr: false`), and `OverlayLayer`.

### Files Modified
- `components/SpreadsheetControls.tsx`: Created client component providing controls for opacity slider (0–100%), blur slider (0–20px), minimize toggle button, maximize toggle button, overlay toggle button, and reset button, bound to `useSpreadsheetStore` with visual highlighting for active toggle states.
- `app/page.tsx`: Composed page layout with `ShellLayout`, sidebar outline placeholder, top `SpreadsheetControls`, and main area relative container hosting `SpreadsheetContainer` (wrapping dynamically imported `SpreadsheetWrapper`) and `OverlayLayer`.

### Verification
- Executed `npm run build` (`next build`):
  ```
  ✓ Compiled successfully in 7.4s
  Linting and checking validity of types ...
  Collecting page data ...
  Generating static pages (4/4)
  Finalizing page optimization ...
  Collecting build traces ...
  Route (app)                                 Size  First Load JS
  ┌ ○ /                                    11.8 kB         115 kB
  └ ○ /_not-found                            993 B         104 kB
  ```
  Exit code: 0.

### Assumptions
- Sliders provide accessible `aria-label` attributes (`Opacity`, `Blur`) and labeled percent/pixel readouts for UI clarity.

### Risks
- None.

## Test Report

### Gate Log
- **Status:** PASS
- **Commit:** `70692c15ff097718aad759b2633e4feccc3647a3`
- **Gate 1 (Scope):** PASS. Only files in `files_to_modify` and `test_files` modified/created.
- **Gate 2 (No new dependencies):** PASS. Manifests and locks untouched.
- **Gate 3 (Verification reports):** PASS. Test Report shows 6/6 new tests passing and `npm run build` exit code 0.
- **Gate 4 (Acceptance criteria):** PASS. All 7 acceptance criteria verified.
- **Gate 5 (Hygiene):** PASS. Clean TypeScript/TSX, no secrets or debug prints.
- **Gate 6 (Architecture):** PASS. Conforms to `docs/ARCHITECTURE.md` and C6/page composition.
- **Gate 7 (Assumptions):** PASS. Internal-only accessibility attributes noted.

- **Result:** PASS
- **Test Files:**
  - `__tests__/components/SpreadsheetControls.test.tsx`
  - `__tests__/app/page.test.tsx`

### Execution Details:
1. `npx sucrase-node "__tests__/components/SpreadsheetControls.test.tsx"`:
   - AC1 & Contract C6: Verified rendering of opacity slider (`0–100`), blur slider (`0–20`), `Minimize`, `Maximize`, `Overlay`, and `Reset` buttons with toolbar classes.
   - AC2: Verified active state highlight (`bg-blue-600 text-white`) for `isMinimized`, `isMaximized`, and `isOverlayVisible`.
   - AC3: Verified bindings to `setOpacity(v / 100)`, `setBlurAmount(v)`, `toggleMinimize`, `toggleMaximize`, `toggleOverlay`, and `resetDisplay`.
   - **Result:** 3/3 tests passed (0 failures).

2. `npx sucrase-node "__tests__/app/page.test.tsx"`:
   - AC4: Verified `HomePage` renders `ShellLayout` horizontal panels, sidebar placeholder (`Lesson Outline`, `Lesson sidebar placeholder`), `SpreadsheetControls`, and `relative flex-1 overflow-hidden` container.
   - AC5: Verified `next/dynamic` import of `SpreadsheetWrapper` with `{ ssr: false }`.
   - AC6: Verified co-location of `SpreadsheetContainer` (wrapping `SpreadsheetWrapper`) and `OverlayLayer` inside the relative container.
   - **Result:** 3/3 tests passed (0 failures).

3. `npm run build`:
   - Exit code 0 (`✓ Compiled successfully in 2.1s`, static pages generated).
