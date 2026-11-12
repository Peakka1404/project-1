# Contracts: excel-frontend-foundation

This document defines the contracts between modules for the Excel Teaching Platform Phase 1 Frontend Foundation.

## C1: SpreadsheetDisplayState (Zustand Store)

**File:** `store/spreadsheetStore.ts`

```typescript
interface SpreadsheetDisplayState {
  // State
  opacity: number;            // 0.0–1.0, default 1.0
  blurAmount: number;         // 0–20 px, default 0
  isMinimized: boolean;       // default false
  isMaximized: boolean;       // default false
  isInteractive: boolean;     // default true
  isOverlayVisible: boolean;  // default false

  // Actions
  setOpacity:        (v: number) => void;
  setBlurAmount:     (v: number) => void;
  toggleMinimize:    () => void;
  toggleMaximize:    () => void;
  setInteractive:    (v: boolean) => void;
  toggleOverlay:     () => void;
  resetDisplay:      () => void;
}
```

### Invariants

1. `isMinimized` and `isMaximized` are mutually exclusive. `toggleMinimize()` clears `isMaximized`; `toggleMaximize()` clears `isMinimized`.
2. When `blurAmount > 0` or `opacity < 1.0`, `isInteractive` is automatically set to `false`.
3. When both `blurAmount === 0` and `opacity === 1.0`, `isInteractive` is restored to `true` (unless explicitly set to `false`).
4. `setOpacity` clamps input to `[0, 1]`. `setBlurAmount` clamps input to `[0, 20]`.
5. `resetDisplay()` restores: `opacity=1, blurAmount=0, isMinimized=false, isMaximized=false, isInteractive=true, isOverlayVisible=false`.

## C2: SpreadsheetWrapper Component

**File:** `components/SpreadsheetWrapper.tsx`

- **Props:** none
- **Store dependency:** reads `SpreadsheetDisplayState` (no writes)
- **Lifecycle:**
  - `useEffect` on mount: create `Univer` instance, register plugins (`UniverSheets`, `UniverSheetsUI`, `UniverSheetsFormula`, `UniverUI`), create a default workbook
  - `useEffect` cleanup on unmount: call `univer.dispose()`
- **Render:** `<div ref={containerRef} style={{ width: '100%', height: '100%' }} />`
- **SSR:** MUST be imported via `next/dynamic(() => import('./SpreadsheetWrapper'), { ssr: false })`
- **Error handling:** if Univer fails to init, render `<div className="error">Spreadsheet failed to load</div>`

## C3: SpreadsheetContainer Component

**File:** `components/SpreadsheetContainer.tsx`

- **Props:** `children: ReactNode`
- **Store dependency:** reads `opacity`, `blurAmount`, `isMinimized`, `isMaximized`, `isInteractive` from store
- **Render:** wraps children in a `<div>` with:
  - `style.opacity` = store.opacity
  - `style.filter` = `blur(${store.blurAmount}px)`
  - `style.transition` = `opacity 300ms ease, filter 300ms ease, height 300ms ease`
  - `style.height` = minimized: `48px` | maximized: `100vh` | normal: `100%`
  - `style.overflow` = minimized: `hidden` | else: `visible`
  - `style.pointerEvents` = interactive: `auto` | else: `none`
- **Minimized state:** shows a collapsed bar with label "Spreadsheet (minimized)" and an expand button
- **No pointer-events overlay needed** — `pointer-events: none` on the wrapper itself blocks all interaction

## C4: ShellLayout Component

**File:** `components/ShellLayout.tsx`

- **Props:** `sidebar: ReactNode`, `main: ReactNode`
- **Library:** `react-resizable-panels`
- **Layout:**
  ```
  <PanelGroup direction="horizontal">
    <Panel defaultSize={25} minSize={15} collapsible>
      {sidebar}
    </Panel>
    <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-400 transition-colors" />
    <Panel defaultSize={75} minSize={40}>
      {main}
    </Panel>
  </PanelGroup>
  ```
- **Height:** `h-screen` on the PanelGroup
- **No state dependency** — purely presentational layout

## C5: OverlayLayer Component

**File:** `components/OverlayLayer.tsx`

- **Props:** `children?: ReactNode`
- **Store dependency:** reads `isOverlayVisible`, writes `toggleOverlay`
- **Render (visible):**
  - `position: absolute`, `inset: 0`, `z-index: 30`
  - `background: rgba(0,0,0,0.4)` (semi-transparent)
  - children centered with flexbox
  - if no children: render placeholder text "Overlay Active — Lesson content will appear here"
  - clicking the backdrop (not children) calls `toggleOverlay()`
- **Render (hidden):** `null`

## C6: SpreadsheetControls Component

**File:** `components/SpreadsheetControls.tsx`

- **Props:** none
- **Store dependency:** reads/writes all `SpreadsheetDisplayState` fields
- **Render:** horizontal toolbar (`flex gap-4 items-center p-2 bg-gray-100 border-b`)
- **Controls:**
  | Control | Type | Maps to |
  |---------|------|---------|
  | Opacity | range slider (0–100) | `setOpacity(v / 100)` |
  | Blur | range slider (0–20) | `setBlurAmount(v)` |
  | Minimize | toggle button | `toggleMinimize()` |
  | Maximize | toggle button | `toggleMaximize()` |
  | Overlay | toggle button | `toggleOverlay()` |
  | Reset | button | `resetDisplay()` |
- **Visual feedback:** active toggles show highlighted state (e.g. `bg-blue-500 text-white`)

## Component Composition (Page Level)

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
