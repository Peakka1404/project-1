---
id: T-002
title: "Zustand Store + SpreadsheetWrapper"
plan: "excel-frontend-foundation"
status: DONE
owner: coder-agent-user
blocked_type: ""
depends_on: [T-001]
parallel_group: "2"
deep_test: true
branch: feature/excel-frontend-foundation
---

# T-002: Zustand Store + SpreadsheetWrapper

## Goal

Implement the `SpreadsheetDisplayState` Zustand store enforcing display state invariants (C1) and the client-side `SpreadsheetWrapper` component (C2) that mounts, initializes, and disposes the Univer spreadsheet instance.

## Contract

### C1: SpreadsheetDisplayState (Zustand store)

File: `store/spreadsheetStore.ts`

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

Invariants:
1. `isMinimized` and `isMaximized` are mutually exclusive. `toggleMinimize()` clears `isMaximized`; `toggleMaximize()` clears `isMinimized`.
2. When `blurAmount > 0` or `opacity < 1.0`, `isInteractive` is automatically set to `false`.
3. When both `blurAmount === 0` and `opacity === 1.0`, `isInteractive` is restored to `true` (unless explicitly set to `false`).
4. `setOpacity` clamps input to `[0, 1]`. `setBlurAmount` clamps input to `[0, 20]`.
5. `resetDisplay()` restores all fields to defaults: `opacity=1, blurAmount=0, isMinimized=false, isMaximized=false, isInteractive=true, isOverlayVisible=false`.

### C2: SpreadsheetWrapper component

File: `components/SpreadsheetWrapper.tsx`

```
Props: none (self-contained)
Reads: SpreadsheetDisplayState from Zustand store
Lifecycle:
  - mount  → create Univer instance, register Sheet plugin, SheetUI plugin, UI plugin, create default workbook
  - unmount → call univer.dispose()
Render: <div ref={containerRef} style={{ width: '100%', height: '100%' }} /> where Univer mounts its DOM
SSR: MUST be imported via next/dynamic({ ssr: false })
Errors: if Univer fails to initialize → render fallback text "Spreadsheet failed to load"
```

## Files to Modify

### files_to_modify
- store/spreadsheetStore.ts
- components/SpreadsheetWrapper.tsx

### context_files
- docs/contracts/excel-frontend-foundation.md
- docs/ARCHITECTURE.md
- package.json
- tsconfig.json

### test_files
- __tests__/store/spreadsheetStore.test.ts
- __tests__/components/SpreadsheetWrapper.test.tsx

## Out of Scope

- Implementing ShellLayout, SpreadsheetContainer, or OverlayLayer (handled in T-003).
- Implementing SpreadsheetControls or demo page (handled in T-004).
- Creating or editing test files (reserved for tester-user).
- Custom cell styling, formulas, or teaching logic beyond default workbook initialization.

## Requirements

1. Create `store/spreadsheetStore.ts` using Zustand (`create`):
   - Export `interface SpreadsheetDisplayState`.
   - Export `useSpreadsheetStore` store hook.
   - Initial state values: `opacity: 1.0`, `blurAmount: 0`, `isMinimized: false`, `isMaximized: false`, `isInteractive: true`, `isOverlayVisible: false`.
   - Implement `setOpacity(v)`: clamp `v` between `0` and `1`. If clamped `v < 1.0`, set `isInteractive: false`. If clamped `v === 1.0` and `blurAmount === 0`, set `isInteractive: true`.
   - Implement `setBlurAmount(v)`: clamp `v` between `0` and `20`. If clamped `v > 0`, set `isInteractive: false`. If clamped `v === 0` and `opacity === 1.0`, set `isInteractive: true`.
   - Implement `toggleMinimize()`: invert `isMinimized`; if newly true, set `isMaximized: false`.
   - Implement `toggleMaximize()`: invert `isMaximized`; if newly true, set `isMinimized: false`.
   - Implement `setInteractive(v)`: set `isInteractive: v`.
   - Implement `toggleOverlay()`: invert `isOverlayVisible`.
   - Implement `resetDisplay()`: reset all state fields to defaults.
2. Create `components/SpreadsheetWrapper.tsx` (`'use client'`):
   - Set up container `div` with React ref and full width/height styling.
   - Use `useEffect` on mount to initialize Univer instance with plugins (`@univerjs/core`, `@univerjs/sheets`, `@univerjs/sheets-ui`, `@univerjs/sheets-formula`, `@univerjs/ui`), and create a default empty workbook.
   - In cleanup function of `useEffect`, call `univer.dispose()`.
   - Wrap initialization in try/catch to render `<div className="error">Spreadsheet failed to load</div>` if initialization fails.
3. Verify that `npm run build` succeeds without type errors.

## Acceptance Criteria

- [x] `store/spreadsheetStore.ts` exports `SpreadsheetDisplayState` and `useSpreadsheetStore`.
- [x] `setOpacity` clamps values to `[0, 1]` and sets `isInteractive: false` when opacity < 1.0.
- [x] `setBlurAmount` clamps values to `[0, 20]` and sets `isInteractive: false` when blurAmount > 0.
- [x] `toggleMinimize` and `toggleMaximize` enforce mutual exclusivity.
- [x] `resetDisplay` restores all store fields to their initial defaults.
- [x] `components/SpreadsheetWrapper.tsx` mounts Univer on mount and calls `dispose()` on unmount.
- [x] Error fallback "Spreadsheet failed to load" renders if initialization throws.
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

### Summary of Changes
1. **`store/spreadsheetStore.ts`**:
   - Exported `SpreadsheetDisplayState` interface with state fields (`opacity`, `blurAmount`, `isMinimized`, `isMaximized`, `isInteractive`, `isOverlayVisible`) and actions (`setOpacity`, `setBlurAmount`, `toggleMinimize`, `toggleMaximize`, `setInteractive`, `toggleOverlay`, `resetDisplay`).
   - Implemented `useSpreadsheetStore` using Zustand `create`.
   - Enforced all invariants:
     - `setOpacity(v)`: clamped to `[0, 1]`. If clamped < 1.0, `isInteractive = false`. If clamped === 1.0 and `blurAmount === 0`, `isInteractive = true`.
     - `setBlurAmount(v)`: clamped to `[0, 20]`. If clamped > 0, `isInteractive = false`. If clamped === 0 and `opacity === 1.0`, `isInteractive = true`.
     - `toggleMinimize()`: inverts `isMinimized` and enforces `isMaximized = false`.
     - `toggleMaximize()`: inverts `isMaximized` and enforces `isMinimized = false`.
     - `setInteractive(v)`: sets `isInteractive = v`.
     - `toggleOverlay()`: inverts `isOverlayVisible`.
     - `resetDisplay()`: resets all state back to initial defaults.

2. **`components/SpreadsheetWrapper.tsx`**:
   - Added `'use client'` directive.
   - Set up container `div` with `containerRef` and full width/height styling (`style={{ width: '100%', height: '100%' }}`).
   - Subscribed to `useSpreadsheetStore()` per C2 contract.
   - In `useEffect`, instantiated `Univer` with `defaultTheme`, registered all plugins (`UniverRenderEnginePlugin`, `UniverFormulaEnginePlugin`, `UniverUIPlugin` with container reference, `UniverSheetsPlugin`, `UniverSheetsUIPlugin`, `UniverSheetsFormulaPlugin`), and created a default workbook using `univer.createUnit(UniverInstanceType.UNIVER_SHEET, {})`.
   - Handled cleanup by calling `univer.dispose()`.
   - Added error handling with try/catch to render fallback `<div className="error text-red-500 p-4">Spreadsheet failed to load</div>` if initialization throws.
   - Exported both named and default exports for maximum compatibility.

### Files Modified
- `store/spreadsheetStore.ts` (created)
- `components/SpreadsheetWrapper.tsx` (created)
- `.tasks/T-002-zustand-store-spreadsheet-wrapper.md` (updated status and report)

### Commands Run & Results
- `npm run build` (baseline check): Exited with code 0.
- Node.js test script for `useSpreadsheetStore`: Verified all state initializations, boundary clampings, interaction auto-toggles, mutual exclusions, and resets. All assertions passed.
- `npm run build` (verification): Exited with code 0.
- `npm run lint`: Exited with code 0 (✔ No ESLint warnings or errors).

### Assumptions
- In `components/SpreadsheetWrapper.tsx`, fallback error container includes both `error` and Tailwind classes `text-red-500 p-4` to satisfy both contract selectors and styling.
- Both named and default exports are provided for `SpreadsheetWrapper` to support standard component imports and `next/dynamic` usage.

### Risks
- Univer relies on browser DOM/canvas and WebGL APIs; unit tests running in jsdom will need standard mocking for `@univerjs/*` modules.

## Test Report

### Gate Log
- **Status:** PASS
- **Commit:** `443c123f93437a5e2b56f68ba4a9456900ae028f`
- **Gate 1 (Scope):** PASS. Only files in `files_to_modify` and `test_files` modified/created.
- **Gate 2 (No new dependencies):** PASS. Manifests and locks untouched.
- **Gate 3 (Verification reports):** PASS. Test Report shows 21/21 passing unit & component tests, `npm run build` exit code 0.
- **Gate 4 (Acceptance criteria):** PASS. All 8 acceptance criteria verified.
- **Gate 5 (Hygiene):** PASS. Clean TypeScript source, no secrets or debug flags.
- **Gate 6 (Architecture):** PASS. Layering and boundaries strictly followed.
- **Gate 7 (Assumptions):** PASS. No public contract assumptions.

- **Result:** PASS
- **Test Files:**
  - `__tests__/store/spreadsheetStore.test.ts`
  - `__tests__/components/SpreadsheetWrapper.test.tsx`

### Execution Details:
1. `npx sucrase-node "__tests__/store/spreadsheetStore.test.ts"`:
   - AC1: Default state verification (opacity 1.0, blurAmount 0, interactive true, minimized/maximized/overlay false).
   - AC2: `setOpacity` boundary clamping (< 0 to 0, > 1 to 1) and automatic interactivity disabling (< 1.0) / restoring (== 1.0 and blur == 0).
   - AC3: `setBlurAmount` boundary clamping (< 0 to 0, > 20 to 20) and automatic interactivity disabling (> 0) / restoring (== 0 and opacity == 1.0).
   - AC4: `toggleMinimize` & `toggleMaximize` mutual exclusivity verification.
   - AC5: `resetDisplay` restoring all mutated state back to default values.
   - Additional Actions: `toggleOverlay` and `setInteractive` behavior.
   - **Result:** 15/15 tests passed (0 failures).

2. `npx sucrase-node "__tests__/components/SpreadsheetWrapper.test.tsx"`:
   - AC6 & Contract: `'use client'` directive present for SSR safety.
   - AC6 & Contract: All 6 required Univer plugins registered and `UNIVER_SHEET` unit created.
   - AC6 & Contract: Cleanup calls `univer.dispose()`.
   - AC7: Error boundary catches initialization errors and renders "Spreadsheet failed to load".
   - Contract C2: Container styles width 100% and height 100%.
   - Contract C2: Subscribed to `useSpreadsheetStore`.
   - **Result:** 6/6 tests passed (0 failures).

3. `npm run build`:
   - Production build and Next.js type checking passed with exit code 0.
