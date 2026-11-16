# Contracts: mascot-customization-sound (Phase 2)

This document specifies the architectural contracts between modules for Phase 2 of the Excel Teaching Platform: Overlay Mascot Placeholder, Customizable Text Bubble, Interactive Customization Control Panel, and Procedural Web Audio System.

---

## C7: Mascot & Bubble State Store (`store/mascotStore.ts`)

Central Zustand store managing mascot visual parameters, text bubble typography and appearance, audio preferences, and customizer visibility.

### Data Types

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

### Store Invariants

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
   - Updating nested structures (e.g. `setMascotProperties({ lighting: { glowBlur: 20 } })` or `setBubbleProperties({ typography: { fontSize: 18 } })`) deep-merges with existing values without overwriting unspecified siblings.
3. **Pristine Reset:**
   - Calling `resetAll()` atomically reverts `mascot`, `bubble`, `sound`, and `isCustomizerOpen` to default values.
4. **Isolation:**
   - State mutations in `mascotStore` have zero impact on `spreadsheetStore` invariants (`opacity`, `blurAmount`, `isMinimized`, `isMaximized`, `isInteractive`).

---

## C8: Sound Controller Service (`lib/audio/soundController.ts`)

Procedural Web Audio API sound generator and media loader with zero external runtime dependencies.

### Interface

```typescript
export interface SpeechOptions {
  pitch?: number;             // Multiplier, default 1.0 (base ~300Hz)
  speed?: number;             // Syllables per second, default 8
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

### Invariants & Behavioral Rules

1. **Environment Resilience (SSR / Headless Safety):**
   - If `typeof window === 'undefined'` or browser audio APIs (`AudioContext` / `webkitAudioContext`) are absent, all methods silently no-op and return resolved promises. Never throw runtime exceptions.
2. **Autoplay Compliance:**
   - Lazy-initializes or resumes `AudioContext` only on user interaction or explicit call. If `audioContext.state === 'suspended'`, calls `audioContext.resume()` gracefully.
3. **Procedural Voice-Mimicking Synthesis:**
   - `playSpeech(text)` calculates syllable/blip count from `text.length` (or word count), bounded between 2 and 12 blips.
   - Each blip is synthesized using an oscillator (triangle/square) with randomized micro-pitch formant variation (220Hz - 480Hz * pitch), passed through a rapid attack/decay gain envelope (35ms - 65ms).
   - If `isMuted` is `true` or `volume === 0`, synthesis does not produce audible output.
4. **Dual-Mode Completion Chime:**
   - `playCompletion(soundUrl)` attempts to load and decode `soundUrl` if provided.
   - If `soundUrl` is omitted, fails to fetch, or fails decoding, it falls back to a built-in procedural victory fanfare (arpeggiated C5-E5-G5-C6 major chord progression with harmonic sustain).
5. **Master Gain Routing:**
   - All synthesized nodes and buffer sources connect through a single master `GainNode` before `audioContext.destination`. Master gain reflects `isMuted ? 0 : volume`.

---

## C9: Mascot & Text Bubble Components

Presentational visual components rendered within the overlay layer.

### C9.1: MascotPlaceholder (`components/MascotPlaceholder.tsx`)

- **Props:**
  ```typescript
  interface MascotPlaceholderProps {
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
  interface TextBubbleProps {
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
  - Dismiss button: clickable close icon in top corner calling `onDismiss` (sets `isVisible: false`).
  - Hidden State: if `bubbleProps.isVisible === false`, returns `null`.

---

## C10: Mascot Overlay Layer (`components/MascotOverlayLayer.tsx`)

Full-viewport coordinate host positioning the mascot and text bubble across the entire application interface.

### Specifications

- **Props:** None (reads `mascotStore` directly)
- **Container Styling:**
  - `fixed inset-0 z-40 pointer-events-none overflow-hidden`
- **Coordinate Positioning:**
  - Mascot wrapper positioned at `style={{ transform: \`translate3d(${mascot.position.x}px, ${mascot.position.y}px, 0)\` }}`.
  - Text bubble anchored relative to mascot at `style={{ transform: \`translate3d(${mascot.position.x + bubble.positionOffset.x}px, ${mascot.position.y + bubble.positionOffset.y}px, 0)\` }}`.
- **Pointer-Events Passthrough Invariant:**
  - Outer viewport layer MUST have `pointer-events: none`.
  - Inner mascot and bubble containers MUST have `pointer-events: auto`.
  - Result: Spreadsheet cells, formula bar, toolbar controls, and sidebar handle all receive normal clicks unobstructed.

---

## C11: Mascot Customizer Panel (`components/MascotCustomizerPanel.tsx`)

Interactive on-screen visual control panel for testing and adjusting all customization properties in real time.

### Specifications

- **Props:** None (connects to `useMascotStore`)
- **Docking & Positioning:**
  - `fixed bottom-4 right-4 z-50`
- **Collapsed Mode:**
  - Floating action pill / button displaying: "🎨 Customize Mascot".
  - Clicking calls `toggleCustomizer()` to expand.
- **Expanded Mode:**
  - Card panel (max height `80vh`, scrollable content, width ~360px) with header, tabs/sections, and footer.
  - **Section 1: Mascot Controls**
    - Shape selector (Square, Rounded, Circle, Pill).
    - Size slider (32px to 256px).
    - Background color picker + hex input.
    - Border color picker & border width slider (0px to 12px).
    - Lighting glow color picker, blur slider (0-50px), spread slider (0-30px).
    - Position X & Y coordinate sliders.
    - Opacity (0% to 100%) and Blur (0px to 20px) sliders.
  - **Section 2: Text Bubble Controls**
    - Text message input with "Speak" button.
    - Bubble shape selector (Rounded, Square, Balloon).
    - Max width slider (120px to 600px) & padding slider (4px to 32px).
    - Background color & border color pickers.
    - Typography: font size slider (10px to 32px), text color picker, text align selector.
    - Opacity & blur sliders.
  - **Section 3: Audio & Sound Controls**
    - Master volume slider (0% to 100%).
    - Mute / Unmute toggle button.
    - Voice pitch multiplier slider (0.5x to 2.0x).
    - "Test Procedural Voice" button.
    - "Test Guide Completion Chime" button.
  - **Footer Action Bar:**
    - "Reset All" button calling `resetAll()`.
    - Minimize / Close button.

---

## C12: Page Composition & Event Integration (`app/page.tsx`)

Integration contract mounting Phase 2 components into the main application layout tree.

### Hierarchy

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

### Event Invariant

- Guide completion trigger in sidebar calls `soundController.playCompletion()` and updates bubble text to celebrate completion.
- Page mount does not re-render Univer spreadsheet instance when mascot coordinates or styling properties change.
