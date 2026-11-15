---
plan: excel-frontend-foundation
roadmap: none
status: APPROVED
---

# Excel Teaching Platform – Phase 1: Frontend Foundation

## Goal

Bootstrap a Next.js frontend with an embedded Univer spreadsheet whose entire UI (toolbar, formula bar, grid) lives inside a controllable container. The container supports blur, opacity, minimize/maximize, resize, and overlay — making the spreadsheet act as a "background layer" that future phases can dim or cover with lesson content. A placeholder sidebar is included for lesson panels added later.

**User-visible outcome:** A single page (`/`) showing a fully functional Univer spreadsheet with a control bar that can blur, minimize, maximize, and overlay the spreadsheet area, plus a resizable sidebar placeholder.

## Decisions

| # | Topic | Decision | Reason |
|---|-------|----------|--------|
| D1 | Next.js router | **App Router (Next.js 15)** — Accepted | Standard for new projects; user confirmed in earlier conversation. |
| D2 | Canvas blur | **CSS `filter: blur()` + `opacity` on wrapper div** — Accepted | CSS filters work on elements containing canvas. Add `pointer-events: none` div on top when blurred to block interaction. No transparent-div-only approach needed. |
| D3 | Resize library | **`react-resizable-panels`** — Accepted | Handles the sidebar ↔ spreadsheet split naturally. Minimize/maximize of the spreadsheet is handled by Zustand state + CSS transitions (collapse/expand the container height), not a second resize library. |
| D4 | Sidebar position | **Left sidebar (lesson content), right spreadsheet** — Accepted | Follows "read-left, do-right" pattern standard in tutorial UIs (Codecademy, freeCodeCamp). |
| D5 | ARCHITECTURE.md | **Created inside W1 (scaffold)** — Accepted | Must exist before any other ticket runs, so it belongs in the foundational ticket. |
| D6 | `.eslintrc` / `.prettierrc` | **Cut** — these come free with `create-next-app` defaults | Not a separate work item. The scaffold step uses `create-next-app` which generates lint config. No custom `.prettierrc` in phase 1. |
| D7 | SSR handling | **`next/dynamic` with `{ ssr: false }`** — Accepted | Standard pattern, sufficient for Univer. The wrapper component itself is `'use client'`. |
| D8 | Univer license | **Apache 2.0 — no issue** — Confirmed | No action required. |
| D9 | Univer version | **Pin exact version in `package.json`** — Accepted | API is evolving; pinning avoids silent breakage on `npm install`. |

## Contracts

All contracts are defined in [`docs/contracts/excel-frontend-foundation.md`](file:///c:/Users/Admin/Downloads/project%201/docs/contracts/excel-frontend-foundation.md) (created by W1).

### C1: `SpreadsheetDisplayState` (Zustand store)

```typescript
interface SpreadsheetDisplayState {
  // State
  opacity: number;            // 0.0–1.0, default 1.0
  blurAmount: number;         // 0–20 px, default 0
  isMinimized: boolean;       // default false — collapses spreadsheet height
  isMaximized: boolean;       // default false — spreadsheet fills full viewport
  isInteractive: boolean;     // default true — when false, pointer-events: none on spreadsheet
  isOverlayVisible: boolean;  // default false — shows overlay layer on top

  // Actions
  setOpacity:        (v: number) => void;   // clamps to [0, 1]
  setBlurAmount:     (v: number) => void;   // clamps to [0, 20]
  toggleMinimize:    () => void;            // sets isMinimized = !isMinimized; clears isMaximized
  toggleMaximize:    () => void;            // sets isMaximized = !isMaximized; clears isMinimized
  setInteractive:    (v: boolean) => void;
  toggleOverlay:     () => void;
  resetDisplay:      () => void;            // all defaults
}
```

**Invariants:**
- `isMinimized` and `isMaximized` are mutually exclusive.
- When `blurAmount > 0` or `opacity < 1.0`, `isInteractive` is automatically set to `false`.
- `resetDisplay()` restores all fields to defaults listed above.

### C2: `SpreadsheetWrapper` component

```
Props: none (self-contained)
Reads: SpreadsheetDisplayState from Zustand store
Lifecycle:
  - mount  → create Univer instance, register Sheet plugin, SheetUI plugin, UI plugin
  - unmount → call univer.dispose()
Render: <div ref={containerRef}> where Univer mounts its DOM
SSR: MUST be imported via next/dynamic({ ssr: false })
Errors: if Univer fails to initialize → render fallback text "Spreadsheet failed to load"
```

### C3: `SpreadsheetContainer` component (display control wrapper)

```
Props: children: ReactNode (SpreadsheetWrapper inside)
Reads: SpreadsheetDisplayState from store
Applies to wrapper div:
  - style.opacity = state.opacity
  - style.filter = `blur(${state.blurAmount}px)`
  - CSS transition on opacity and filter (300ms ease)
  - height: isMinimized ? '48px' : isMaximized ? '100vh' : '100%'
  - overflow: hidden when minimized
  - pointer-events: isInteractive ? 'auto' : 'none'
When isMinimized: shows only a thin bar with "Spreadsheet (minimized)" label + expand button
```

### C4: `ShellLayout` component

```
Props: sidebar: ReactNode, main: ReactNode
Uses: react-resizable-panels (PanelGroup, Panel, PanelResizeHandle)
Layout: horizontal PanelGroup
  - Left Panel: sidebar (defaultSize=25, minSize=15, collapsible)
  - ResizeHandle: 4px vertical divider
  - Right Panel: main (defaultSize=75, minSize=40)
Full height: h-screen
```

### C5: `OverlayLayer` component

```
Props: children?: ReactNode
Reads: isOverlayVisible from store
Render (when visible):
  - absolute-positioned div, inset-0, z-30
  - bg-black/40 (semi-transparent black)
  - children centered inside (placeholder text if no children)
  - click outside children → toggleOverlay()
Render (when hidden): null
```

### C6: `SpreadsheetControls` component

```
Props: none
Reads/Writes: SpreadsheetDisplayState from store
Renders: horizontal toolbar above the spreadsheet area
Controls:
  - Opacity slider (range 0–100, maps to 0.0–1.0)
  - Blur slider (range 0–20)
  - Minimize button (toggle)
  - Maximize button (toggle)
  - Overlay toggle button
  - Reset button
```

## Work Items

### W1: Project Scaffold + ARCHITECTURE.md

**Goal:** Create the Next.js 15 project from scratch with all dependencies installed, folder structure established, and `docs/ARCHITECTURE.md` + `docs/contracts/excel-frontend-foundation.md` written.

**Modules/files:**
- `package.json` (create via `create-next-app`, then add: `zustand`, `@univerjs/core`, `@univerjs/sheets`, `@univerjs/sheets-formula`, `@univerjs/sheets-ui`, `@univerjs/ui`, `@univerjs/engine-render`, `@univerjs/engine-formula`, `@univerjs/design`, `react-resizable-panels`)
- `next.config.ts` (Univer transpile config if needed)
- `tailwind.config.ts`
- `tsconfig.json`
- `app/layout.tsx` (root layout with global CSS)
- `app/globals.css` (Tailwind directives + Univer CSS imports)
- `docs/ARCHITECTURE.md`
- `docs/contracts/excel-frontend-foundation.md`

**Contract:** Establishes the project structure and documentation. All subsequent work items depend on this.
**depends_on:** none
**deep_test:** false — scaffold, no logic to test. Verification: `npm run build` succeeds.
**What could break:** Wrong Univer package versions, missing peer dependencies, Univer CSS not loading.

### W2: Zustand Store + SpreadsheetWrapper

**Goal:** Implement the `SpreadsheetDisplayState` Zustand store (C1) and the `SpreadsheetWrapper` component (C2) that initializes Univer and renders a working spreadsheet.

**Modules/files:**
- `store/spreadsheetStore.ts` (C1)
- `components/SpreadsheetWrapper.tsx` (C2)

**Contract:** Implements C1 and C2. The store must enforce the mutual-exclusion invariant (minimize vs maximize) and the auto-disable-interaction invariant.
**depends_on:** W1
**deep_test:** true — Core integration: Univer lifecycle (mount/dispose), store invariants, SSR-safety. If this breaks, everything else breaks.
**What could break:** Univer SSR error, Univer dispose not cleaning up DOM, hydration mismatch, store invariants not enforced.

### W3: Shell Layout + SpreadsheetContainer + OverlayLayer

**Goal:** Implement the shell layout (C4), the display-control wrapper (C3), and the overlay layer (C5).

**Modules/files:**
- `components/ShellLayout.tsx` (C4)
- `components/SpreadsheetContainer.tsx` (C3)
- `components/OverlayLayer.tsx` (C5)

**Contract:** Implements C3, C4, C5. ShellLayout uses `react-resizable-panels`. SpreadsheetContainer reads store state and applies CSS. OverlayLayer renders conditionally.
**depends_on:** W1, W2 (needs store types)
**deep_test:** true — Visual behavior, CSS transitions, resize interactions, overlay z-index stacking. Needs manual/visual verification that blur works on canvas.
**What could break:** CSS `filter: blur()` on canvas rendering incorrectly, `react-resizable-panels` conflicting with Univer's own resize observers, overlay not covering full spreadsheet area.

### W4: SpreadsheetControls + Demo Page Integration

**Goal:** Implement the control toolbar (C6) and wire everything together on the `/` page.

**Modules/files:**
- `components/SpreadsheetControls.tsx` (C6)
- `app/page.tsx` (integration page)

**Contract:** Implements C6. The page composes: `ShellLayout` → left: placeholder sidebar div, right: `SpreadsheetControls` + `SpreadsheetContainer` → `SpreadsheetWrapper` + `OverlayLayer`.
**depends_on:** W2, W3
**deep_test:** true — Full integration: every control must visibly affect the spreadsheet. This is the user's acceptance test surface.
**What could break:** Controls not wired to store correctly, visual regressions when multiple controls are active simultaneously (e.g. blurred + minimized).

## Out of Scope

- Lesson content (text, video, images) — future phase.
- Mascot — future phase.
- Authentication, user accounts, progress tracking.
- Backend / API / database.
- `.xlsx` file import/export.
- Mobile responsive layout.
- Internationalization (i18n).
- Univer formula validation or cell-locking for teaching purposes — future phase.

## Open Risks

1. **Univer bundle size:** Univer pulls many sub-packages. Monitor First Load JS. Mitigation: `next/dynamic` with `{ ssr: false }` already code-splits it out of the initial bundle.
2. **Canvas blur cross-browser:** CSS `filter: blur()` on a div containing a canvas works in Chrome/Firefox/Edge but behavior on Safari should be tested. Mitigation: W3 deep_test includes visual verification.
3. **Univer API changes:** Pin exact versions in `package.json` (e.g. `"@univerjs/core": "0.5.x"`). Do not use `^` or `~`.
4. **`react-resizable-panels` + Univer resize conflict:** Univer listens to container resize events. When panels resize, Univer must recalculate. Mitigation: test in W3; if needed, call `univer.getActiveSpreadsheet().refreshCanvas()` on panel resize.

## Tickets

- T-001 -> W1
- T-002 -> W2
- T-003 -> W3
- T-004 -> W4
