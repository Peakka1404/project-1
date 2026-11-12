# Excel Teaching Platform – Architecture Documentation

## 1. System Overview & Technology Stack

The Excel Teaching Platform provides an interactive browser-based environment where learners interact with real spreadsheet mechanics alongside educational lessons. The frontend is architected to host a full spreadsheet engine inside a controllable container that can be dynamically dimmed, blurred, resized, or covered by interactive lesson content overlays.

### Core Technology Stack
- **Framework:** Next.js 15 (App Router, React 18/19 compatible)
- **Language:** TypeScript 5.x (strict type checking enabled)
- **Styling:** Tailwind CSS + PostCSS
- **State Management:** Zustand (lightweight client state container)
- **Spreadsheet Engine:** Univer (`@univerjs/core`, `@univerjs/sheets`, `@univerjs/sheets-ui`, `@univerjs/sheets-formula`, `@univerjs/ui`, `@univerjs/engine-render`, `@univerjs/engine-formula`, `@univerjs/design`)
- **Panel Splitting & Resizing:** `react-resizable-panels`

---

## 2. Directory Structure & Responsibilities

```
.
├── app/                      # Next.js App Router entrypoints & layouts
│   ├── layout.tsx            # Root HTML shell, font loader, globals.css importer
│   ├── globals.css           # Tailwind directives & Univer core/UI stylesheets
│   └── page.tsx              # Application root page composing ShellLayout
├── components/               # Reusable UI & platform components
│   ├── ShellLayout.tsx       # Resizable split-pane layout (sidebar vs main)
│   ├── SpreadsheetControls.tsx# Toolbar controlling blur, opacity, minimize, maximize
│   ├── SpreadsheetContainer.tsx# Display wrapper applying CSS filter/opacity/dimensions
│   ├── SpreadsheetWrapper.tsx  # Dynamic (SSR-disabled) Univer lifecycle & canvas host
│   └── OverlayLayer.tsx      # Absolute modal/backdrop layer for teaching content
├── store/                    # Global client-side application state
│   └── spreadsheetStore.ts   # Zustand store for SpreadsheetDisplayState & invariants
└── docs/                     # Architectural documents & design contracts
    ├── ARCHITECTURE.md       # High-level architecture, contracts & boundaries (this file)
    └── contracts/            # Explicit inter-module specification files
        └── excel-frontend-foundation.md
```

### Module Responsibilities
- **`app/`**: Handles root Next.js configuration, page routing, and metadata. Client code execution is delegated to client components.
- **`components/`**: Modular presentation and feature components. Strictly separates display wrappers, toolbar controls, and the third-party spreadsheet engine.
- **`store/`**: Centralizes client state. Decouples UI controls from the underlying spreadsheet container.
- **`docs/`**: Single source of truth for architectural contracts, ensuring agents and developers maintain invariant guarantees.

---

## 3. Module Boundaries & Component Hierarchy

### Component Hierarchy

```
app/page.tsx
└── ShellLayout
    ├── [sidebar slot]: Lesson Sidebar Placeholder (left panel, resizable/collapsible)
    └── [main slot]: Right Panel
        ├── SpreadsheetControls (toolbar: sliders & action buttons)
        └── <div className="relative flex-1"> (canvas & overlay viewport)
            ├── SpreadsheetContainer (applies blur, opacity, dimensions, pointer-events)
            │   └── SpreadsheetWrapper (dynamically loaded Univer instance, ssr: false)
            └── OverlayLayer (absolute z-30 backdrop for lesson prompts)
```

### Module Boundaries & Invariants
1. **Univer Isolation (`SpreadsheetWrapper`):**
   - Univer depends on browser DOM APIs and cannot run during server-side rendering (SSR).
   - It MUST be loaded with `next/dynamic(() => import('./SpreadsheetWrapper'), { ssr: false })`.
   - Lifecycle management (`create Univer` on mount, `dispose()` on unmount) is strictly confined to `SpreadsheetWrapper`.
2. **Display Abstraction (`SpreadsheetContainer`):**
   - Does not interact with Univer internal models or sheets directly.
   - Applies outer CSS styles (`filter: blur(...)`, `opacity: ...`, `transition: ...`, `pointer-events: ...`) based solely on the Zustand store.
3. **Resizable Shell (`ShellLayout`):**
   - Purely structural layout powered by `react-resizable-panels`.
   - Divides the screen into a collapsible left sidebar (lesson instructions) and right main workspace (spreadsheet + controls).
4. **Overlay System (`OverlayLayer`):**
   - Sits at `z-index: 30` positioned absolutely over the spreadsheet area.
   - Used for interactive lesson steps, spotlights, or modal confirmations.

---

## 4. State Management Model

State management is centralized in Zustand (`store/spreadsheetStore.ts`) via the `SpreadsheetDisplayState` interface.

### State Contract

```typescript
interface SpreadsheetDisplayState {
  // State properties
  opacity: number;            // 0.0 – 1.0, default 1.0
  blurAmount: number;         // 0 – 20 px, default 0
  isMinimized: boolean;       // default false (collapses spreadsheet to header bar)
  isMaximized: boolean;       // default false (expands spreadsheet to viewport)
  isInteractive: boolean;     // default true (controls pointer-events)
  isOverlayVisible: boolean;  // default false (shows overlay layer on top)

  // Actions
  setOpacity: (v: number) => void;
  setBlurAmount: (v: number) => void;
  toggleMinimize: () => void;
  toggleMaximize: () => void;
  setInteractive: (v: boolean) => void;
  toggleOverlay: () => void;
  resetDisplay: () => void;
}
```

### Store Invariants & Transition Rules
1. **Mutual Exclusion:** `isMinimized` and `isMaximized` are mutually exclusive. Activating one automatically clears the other.
2. **Safety Auto-Disable:** When `blurAmount > 0` or `opacity < 1.0`, `isInteractive` is automatically enforced as `false` to prevent accidental clicks while dimmed/blurred.
3. **Interaction Restoration:** When both `blurAmount === 0` and `opacity === 1.0`, `isInteractive` is restored to `true`.
4. **Input Clamping:** `setOpacity` strictly clamps input values to `[0.0, 1.0]`; `setBlurAmount` strictly clamps to `[0, 20]`.
5. **Reset Default:** `resetDisplay()` restores all fields to their pristine defaults:
   `{ opacity: 1.0, blurAmount: 0, isMinimized: false, isMaximized: false, isInteractive: true, isOverlayVisible: false }`.
