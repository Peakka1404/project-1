---
id: T-009
title: "Application Shell Integration & Guide Completion Wiring"
plan: "mascot-overlay-audio"
status: TESTING        # READY | IN_PROGRESS | REVIEW | TESTING | DONE | BLOCKED
owner: "coder-agent-user"
blocked_type: ""       # AMBIGUOUS | CONFLICT | SCOPE | ENV | DEPENDENCY | FAILING | UNSAFE
depends_on:
  - T-006
  - T-007
  - T-008
parallel_group: "group-3"
deep_test: true
branch: "feature/mascot-overlay-audio"
---

# T-009: Application Shell Integration & Guide Completion Wiring

## Goal

Integrate `MascotOverlayLayer` and `MascotCustomizerPanel` into `app/page.tsx`, and wire a guide completion action in the lesson sidebar that plays the completion chime via `soundController.playCompletion()` and updates speech bubble text, ensuring seamless coexistence with Univer and existing spreadsheet controls.

## Contract

Contract C12 (`docs/contracts/mascot-customization-sound.md`):

### Page Composition & Event Integration (`app/page.tsx`)

#### Hierarchy:
```
app/page.tsx
├── ShellLayout
│   ├── sidebar: Lesson Sidebar with "Complete Guide" trigger demo button
│   └── main:
│       ├── SpreadsheetControls
│       └── <div className="relative flex-1 overflow-hidden">
│           ├── SpreadsheetContainer
│           │   └── SpreadsheetWrapper (dynamic import, ssr: false)
│           └── OverlayLayer (spreadsheet modal backdrop, z-30)
├── MascotOverlayLayer (fixed inset-0, z-40, pointer-events-none)
└── MascotCustomizerPanel (fixed bottom-4 right-4, z-50)
```

#### Event Invariant:
- Guide completion trigger in sidebar calls `soundController.playCompletion()` and updates bubble text to celebrate completion.
- Page mount does not re-render Univer spreadsheet instance when mascot coordinates or styling properties change.

## Files to Modify

<!-- Files the coder MAY change. context_files are read-only. -->

### files_to_modify
- `app/page.tsx`

### context_files
- `components/MascotOverlayLayer.tsx`
- `components/MascotCustomizerPanel.tsx`
- `components/ShellLayout.tsx`
- `components/SpreadsheetContainer.tsx`
- `store/mascotStore.ts`
- `lib/audio/soundController.ts`
- `docs/contracts/mascot-customization-sound.md`
- `docs/ARCHITECTURE.md`

### test_files
- `__tests__/app/page.test.tsx`

## Out of Scope

- Modifying `SpreadsheetWrapper.tsx` or Univer internal models.
- Curriculum lesson progression engine or automated formula grading (Phase 3).
- Modifying `store/spreadsheetStore.ts`.

## Requirements

1. In `app/page.tsx`, import:
   - `MascotOverlayLayer` from `@/components/MascotOverlayLayer`.
   - `MascotCustomizerPanel` from `@/components/MascotCustomizerPanel`.
   - `soundController` from `@/lib/audio/soundController`.
   - `useMascotStore` from `@/store/mascotStore`.
2. In the sidebar slot of `ShellLayout`:
   - Keep existing lesson instructions and header.
   - Add a "Complete Guide" button (e.g. styled with primary accent classes: `bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2`).
   - Wire `onClick` handler to:
     1. Call `soundController.playCompletion()`.
     2. Call `useMascotStore.getState().setBubbleText('🎉 Excellent work! You completed this guide successfully!', true)`.
     3. Ensure `useMascotStore.getState().setBubbleVisibility(true)`.
3. In the root JSX tree of `HomePage`:
   - Mount `<MascotOverlayLayer />` alongside `<ShellLayout ... />`.
   - Mount `<MascotCustomizerPanel />` alongside `<ShellLayout ... />`.
4. Ensure `SpreadsheetWrapper` dynamic import (`ssr: false`) and Univer lifecycle remain isolated and stable without unnecessary re-renders when mascot properties update.

## Acceptance Criteria

- [x] `app/page.tsx` renders `MascotOverlayLayer` and `MascotCustomizerPanel` in the component tree.
- [x] Sidebar includes an interactive "Complete Guide" button.
- [x] Clicking "Complete Guide" triggers `soundController.playCompletion()` and updates text bubble text with completion message.
- [x] Mascot and customizer elements coexist with `ShellLayout` and `SpreadsheetContainer` without breaking resizing or layout constraints.
- [x] Univer spreadsheet container maintains independent lifecycle without re-rendering on mascot state updates.

## Verify Command

```
npx tsc --noEmit --allowImportingTsExtensions
```

## Blockers

<!-- AGENT-WRITTEN: filled by the coder when blocked -->

## Decisions

<!-- AGENT-WRITTEN: filled by the architect when unblocking -->

## Implementation Report

<!-- AGENT-WRITTEN: filled by the coder when done -->
### Changes and Why
- In `app/page.tsx`:
  - Imported `MascotOverlayLayer` from `@/components/MascotOverlayLayer`, `MascotCustomizerPanel` from `@/components/MascotCustomizerPanel`, `soundController` from `@/lib/audio/soundController`, and `useMascotStore` from `@/store/mascotStore`.
  - Added interactive "Complete Guide" button in the lesson sidebar slot of `ShellLayout` alongside existing lesson outline headers and description.
  - Implemented `handleCompleteGuide` click handler that invokes `soundController.playCompletion()`, calls `useMascotStore.getState().setBubbleText('🎉 Excellent work! You completed this guide successfully!', true)`, and calls `useMascotStore.getState().setBubbleVisibility(true)`.
  - Mounted `<MascotOverlayLayer />` and `<MascotCustomizerPanel />` alongside `<ShellLayout ... />` in the root JSX tree using React Fragment `<>`.
  - Maintained complete isolation of `SpreadsheetWrapper` (`ssr: false`) and Univer lifecycle: `HomePage` does not subscribe directly to mascot store state (it only reads actions via `.getState()`), so mascot coordinates, lighting, or appearance changes trigger zero re-renders of the page or spreadsheet container.

### Files Modified
- `app/page.tsx`: Added Phase 2 imports, sidebar complete guide button with completion audio and bubble update, and mounted mascot overlay and customizer panel in root tree.

### Commands Run and Actual Results
- Baseline `npx tsc --noEmit --allowImportingTsExtensions`: Exit code 0 (Pass)
- Verification `npx tsc --noEmit --allowImportingTsExtensions`: Exit code 0 (Pass)
- Lint check `npm run lint`: Exit code 0 (Pass, No ESLint warnings or errors)
- Production build `npm run build`: Exit code 0 (Pass, compiled successfully, all static pages generated)

### Assumptions (Internal-Only)
- React Fragment `<>` used at the root of `HomePage` to mount `ShellLayout`, `MascotOverlayLayer`, and `MascotCustomizerPanel` cleanly without introducing intermediate DOM wrappers that could affect flex pane calculations.

### Risks
- None. Univer instance dynamic loading and spreadsheet container hierarchy remain completely preserved.

## Test Report

- **Result:** PASS
- **Test Command:** `npx tsx --test __tests__/app/page.test.tsx`
- **Verify Command:** `npx tsc --noEmit --allowImportingTsExtensions`
- **Output:**
  ```
  ▶ HomePage Integration (app/page.tsx)
    ✔ AC4: composes ShellLayout with sidebar placeholder and main container (6.9687ms)
    ✔ AC5: dynamically loads SpreadsheetWrapper with { ssr: false } (0.3917ms)
    ✔ AC6: co-locates SpreadsheetContainer and OverlayLayer inside relative container (0.2457ms)
    ✔ T-009 AC1 & Contract C12: renders MascotOverlayLayer and MascotCustomizerPanel in the component tree (1.2842ms)
    ✔ T-009 AC2 & Contract C12: Sidebar includes an interactive "Complete Guide" button (0.978ms)
    ✔ T-009 AC3 & Contract C12: Clicking "Complete Guide" triggers soundController.playCompletion() and updates text bubble celebratory message and visibility (0.3275ms)
    ✔ T-009 AC3: Repeated clicks on "Complete Guide" repeatedly trigger sound and maintain celebratory state (0.2292ms)
    ✔ T-009 AC4 & Contract C12: Mascot and customizer elements coexist with ShellLayout and SpreadsheetContainer without breaking layout constraints (0.8985ms)
    ✔ T-009 AC3 & Invariant: Guide completion handler works correctly when sound is muted or volume is zero (0.3299ms)
    ✔ T-009 AC4: Expanded customizer panel and mascot overlay layer coexist without interfering with shell layout (2.1053ms)
    ✔ T-009 AC5 & Contract C12: Univer spreadsheet container maintains independent lifecycle without re-rendering on mascot state updates (0.5041ms)
    ✔ T-009 AC5 & Boundary Invariants: Rapid mascot state mutations across boundaries do not corrupt page layout structure (1.4778ms)
  ✔ HomePage Integration (app/page.tsx) (16.8922ms)
  ℹ tests 12
  ℹ suites 1
  ℹ pass 12
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 200.9077
  ```

### Acceptance Criteria Coverage Summary
1. **AC1: Page renders MascotOverlayLayer and MascotCustomizerPanel**
   - Verified JSX tree composition (React.Fragment wrapping ShellLayout, MascotOverlayLayer, and MascotCustomizerPanel).
   - Verified rendered static markup includes both `data-testid="mascot-overlay-layer"` and `data-testid="mascot-customizer-panel"` with exact positioning classes (`fixed inset-0 z-40 pointer-events-none` and `fixed bottom-4 right-4 z-50`).
2. **AC2: Sidebar includes interactive "Complete Guide" button**
   - Verified presence of `<button>` element with `data-testid="complete-guide-btn"`, `type="button"`, text "Complete Guide", green styling, and valid `onClick` function.
3. **AC3: Clicking "Complete Guide" triggers audio and celebratory speech bubble**
   - Verified that clicking the button calls `soundController.playCompletion()`, sets bubble visibility to `true`, and updates text to celebratory message (`🎉 Excellent work! You completed this guide successfully!`).
   - Verified repeated clicks trigger repeated audio calls and maintain visibility.
   - Verified behavior functions correctly even when sound is muted or master volume is zero.
4. **AC4: Layout coexistence and z-index stacking**
   - Verified ShellLayout horizontal panel group and column resizing handle remain intact.
   - Verified stacking order: Modal Overlay (`z-30`) < Mascot Overlay (`z-40`) < Customizer Panel (`z-50`).
   - Verified `pointer-events: none` on outer mascot container passes interaction through to underlying spreadsheet and shell.
   - Verified coexistence when customizer panel is in expanded mode.
5. **AC5: Univer spreadsheet container lifecycle independence**
   - Verified static invariant: `app/page.tsx` contains zero reactive subscriptions to `useMascotStore`; only reads actions via `.getState()` inside callbacks.
   - Verified dynamic stability: rapid state updates to mascot coordinates, dimensions, lighting, colors, and customizer state do not disrupt `SpreadsheetContainer` or trigger re-renders.
