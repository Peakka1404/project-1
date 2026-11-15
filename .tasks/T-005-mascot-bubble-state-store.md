---
id: T-005
title: "Mascot & Text Bubble State Management Store"
plan: "mascot-overlay-audio"
status: TESTING         # READY | IN_PROGRESS | REVIEW | TESTING | DONE | BLOCKED
blocked_type: ""       # AMBIGUOUS | CONFLICT | SCOPE | ENV | DEPENDENCY | FAILING | UNSAFE
owner: "coder-agent-user"
depends_on: []
parallel_group: "group-1"
deep_test: true
branch: "feature/mascot-overlay-audio"
---

# T-005: Mascot & Text Bubble State Management Store

## Goal

Implement `store/mascotStore.ts` using Zustand to manage mascot visual properties, text bubble properties, sound settings, and customizer visibility with boundary clamping, partial update preservation, and pristine reset invariants.

## Contract

Contract C7 (`docs/contracts/mascot-customization-sound.md`):

```typescript
export type MascotShape = 'square' | 'rounded' | 'circle' | 'pill';
export type BubbleShape = 'rounded' | 'square' | 'speech-balloon';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MascotLighting {
  glowColor: string;          // CSS color string, default 'rgba(59, 130, 246, 0.5)'
  glowBlur: number;           // px, clamped [0, 50], default 10
  glowSpread: number;         // px, clamped [0, 30], default 0
}

export interface MascotVisualProperties {
  shape: MascotShape;         // 'square' | 'rounded' | 'circle' | 'pill', default 'rounded'
  size: number;               // px, clamped [32, 256], default 80
  color: string;              // CSS background color, default '#3b82f6'
  borderColor: string;        // CSS border color, default '#1d4ed8'
  borderWidth: number;        // px, clamped [0, 12], default 2
  position: {                 // Viewport coordinates in px
    x: number;                // clamped >= 0, default 40
    y: number;                // clamped >= 0, default 120
  };
  lighting: MascotLighting;
  opacity: number;            // clamped [0.0, 1.0], default 1.0
  blur: number;               // px, clamped [0, 20], default 0
  isVisible: boolean;         // default true
}

export interface BubbleLighting {
  shadowColor: string;        // CSS color string, default 'rgba(0, 0, 0, 0.15)'
  shadowBlur: number;         // px, clamped [0, 50], default 12
  shadowSpread: number;       // px, clamped [0, 30], default 0
}

export interface BubbleTypography {
  fontSize: number;           // px, clamped [10, 32], default 14
  textColor: string;          // CSS color string, default '#1e293b'
  textAlign: TextAlignment;   // 'left' | 'center' | 'right', default 'left'
  fontWeight: string;         // CSS font-weight (e.g. '400', '500', '600'), default '500'
}

export interface TextBubbleProperties {
  text: string;               // Display text, default "Hello! I am your Excel guide."
  isVisible: boolean;         // default true
  shape: BubbleShape;         // 'rounded' | 'square' | 'speech-balloon', default 'rounded'
  size: {
    maxWidth: number;         // px, clamped [120, 600], default 280
    padding: number;          // px, clamped [4, 32], default 12
  };
  color: string;              // CSS background color, default '#ffffff'
  borderColor: string;        // CSS border color, default '#e2e8f0'
  borderWidth: number;        // px, clamped [0, 8], default 1
  positionOffset: {           // Relative offset from mascot anchor in px
    x: number;                // default 96
    y: number;                // default -16
  };
  lighting: BubbleLighting;
  opacity: number;            // clamped [0.0, 1.0], default 1.0
  blur: number;               // px, clamped [0, 20], default 0
  typography: BubbleTypography;
}

export interface SoundSettingsState {
  volume: number;             // clamped [0.0, 1.0], default 0.7
  isMuted: boolean;           // default false
  voicePitch: number;         // multiplier clamped [0.5, 2.0], default 1.0
  voiceSpeed: number;         // syllables/sec clamped [1, 20], default 8
}

export interface MascotStoreState {
  mascot: MascotVisualProperties;
  bubble: TextBubbleProperties;
  sound: SoundSettingsState;
  isCustomizerOpen: boolean;

  // Actions
  setMascotProperties: (props: Partial<MascotVisualProperties>) => void;
  setMascotPosition: (pos: { x: number; y: number }) => void;
  setBubbleProperties: (props: Partial<TextBubbleProperties>) => void;
  setBubbleText: (text: string, triggerSpeech?: boolean) => void;
  setBubbleVisibility: (visible: boolean) => void;
  setSoundSettings: (settings: Partial<SoundSettingsState>) => void;
  toggleCustomizer: () => void;
  setCustomizerOpen: (open: boolean) => void;
  resetAll: () => void;
}
```

### Store Invariants:
1. **Strict Boundary Clamping:**
   - `mascot.size` is clamped to `[32, 256]`.
   - `mascot.borderWidth` is clamped to `[0, 12]`.
   - `mascot.lighting.glowBlur` clamped to `[0, 50]`, `glowSpread` to `[0, 30]`.
   - `mascot.opacity` clamped to `[0.0, 1.0]`.
   - `mascot.blur` clamped to `[0, 20]`.
   - `mascot.position.x` and `position.y` clamped to `>= 0`.
   - `bubble.size.maxWidth` clamped to `[120, 600]`, `padding` clamped to `[4, 32]`.
   - `bubble.borderWidth` clamped to `[0, 8]`.
   - `bubble.lighting.shadowBlur` clamped to `[0, 50]`, `shadowSpread` clamped to `[0, 30]`.
   - `bubble.opacity` clamped to `[0.0, 1.0]`, `blur` clamped to `[0, 20]`.
   - `bubble.typography.fontSize` clamped to `[10, 32]`.
   - `sound.volume` clamped to `[0.0, 1.0]`.
   - `sound.voicePitch` clamped to `[0.5, 2.0]`.
   - `sound.voiceSpeed` clamped to `[1, 20]`.
2. **Partial Updates Preservation:**
   - Updating nested structures deep-merges with existing values without overwriting unspecified siblings.
3. **Pristine Reset:**
   - Calling `resetAll()` atomically reverts `mascot`, `bubble`, `sound`, and `isCustomizerOpen` to default values.
4. **Isolation:**
   - State mutations in `mascotStore` have zero impact on `spreadsheetStore` invariants.

## Files to Modify

<!-- Files the coder MAY change. context_files are read-only. -->

### files_to_modify
- `store/mascotStore.ts`

### context_files
- `store/spreadsheetStore.ts`
- `docs/contracts/mascot-customization-sound.md`
- `docs/ARCHITECTURE.md`

### test_files
- `__tests__/store/mascotStore.test.ts`

## Out of Scope

- Audio synthesis or playback logic (handled in `lib/audio/soundController.ts`).
- React UI components, customizer panel, or DOM elements (handled in W3/W4).
- LocalStorage or database persistence of state.
- Modifying `store/spreadsheetStore.ts`.

## Requirements

1. Create `store/mascotStore.ts` and define all types specified in Contract C7: `MascotShape`, `BubbleShape`, `TextAlignment`, `MascotLighting`, `MascotVisualProperties`, `BubbleLighting`, `BubbleTypography`, `TextBubbleProperties`, `SoundSettingsState`, and `MascotStoreState`.
2. Export default constant configurations for `DEFAULT_MASCOT_PROPERTIES`, `DEFAULT_BUBBLE_PROPERTIES`, and `DEFAULT_SOUND_SETTINGS` matching the default values in Contract C7:
   - Mascot defaults: `shape: 'rounded'`, `size: 80`, `color: '#3b82f6'`, `borderColor: '#1d4ed8'`, `borderWidth: 2`, `position: { x: 40, y: 120 }`, `lighting: { glowColor: 'rgba(59, 130, 246, 0.5)', glowBlur: 10, glowSpread: 0 }`, `opacity: 1.0`, `blur: 0`, `isVisible: true`.
   - Bubble defaults: `text: 'Hello! I am your Excel guide.'`, `isVisible: true`, `shape: 'rounded'`, `size: { maxWidth: 280, padding: 12 }`, `color: '#ffffff'`, `borderColor: '#e2e8f0'`, `borderWidth: 1`, `positionOffset: { x: 96, y: -16 }`, `lighting: { shadowColor: 'rgba(0, 0, 0, 0.15)', shadowBlur: 12, shadowSpread: 0 }`, `opacity: 1.0`, `blur: 0`, `typography: { fontSize: 14, textColor: '#1e293b', textAlign: 'left', fontWeight: '500' }`.
   - Sound defaults: `volume: 0.7`, `isMuted: false`, `voicePitch: 1.0`, `voiceSpeed: 8`.
   - `isCustomizerOpen: false`.
3. Implement `useMascotStore = create<MascotStoreState>((set) => ({ ... }))` from `zustand`.
4. Implement `setMascotProperties`: Deeply merge incoming partial properties into `mascot`. Apply boundary clamps to `size` [32, 256], `borderWidth` [0, 12], `lighting.glowBlur` [0, 50], `lighting.glowSpread` [0, 30], `opacity` [0.0, 1.0], `blur` [0, 20], and `position` `x >= 0`, `y >= 0`.
5. Implement `setMascotPosition`: Clamps coordinates `x = Math.max(0, pos.x)` and `y = Math.max(0, pos.y)`.
6. Implement `setBubbleProperties`: Deeply merge incoming partial properties into `bubble`. Apply boundary clamps to `size.maxWidth` [120, 600], `size.padding` [4, 32], `borderWidth` [0, 8], `lighting.shadowBlur` [0, 50], `lighting.shadowSpread` [0, 30], `opacity` [0.0, 1.0], `blur` [0, 20], `typography.fontSize` [10, 32].
7. Implement `setBubbleText`: Updates `bubble.text`.
8. Implement `setBubbleVisibility`: Updates `bubble.isVisible`.
9. Implement `setSoundSettings`: Deeply merges partial settings, clamping `volume` [0.0, 1.0], `voicePitch` [0.5, 2.0], `voiceSpeed` [1, 20], and setting `isMuted`.
10. Implement `toggleCustomizer`: Toggles `isCustomizerOpen = !state.isCustomizerOpen`.
11. Implement `setCustomizerOpen`: Sets `isCustomizerOpen` directly.
12. Implement `resetAll`: Atomically resets `mascot`, `bubble`, `sound`, and `isCustomizerOpen` back to default values.

## Acceptance Criteria

- [x] `store/mascotStore.ts` exports `useMascotStore` Zustand store adhering to `MascotStoreState` interface from Contract C7.
- [x] Initial state matches all default values specified in Contract C7.
- [x] `setMascotProperties` clamps values within numeric ranges and deep-merges nested properties (`position`, `lighting`) without mutating or losing unspecified siblings.
- [x] `setMascotPosition` clamps coordinates to non-negative values (`x >= 0`, `y >= 0`).
- [x] `setBubbleProperties` clamps values within numeric ranges and deep-merges nested properties (`size`, `positionOffset`, `lighting`, `typography`) without mutating or losing unspecified siblings.
- [x] `setBubbleText` updates text and `setBubbleVisibility` updates visibility boolean.
- [x] `setSoundSettings` clamps `volume`, `voicePitch`, and `voiceSpeed` within valid ranges.
- [x] `toggleCustomizer` and `setCustomizerOpen` correctly update `isCustomizerOpen`.
- [x] `resetAll` reverts all fields atomically to pristine defaults.
- [x] Zero side effects or mutations on `useSpreadsheetStore`.

## Verify Command

```
npx tsc --noEmit --allowImportingTsExtensions
```

## Blockers

None. Baseline issue resolved by updating verify_command.

## Decisions

Amended: verify_command updated to npx tsc --noEmit --allowImportingTsExtensions to support .ts import extensions.

## Implementation Report

### Changes and Why
- Implemented `store/mascotStore.ts` adhering strictly to Contract C7 (`docs/contracts/mascot-customization-sound.md`).
- Defined and exported all required domain types: `MascotShape`, `BubbleShape`, `TextAlignment`, `MascotLighting`, `MascotVisualProperties`, `BubbleLighting`, `BubbleTypography`, `TextBubbleProperties`, `SoundSettingsState`, and `MascotStoreState`. Also exported `DeepPartial<T>` helper to facilitate ergonomic partial updates.
- Exported immutable default constants `DEFAULT_MASCOT_PROPERTIES`, `DEFAULT_BUBBLE_PROPERTIES`, and `DEFAULT_SOUND_SETTINGS` matching Contract C7 defaults.
- Implemented Zustand store `useMascotStore` with:
  - Deep-merging logic for `setMascotProperties` and `setBubbleProperties` preserving unspecified sibling fields in nested structures (`position`, `lighting`, `size`, `positionOffset`, `typography`).
  - Strict boundary clamping for numeric properties:
    - Mascot size [32, 256], borderWidth [0, 12], lighting glowBlur [0, 50], glowSpread [0, 30], opacity [0.0, 1.0], blur [0, 20], position coordinates x >= 0, y >= 0.
    - Bubble maxWidth [120, 600], padding [4, 32], borderWidth [0, 8], shadowBlur [0, 50], shadowSpread [0, 30], opacity [0.0, 1.0], blur [0, 20], typography fontSize [10, 32].
    - Sound volume [0.0, 1.0], voicePitch [0.5, 2.0], voiceSpeed [1, 20].
  - Clean state mutators: `setMascotPosition`, `setBubbleText`, `setBubbleVisibility`, `setSoundSettings`, `toggleCustomizer`, `setCustomizerOpen`.
  - Atomic and pristine `resetAll` restoring fresh default objects.
  - Complete isolation with zero modifications or couplings to `store/spreadsheetStore.ts`.

### Files Modified
- `store/mascotStore.ts` (created)
- `.tasks/T-005-mascot-bubble-state-store.md` (updated status, checklist, report)

### Verification
Command executed:
`npx tsc --noEmit --allowImportingTsExtensions`

Output:
```
npm notice run excel-teaching-platform@0.1.0 npx
npm notice run ^"tsc^" --noEmit --allowImportingTsExtensions
```
Exit code: 0 (zero errors, clean build).

## Test Report

### Test Execution Commands
1. Verify command (TypeScript compile check):
```bash
npx tsc --noEmit --allowImportingTsExtensions
```
Output:
```
npm notice run excel-teaching-platform@0.1.0 npx
npm notice run ^"tsc^" --noEmit --allowImportingTsExtensions
```
Exit code: 0 (zero errors, clean compile).

2. Unit test suite:
```bash
node --test __tests__/store/mascotStore.test.ts
```
Output:
```
▶ MascotStore (Contract C7 & Invariants)
  ▶ AC1: exports useMascotStore and contract definitions
    ✔ exports useMascotStore as a Zustand hook function
    ✔ exports default configuration constants matching Contract C7
    ✔ state object exposes all actions defined in MascotStoreState
  ✔ AC1: exports useMascotStore and contract definitions
  ▶ AC2: Initial state matches all default values specified in Contract C7
    ✔ initial state matches pristine default values
  ✔ AC2: Initial state matches all default values specified in Contract C7
  ▶ AC3: setMascotProperties boundary clamping and deep-merging
    ✔ clamps size to [32, 256]
    ✔ clamps borderWidth to [0, 12]
    ✔ clamps position coordinates to non-negative x >= 0, y >= 0
    ✔ clamps lighting glowBlur to [0, 50] and glowSpread to [0, 30]
    ✔ clamps opacity to [0.0, 1.0] and blur to [0, 20]
    ✔ updates mascot shape, color, borderColor, and isVisible
    ✔ deep-merges nested properties without dropping unspecified siblings
  ✔ AC3: setMascotProperties boundary clamping and deep-merging
  ▶ AC4: setMascotPosition clamps coordinates to non-negative values
    ✔ clamps negative coordinates to 0
    ✔ sets valid non-negative coordinates accurately
    ✔ handles mixed coordinates with one negative and one positive
    ✔ does not affect other mascot properties
  ✔ AC4: setMascotPosition clamps coordinates to non-negative values
  ▶ AC5: setBubbleProperties boundary clamping and deep-merging
    ✔ clamps size maxWidth to [120, 600] and padding to [4, 32]
    ✔ clamps borderWidth to [0, 8]
    ✔ allows negative and positive values for positionOffset relative to anchor
    ✔ clamps lighting shadowBlur to [0, 50] and shadowSpread to [0, 30]
    ✔ clamps opacity to [0.0, 1.0] and blur to [0, 20]
    ✔ clamps typography fontSize to [10, 32] and updates font styles
    ✔ deep-merges nested properties without dropping unspecified siblings
  ✔ AC5: setBubbleProperties boundary clamping and deep-merging
  ▶ AC6: setBubbleText and setBubbleVisibility
    ✔ updates text in bubble and accepts optional triggerSpeech flag
    ✔ updates visibility boolean in bubble
  ✔ AC6: setBubbleText and setBubbleVisibility
  ▶ AC7: setSoundSettings clamps volume, voicePitch, and voiceSpeed
    ✔ clamps volume to [0.0, 1.0]
    ✔ clamps voicePitch to [0.5, 2.0]
    ✔ clamps voiceSpeed to [1, 20]
    ✔ toggles isMuted boolean and preserves siblings
  ✔ AC7: setSoundSettings clamps volume, voicePitch, and voiceSpeed
  ▶ AC8: toggleCustomizer and setCustomizerOpen
    ✔ toggleCustomizer flips isCustomizerOpen boolean
    ✔ setCustomizerOpen explicitly sets the flag
  ✔ AC8: toggleCustomizer and setCustomizerOpen
  ▶ AC9: resetAll reverts all fields atomically to pristine defaults
    ✔ resets altered mascot, bubble, sound, and customizer states to defaults
    ✔ pristine reset returns independent objects so mutating state does not corrupt defaults
  ✔ AC9: resetAll reverts all fields atomically to pristine defaults
  ▶ AC10: Zero side effects or mutations on useSpreadsheetStore
    ✔ mutations on useMascotStore have zero effect on useSpreadsheetStore
    ✔ mutations on useSpreadsheetStore have zero effect on useMascotStore
  ✔ AC10: Zero side effects or mutations on useSpreadsheetStore
✔ MascotStore (Contract C7 & Invariants)
ℹ tests 34
ℹ suites 11
ℹ pass 34
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
Exit code: 0 (all 34 tests passing).

Result: PASS
