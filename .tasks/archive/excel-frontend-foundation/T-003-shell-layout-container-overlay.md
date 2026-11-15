---
id: T-003
title: "Shell Layout + SpreadsheetContainer + OverlayLayer"
plan: "excel-frontend-foundation"
status: DONE
owner: coder-agent-user
blocked_type: ""
depends_on: [T-001, T-002]
parallel_group: "3"
deep_test: true
branch: feature/excel-frontend-foundation
---

# T-003: Shell Layout + SpreadsheetContainer + OverlayLayer

## Goal

Implement the structural shell and container presentation components: `ShellLayout` providing resizable sidebar/main panels (C4), `SpreadsheetContainer` applying opacity, blur, height transitions, and pointer-events (C3), and `OverlayLayer` rendering a semi-transparent overlay layer (C5).

## Contract

### C3: SpreadsheetContainer Component

File: `components/SpreadsheetContainer.tsx`

```
Props: children: ReactNode (SpreadsheetWrapper inside)
Reads: SpreadsheetDisplayState from store (opacity, blurAmount, isMinimized, isMaximized, isInteractive)
Applies to wrapper div:
  - style.opacity = state.opacity
  - style.filter = `blur(${state.blurAmount}px)`
  - CSS transition on opacity and filter (300ms ease)
  - height: isMinimized ? '48px' : isMaximized ? '100vh' : '100%'
  - overflow: hidden when minimized
  - pointer-events: isInteractive ? 'auto' : 'none'
When isMinimized: shows only a thin bar with "Spreadsheet (minimized)" label + expand button
```

### C4: ShellLayout Component

File: `components/ShellLayout.tsx`

```
Props: sidebar: ReactNode, main: ReactNode
Uses: react-resizable-panels (PanelGroup, Panel, PanelResizeHandle)
Layout: horizontal PanelGroup
  - Left Panel: sidebar (defaultSize=25, minSize=15, collapsible)
  - ResizeHandle: 4px vertical divider
  - Right Panel: main (defaultSize=75, minSize=40)
Full height: h-screen
No state dependency — purely presentational layout
```

### C5: OverlayLayer Component

File: `components/OverlayLayer.tsx`

```
Props: children?: ReactNode
Reads: isOverlayVisible, toggleOverlay from store
Render (when visible):
  - absolute-positioned div, inset-0, z-30
  - bg-black/40 (semi-transparent black)
  - children centered inside (placeholder text if no children: "Overlay Active — Lesson content will appear here")
  - click outside children → toggleOverlay()
Render (when hidden): null
```

## Files to Modify

### files_to_modify
- components/ShellLayout.tsx
- components/SpreadsheetContainer.tsx
- components/OverlayLayer.tsx

### context_files
- store/spreadsheetStore.ts
- docs/contracts/excel-frontend-foundation.md
- docs/ARCHITECTURE.md
- package.json

### test_files
- __tests__/components/ShellLayout.test.tsx
- __tests__/components/SpreadsheetContainer.test.tsx
- __tests__/components/OverlayLayer.test.tsx

## Out of Scope

- Modifying `SpreadsheetWrapper.tsx` or `store/spreadsheetStore.ts` (handled in T-002).
- Implementing `SpreadsheetControls.tsx` or `app/page.tsx` (handled in T-004).
- Creating or editing test files (reserved for tester-user).

## Requirements

1. Implement `components/ShellLayout.tsx` (`'use client'`):
   - Props interface: `{ sidebar: React.ReactNode; main: React.ReactNode }`.
   - Use `PanelGroup`, `Panel`, `PanelResizeHandle` from `react-resizable-panels`.
   - Outer container / PanelGroup height `h-screen` and direction `horizontal`.
   - Left Panel: `defaultSize={25}`, `minSize={15}`, `collapsible`.
   - `PanelResizeHandle`: 4px vertical divider (`w-1 bg-gray-300 hover:bg-blue-400 transition-colors`).
   - Right Panel: `defaultSize={75}`, `minSize={40}`.
2. Implement `components/SpreadsheetContainer.tsx` (`'use client'`):
   - Props interface: `{ children: React.ReactNode }`.
   - Subscribe to `useSpreadsheetStore` for `opacity`, `blurAmount`, `isMinimized`, `isMaximized`, `isInteractive`, and `toggleMinimize`.
   - If `isMinimized` is true, render a collapsed bar with text "Spreadsheet (minimized)" and an expand button that calls `toggleMinimize()`.
   - Apply dynamic styles to container div:
     - `opacity: opacity`
     - `filter: blur(${blurAmount}px)`
     - `transition: opacity 300ms ease, filter 300ms ease, height 300ms ease`
     - `height`: `isMinimized ? '48px' : isMaximized ? '100vh' : '100%'`
     - `overflow`: `isMinimized ? 'hidden' : 'visible'`
     - `pointerEvents`: `isInteractive ? 'auto' : 'none'`
3. Implement `components/OverlayLayer.tsx` (`'use client'`):
   - Props interface: `{ children?: React.ReactNode }`.
   - Read `isOverlayVisible` and `toggleOverlay` from `useSpreadsheetStore`.
   - If `!isOverlayVisible`, render `null`.
   - When visible, render an overlay backdrop with classes `absolute inset-0 z-30 bg-black/40 flex items-center justify-center`.
   - Handle backdrop click to trigger `toggleOverlay()`; ensure clicks on child content do not trigger backdrop click (use `e.stopPropagation()`).
   - If no `children` provided, render default fallback: `<p className="text-white text-lg">Overlay Active — Lesson content will appear here</p>`.
4. Ensure `npm run build` succeeds without type errors.

## Acceptance Criteria

- [x] `components/ShellLayout.tsx` renders horizontal resizable panels using `react-resizable-panels` with left sidebar and right main pane.
- [x] `components/SpreadsheetContainer.tsx` dynamically sets `opacity`, `filter: blur()`, `height`, and `pointer-events` based on Zustand store.
- [x] When `isMinimized` is true, `SpreadsheetContainer` renders the minimized bar with an expand button.
- [x] `components/OverlayLayer.tsx` returns `null` when `isOverlayVisible` is false.
- [x] `components/OverlayLayer.tsx` renders backdrop (`absolute inset-0 z-30 bg-black/40`) when active and triggers `toggleOverlay()` on backdrop click.
- [x] `npm run build` succeeds with exit code 0.

## Verify Command

```bash
npm run build
```

## Blockers

None.

## Decisions

None.

## Implementation Report

### Changes
1. **`components/ShellLayout.tsx`**:
   - Implemented client component using `react-resizable-panels` (`PanelGroup`, `Panel`, `PanelResizeHandle`).
   - Configured horizontal split layout with `h-screen`.
   - Left Panel for sidebar (`defaultSize={25}`, `minSize={15}`, `collapsible`).
   - Resizer divider handle with `w-1 bg-gray-300 hover:bg-blue-400 transition-colors cursor-col-resize`.
   - Right Panel for main pane (`defaultSize={75}`, `minSize={40}`).

2. **`components/SpreadsheetContainer.tsx`**:
   - Implemented client component subscribing to `useSpreadsheetStore` (`opacity`, `blurAmount`, `isMinimized`, `isMaximized`, `isInteractive`, `toggleMinimize`).
   - Implemented dynamic inline styles: `opacity`, `filter: blur(${blurAmount}px)`, `transition: opacity 300ms ease, filter 300ms ease, height 300ms ease`, `height: isMinimized ? '48px' : isMaximized ? '100vh' : '100%'`, `overflow: isMinimized ? 'hidden' : 'visible'`, and `pointerEvents: isInteractive ? 'auto' : 'none'`.
   - When `isMinimized` is true, renders collapsed bar containing "Spreadsheet (minimized)" label and an Expand button calling `toggleMinimize()` with `pointer-events: auto`.
   - When not minimized, renders `children`.

3. **`components/OverlayLayer.tsx`**:
   - Implemented client component reading `isOverlayVisible` and `toggleOverlay` from `useSpreadsheetStore`.
   - Returns `null` if `!isOverlayVisible`.
   - When visible, renders semi-transparent backdrop with `absolute inset-0 z-30 bg-black/40 flex items-center justify-center`.
   - Backdrop click calls `toggleOverlay()`; child container stops click propagation via `e.stopPropagation()`.
   - Renders fallback `<p className="text-white text-lg font-medium">Overlay Active — Lesson content will appear here</p>` when no children are provided.

### Files Modified
- `components/ShellLayout.tsx` (created)
- `components/SpreadsheetContainer.tsx` (created)
- `components/OverlayLayer.tsx` (created)

### Commands Run
- `npm run build` -> Exit code 0, successfully compiled static pages without type or lint errors.

## Test Report

### Gate Log
- **Status:** PASS
- **Commit:** `c1b4440c78638ecf8e06b3f9b75c7cfc45131cbd`
- **Gate 1 (Scope):** PASS. Only files in `files_to_modify` and `test_files` created.
- **Gate 2 (No new dependencies):** PASS. Manifests and locks untouched.
- **Gate 3 (Verification reports):** PASS. Test Report shows 10/10 new component tests + 15/15 store regression tests passing, `npm run build` exit code 0.
- **Gate 4 (Acceptance criteria):** PASS. All 6 acceptance criteria verified.
- **Gate 5 (Hygiene):** PASS. Clean TypeScript/TSX, no secrets or debug prints.
- **Gate 6 (Architecture):** PASS. Respects `docs/ARCHITECTURE.md` boundaries.
- **Gate 7 (Assumptions):** PASS. No contract assumptions.

- **Result:** PASS
- **Test Files:**
  - `__tests__/components/ShellLayout.test.tsx`
  - `__tests__/components/SpreadsheetContainer.test.tsx`
  - `__tests__/components/OverlayLayer.test.tsx`

### Execution Details:
1. `npx sucrase-node "__tests__/components/ShellLayout.test.tsx"`:
   - AC1 & Contract C4: Verified `'use client'` directive, `PanelGroup` (`direction="horizontal"`, `h-screen`), left `Panel` (`defaultSize={25}`, `minSize={15}`, `collapsible`), `PanelResizeHandle` (`w-1`), right `Panel` (`defaultSize={75}`, `minSize={40}`), and no store dependency.
   - **Result:** 3/3 tests passed (0 failures).

2. `npx sucrase-node "__tests__/components/SpreadsheetContainer.test.tsx"`:
   - AC2 & Contract C3: Verified SSR default rendering (`opacity:1`, `filter:blur(0px)`, `height:100%`, `overflow:visible`, `pointer-events:auto`, `300ms ease` transition), store subscriptions (`opacity`, `blurAmount`, `isMinimized`, `isMaximized`, `isInteractive`), and height/overflow mappings (`48px` / `100vh` / `100%`).
   - AC3: Verified minimized bar (`"Spreadsheet (minimized)"`, `Expand` button wired to `toggleMinimize`, `pointerEvents: 'auto'`).
   - **Result:** 4/4 tests passed (0 failures).

3. `npx sucrase-node "__tests__/components/OverlayLayer.test.tsx"`:
   - AC4: Verified `renderToStaticMarkup` returns empty string (`null`) when `isOverlayVisible` is `false`.
   - AC5 & Contract C5: Verified backdrop classes (`absolute inset-0 z-30 bg-black/40 flex items-center justify-center`), fallback text (`"Overlay Active — Lesson content will appear here"`), backdrop `onClick={toggleOverlay}`, child `e.stopPropagation()`, and store toggle transitions.
   - **Result:** 3/3 tests passed (0 failures).

4. Regression & Build:
   - `npx sucrase-node "__tests__/store/spreadsheetStore.test.ts"`: 15/15 tests passed (0 failures).
   - `npm run build`: Exit code 0 (`✓ Compiled successfully in 3.0s`, static pages generated).
