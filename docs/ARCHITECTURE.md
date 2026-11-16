# Excel Teaching Platform – Architecture Documentation

## 1. System Overview & Technology Stack

The Excel Teaching Platform provides an interactive browser-based environment where learners interact with real spreadsheet mechanics alongside educational lessons. The frontend is architected to host a full spreadsheet engine inside a controllable container that can be dynamically dimmed, blurred, resized, or covered by interactive lesson content overlays, accompanied by an overlay mascot guide system and procedural audio feedback.

### Core Technology Stack
- **Framework:** Next.js 14 (App Router, React 18 compatible)
- **Language:** TypeScript 5.x (strict type checking enabled)
- **Styling:** Tailwind CSS + PostCSS
- **State Management:** Zustand (lightweight client state container)
- **Spreadsheet Engine:** Univer (`@univerjs/core`, `@univerjs/sheets`, `@univerjs/sheets-ui`, `@univerjs/sheets-formula`, `@univerjs/ui`, `@univerjs/engine-render`, `@univerjs/engine-formula`, `@univerjs/design`)
- **Panel Splitting & Resizing:** `react-resizable-panels`
- **Audio Synthesis:** Web Audio API (native procedural voice blips and event chimes, zero external runtime dependencies)

---

## 2. Directory Structure & Responsibilities

```
.
├── app/                          # Next.js App Router entrypoints & layouts
│   ├── layout.tsx                # Root HTML shell, font loader, globals.css importer
│   ├── globals.css               # Tailwind directives & Univer core/UI stylesheets
│   └── page.tsx                  # Application root page composing ShellLayout, Mascot, and Customizer
├── components/                   # Reusable UI & platform components
│   ├── ShellLayout.tsx           # Resizable split-pane layout (sidebar vs main)
│   ├── SpreadsheetControls.tsx   # Toolbar controlling blur, opacity, minimize, maximize
│   ├── SpreadsheetContainer.tsx  # Display wrapper applying CSS filter/opacity/dimensions
│   ├── SpreadsheetWrapper.tsx    # Dynamic (SSR-disabled) Univer lifecycle & canvas host
│   ├── OverlayLayer.tsx          # Absolute modal/backdrop layer (z-30) for teaching content
│   ├── MascotPlaceholder.tsx     # Customizable mascot visual element with shape & lighting
│   ├── TextBubble.tsx            # Customizable speech bubble with typography & dismiss control
│   ├── MascotOverlayLayer.tsx    # Full-viewport overlay layer (z-40) positioning mascot & bubble
│   └── MascotCustomizerPanel.tsx # Floating control panel (z-50) for real-time visual adjustments
├── lib/                          # Platform utilities and browser services
│   └── audio/
│       └── soundController.ts    # Procedural Web Audio voice blips and completion chime service
├── store/                        # Global client-side application state
│   ├── spreadsheetStore.ts       # Zustand store for SpreadsheetDisplayState & invariants
│   └── mascotStore.ts            # Zustand store for Mascot Visual, Bubble & Sound state
└── docs/                         # Architectural documents & design contracts
    ├── ARCHITECTURE.md           # High-level architecture, contracts & boundaries (this file)
    └── contracts/                # Explicit inter-module specification files
        ├── excel-frontend-foundation.md # Foundation contracts (C1–C6)
        └── mascot-customization-sound.md # Mascot, bubble & sound contracts (C7–C12)
```

### Module Responsibilities
- **`app/`**: Root Next.js configuration, page composition, and lifecycle hydration.
- **`components/`**: Modular presentation and feature components, strictly separating spreadsheet wrappers, toolbar controls, overlay viewports, and customizers.
- **`lib/audio/`**: Native Web Audio service managing procedural voice synthesis, completion fanfares, and browser audio safety.
- **`store/`**: Centralized client state slices (`spreadsheetStore`, `mascotStore`), isolating UI controls and mascot customizers from engine internals.
- **`docs/`**: Single source of truth for architectural contracts, system boundaries, and design invariants.

---

## 3. Module Boundaries & Component Hierarchy

### Component Hierarchy

```
app/page.tsx
├── ShellLayout
│   ├── [sidebar slot]: Lesson Sidebar with "Complete Guide" trigger
│   └── [main slot]: Right Panel
│       ├── SpreadsheetControls (toolbar: sliders & action buttons)
│       └── <div className="relative flex-1 overflow-hidden"> (canvas & overlay viewport)
│           ├── SpreadsheetContainer (applies blur, opacity, dimensions, pointer-events)
│           │   └── SpreadsheetWrapper (dynamically loaded Univer instance, ssr: false)
│           └── OverlayLayer (absolute z-30 backdrop for lesson prompts)
├── MascotOverlayLayer (fixed inset-0, z-40, pointer-events-none viewport host)
│   ├── MascotPlaceholder (positioned mascot element, pointer-events-auto)
│   └── TextBubble (anchored speech bubble element, pointer-events-auto)
└── MascotCustomizerPanel (fixed bottom-4 right-4, z-50 floating control panel)
```

### Module Boundaries & Invariants
1. **Univer Isolation (`SpreadsheetWrapper`):**
   - Univer depends on browser DOM APIs and cannot run during server-side rendering (SSR).
   - Loaded strictly via `next/dynamic(() => import('./SpreadsheetWrapper'), { ssr: false })`.
   - Lifecycle management (`create Univer` on mount, `dispose()` on unmount) is strictly confined to `SpreadsheetWrapper`.
2. **Display Abstraction (`SpreadsheetContainer`):**
   - Does not interact with Univer internal models or sheets directly.
   - Applies outer CSS styles (`filter: blur(...)`, `opacity: ...`, `transition: ...`, `pointer-events: ...`) based solely on `spreadsheetStore`.
3. **Resizable Shell (`ShellLayout`):**
   - Purely structural layout powered by `react-resizable-panels`.
   - Divides the screen into a collapsible left sidebar (lesson instructions) and right main workspace (spreadsheet + controls).
4. **Spreadsheet Overlay System (`OverlayLayer`):**
   - Sits at `z-index: 30` positioned absolutely over the spreadsheet canvas area.
   - Used for interactive lesson steps, spotlights, or modal confirmations.
5. **Display Controls (`SpreadsheetControls`):**
   - Pure UI toolbar reading and dispatching display mutations to `useSpreadsheetStore`.
   - Decoupled from `SpreadsheetWrapper` and `ShellLayout`.
6. **Mascot Viewport Overlay (`MascotOverlayLayer`):**
   - Full-screen viewport container at `z-40` with `pointer-events: none`, allowing spreadsheet canvas and toolbar clicks to pass through unobstructed.
   - Positions `MascotPlaceholder` and `TextBubble` using hardware-accelerated `translate3d` viewport coordinates.
7. **Presentational Mascot & Speech Bubble (`MascotPlaceholder`, `TextBubble`):**
   - Presentational components styled via typed props, rendering customizable geometry, glow/shadow lighting, borders, blur, opacity, and typography.
   - Declare `pointer-events: auto` to allow interactive clicks and dismiss actions without blocking underlying canvas outside their bounding boxes.
8. **Visual Customization Control Panel (`MascotCustomizerPanel`):**
   - Floating collapsible panel at `z-50` (`bottom-4 right-4`).
   - Dispatches real-time styling mutations to `useMascotStore` and triggers audio tests without obstructing lesson content.
9. **Procedural Sound Controller (`lib/audio/soundController.ts`):**
   - Zero-dependency Web Audio API singleton providing voice-mimicking syllable blips and a dual-mode guide completion fanfare.
   - Resilient to SSR/headless environments and browser autoplay policies.
10. **Store Boundary Decoupling (`store/mascotStore.ts` & `store/spreadsheetStore.ts`):**
    - `mascotStore` and `spreadsheetStore` maintain separate state domains. Mutations in one store have zero side effects on the other.

---

## 4. Core Data Contracts & State Management

### 4.1 Spreadsheet Display State (`store/spreadsheetStore.ts` — Contracts C1–C6)

Central Zustand store managing spreadsheet canvas appearance, dimming, and modal overlay state.

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

**Key Invariants:**
- Mutual exclusion between `isMinimized` and `isMaximized`.
- Automatic safety disable of `isInteractive` when `blurAmount > 0` or `opacity < 1.0`.
- Strict input clamping: `opacity` in `[0.0, 1.0]`, `blurAmount` in `[0, 20]`.

### 4.2 Mascot, Bubble & Audio State Store (`store/mascotStore.ts` — Contract C7)

Central Zustand store managing mascot visual parameters, text bubble typography and appearance, audio preferences, and customizer visibility.

```typescript
export type MascotShape = 'square' | 'rounded' | 'circle' | 'pill';
export type BubbleShape = 'rounded' | 'square' | 'speech-balloon';
export type TextAlignment = 'left' | 'center' | 'right';

export interface MascotLighting {
  glowColor: string;          // default 'rgba(59, 130, 246, 0.5)'
  glowBlur: number;           // px, clamped [0, 50], default 10
  glowSpread: number;         // px, clamped [0, 30], default 0
}

export interface MascotVisualProperties {
  shape: MascotShape;         // 'square' | 'rounded' | 'circle' | 'pill', default 'rounded'
  size: number;               // px, clamped [32, 256], default 80
  color: string;              // default '#3b82f6'
  borderColor: string;        // default '#1d4ed8'
  borderWidth: number;        // px, clamped [0, 12], default 2
  position: { x: number; y: number }; // Viewport coordinates, clamped >= 0, default { x: 40, y: 120 }
  lighting: MascotLighting;
  opacity: number;            // clamped [0.0, 1.0], default 1.0
  blur: number;               // px, clamped [0, 20], default 0
  isVisible: boolean;         // default true
}

export interface BubbleLighting {
  shadowColor: string;        // default 'rgba(0, 0, 0, 0.15)'
  shadowBlur: number;         // px, clamped [0, 50], default 12
  shadowSpread: number;       // px, clamped [0, 30], default 0
}

export interface BubbleTypography {
  fontSize: number;           // px, clamped [10, 32], default 14
  textColor: string;          // default '#1e293b'
  textAlign: TextAlignment;   // default 'left'
  fontWeight: string;         // default '500'
}

export interface TextBubbleProperties {
  text: string;               // default "Hello! I am your Excel guide."
  isVisible: boolean;         // default true
  shape: BubbleShape;         // default 'rounded'
  size: { maxWidth: number; padding: number }; // maxWidth [120, 600], padding [4, 32]
  color: string;              // default '#ffffff'
  borderColor: string;        // default '#e2e8f0'
  borderWidth: number;        // px, clamped [0, 8], default 1
  positionOffset: { x: number; y: number }; // Offset relative to mascot anchor, default { x: 96, y: -16 }
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

**Store Invariants:**
- **Boundary Clamping:** All dimensions, positions, blur, opacity, font size, and audio properties are strictly clamped to valid physical ranges.
- **Deep Merging:** Partial updates to nested structures (`lighting`, `position`, `typography`, `size`) preserve unspecified sibling properties.
- **Pristine Reset:** `resetAll()` atomically restores `mascot`, `bubble`, `sound`, and `isCustomizerOpen` to default values.
- **Store Decoupling:** Zero side effects on `spreadsheetStore`.

### 4.3 Procedural Sound Controller Service (`lib/audio/soundController.ts` — Contract C8)

Singleton audio service providing procedural voice-mimicking audio and completion fanfare via native Web Audio API.

```typescript
export interface SpeechOptions {
  pitch?: number;             // Multiplier [0.5, 2.0], default 1.0
  speed?: number;             // Syllables per second [1, 20], default 8
}

export interface ISoundController {
  initAudio(): Promise<AudioContext | null>;
  playSpeech(text?: string, options?: SpeechOptions): void;
  playCompletion(soundUrl?: string): Promise<void>;
  playTone(frequency: number, type?: OscillatorType, duration?: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  getVolume(): number;
  isMuted(): boolean;
  dispose(): void;
}
```

**Controller Invariants:**
- **SSR & Headless Safety:** Silently no-ops without throwing exceptions when running outside browser environments (`typeof window === 'undefined'` or missing `AudioContext`).
- **Autoplay Compliance:** Lazy-initializes and resumes `AudioContext` only upon user gesture or interaction.
- **Procedural Voice Synthesis:** Calculates syllable count from text (bounded [2, 12] blips) and synthesizes rapid formant-varied oscillator bursts with attack/decay gain envelopes.
- **Dual-Mode Completion Sound:** Fetches and decodes `soundUrl` when provided; falls back gracefully to a built-in procedural arpeggiated fanfare (C5-E5-G5-C6) upon network failure or omission.
- **Master Gain Routing:** Routes all oscillators and audio buffers through a single master `GainNode` reflecting `isMuted ? 0 : volume`.

### 4.4 Presentational, Overlay & Page Integration Contracts (Contracts C9–C12)

- **Contract C9 (`MascotPlaceholder.tsx`, `TextBubble.tsx`):** Pure visual components rendering shape geometries, lighting box-shadows, SVG graphics, and typography.
- **Contract C10 (`MascotOverlayLayer.tsx`):** Full-screen viewport host (`fixed inset-0 z-40 pointer-events-none`) translating mascot and anchored bubble via `translate3d`.
- **Contract C11 (`MascotCustomizerPanel.tsx`):** Floating real-time visual control panel (`fixed bottom-4 right-4 z-50`) with Mascot, Bubble, and Audio control tabs.
- **Contract C12 (`app/page.tsx`):** Application layout integrating `ShellLayout`, `MascotOverlayLayer`, `MascotCustomizerPanel`, and sidebar guide completion triggering.

> Detailed specifications for Contracts C7–C12 are documented in [`docs/contracts/mascot-customization-sound.md`](contracts/mascot-customization-sound.md).

---

## 5. Dataflow

1. **Spreadsheet Control Dataflow:**
   - User adjusts sliders or action toggles in `SpreadsheetControls` (or clicks backdrop/expand controls).
   - Actions on `useSpreadsheetStore` clamp inputs and enforce invariants atomically.
   - `SpreadsheetContainer` and `OverlayLayer` reactively update CSS filter/opacity styles or mount backdrops without re-rendering Univer.

2. **Mascot & Bubble Positioning Dataflow:**
   - User or lesson events dispatch position or styling updates (`setMascotPosition`, `setMascotProperties`, `setBubbleProperties`).
   - `MascotOverlayLayer` reactively recalculates CSS `translate3d` transforms for the mascot and offset-anchored text bubble.
   - All transform updates are isolated to the `z-40` overlay layer, causing zero reflows in the underlying spreadsheet canvas.

3. **Procedural Speech Sound Dataflow:**
   - Setting speech bubble text with `triggerSpeech = true` (or customizer "Speak" action) invokes `soundController.playSpeech(text, { pitch, speed })`.
   - The audio controller breaks text into syllable blip bursts, configures oscillator frequencies with micro-formant variation, modulates gain envelopes, and outputs via the master gain node.

4. **Guide Completion Event Dataflow:**
   - User clicks "Complete Guide" in the lesson sidebar (or completes an interactive educational milestone).
   - Sidebar event handler triggers `soundController.playCompletion()`, updates `mascotStore` with a celebratory message, and sets `bubble.isVisible` to `true`.
   - Sound controller executes the completion chime (or procedural fanfare) while the speech bubble displays celebratory guidance over the spreadsheet.

5. **Engine Isolation Invariant:**
   - Neither spreadsheet display state changes nor mascot/bubble/customizer mutations cause Univer canvas re-initialization or re-rendering.

---

## 6. Architectural Invariants

- **Client-Only Engine:** Univer packages (`0.5.2`, exact-pinned) rely on browser DOM/Canvas APIs and must always be loaded via `next/dynamic(..., { ssr: false })`.
- **Non-Interactive Safety:** Whenever `opacity < 1.0` or `blurAmount > 0`, `pointer-events` on `SpreadsheetContainer` is automatically disabled (`none`), while the minimized expand control remains clickable (`auto`).
- **Mutual Exclusion:** `isMinimized` and `isMaximized` cannot both be `true` simultaneously.
- **Unidirectional Display Control:** Display effects (blur, opacity, overlay, resize) wrap the spreadsheet container externally without mutating Univer's internal workbook state.
- **Viewport Overlay Passthrough (`z-40`, `pointer-events: none`):** The full-screen mascot overlay host MUST have `pointer-events: none` to ensure mouse events pass freely to spreadsheet cells, formula bar, and toolbar controls. Only interactive overlay children (`MascotPlaceholder`, `TextBubble`) declare `pointer-events: auto`.
- **Customizer Panel Stacking (`z-50`):** The floating customizer sits at `z-50` above the mascot layer and spreadsheet backdrop, maintaining click interactivity (`pointer-events: auto`).
- **Sound Controller SSR and Headless Safety:** `soundController` MUST be completely safe to import and execute in SSR (Node.js) and headless test runners without throwing exceptions when Web Audio APIs are absent.
- **Univer Lifecycle Isolation:** Mascot position, styling, customizer toggles, and audio events are isolated from Univer canvas lifecycle; Univer is mounted once dynamically (`ssr: false`) and never re-rendered by overlay actions.
- **Independent State Domain Isolation:** Mutations in `mascotStore` and `spreadsheetStore` have zero side effects on each other.
