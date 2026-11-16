---
plan: mascot-overlay-audio
roadmap: none
status: APPROVED
---

# Plan Review: Mascot Overlay, Customization System & Procedural Audio (Phase 2)

## 1. Goal

Implement Phase 2 of the Excel teaching platform: an overlay mascot placeholder system positionable anywhere across the entire interface via viewport coordinates, accompanied by customizable speech/text bubbles, an interactive visual customization control panel for real-time styling adjustments, and a zero-dependency Web Audio API procedural sound system with guide completion audio playback.

The user-visible outcome is a playful, positionable mascot placeholder and speech bubble floating over the spreadsheet interface without blocking spreadsheet interactions, alongside an interactive floating customizer widget allowing learners and developers to tweak shapes, colors, lighting, typography, and audio volume in real time.

---

## 2. Decisions

1. **Accepted: Dedicated Viewport Overlay Layer (`MascotOverlayLayer.tsx`)**
   - *Reason:* A dedicated `fixed inset-0 z-40 pointer-events-none` container enables free positioning across the entire interface (sidebar, toolbar, spreadsheet canvas) without interfering with the spreadsheet modal backdrop (`OverlayLayer.tsx` at `z-30`).
2. **Accepted: Dedicated State Store (`store/mascotStore.ts`)**
   - *Reason:* Isolates mascot styling, text bubble typography, and audio settings from `spreadsheetStore.ts`, preserving existing display invariants and preventing unnecessary re-renders.
3. **Accepted: Procedural Web Audio Synthesis for Speech Mimicking**
   - *Reason:* Synthesizes short oscillator blips with formant pitch modulation via native Web Audio API, satisfying voice-mimicking requirements with zero external runtime dependencies.
4. **Accepted: Dual-Mode Guide Completion Sound**
   - *Reason:* Built-in procedural harmonic chime guarantees immediate sound playback even when static media files are missing, while still supporting custom audio file loading.
5. **Accepted: Floating Collapsible Customizer Panel (`MascotCustomizerPanel.tsx`)**
   - *Reason:* Positioned at `fixed bottom-4 right-4 z-50`, it preserves the left sidebar for educational lesson content while allowing instant real-time tweaking.
6. **Accepted: User-Gesture AudioContext Lifecycle Management**
   - *Reason:* Lazy-initializes and resumes `AudioContext` on user interaction to comply with modern browser autoplay policies without console warnings.
7. **Cut: External Audio and Animation Libraries (Howler.js, Tone.js, Framer Motion)**
   - *Reason:* Unnecessary bloat; standard Web Audio API and Tailwind CSS / CSS transitions fulfill all acceptance criteria natively.

---

## 3. Contracts

All inter-module interfaces are formally defined in [`docs/contracts/mascot-customization-sound.md`](../docs/contracts/mascot-customization-sound.md):

- **Contract C7: Mascot & Bubble State Store (`store/mascotStore.ts`)**
  - Types: `MascotVisualProperties`, `TextBubbleProperties`, `SoundSettingsState`, `MascotStoreState`.
  - Actions: `setMascotProperties`, `setMascotPosition`, `setBubbleProperties`, `setBubbleText`, `setBubbleVisibility`, `setSoundSettings`, `toggleCustomizer`, `setCustomizerOpen`, `resetAll`.
  - Invariants: Strict boundary clamping for sizes, borders, blur, opacity, lighting, typography, volume, and coordinates; deep merging for partial updates; pristine reset.
- **Contract C8: Sound Controller Service (`lib/audio/soundController.ts`)**
  - Methods: `initAudio`, `playSpeech`, `playCompletion`, `playTone`, `setVolume`, `setMuted`, `getVolume`, `isMuted`, `dispose`.
  - Invariants: SSR/headless safety (no-op in non-browser environments), autoplay resumption, procedural oscillator speech blips, dual-mode completion chime, master gain volume routing.
- **Contract C9: Mascot & Text Bubble Components (`components/MascotPlaceholder.tsx`, `components/TextBubble.tsx`)**
  - Presentational rendering with mapped shapes (`square`, `rounded`, `circle`, `pill`, `speech-balloon`), dynamic colors, borders, lighting glow/shadow, blur, opacity, and typography.
- **Contract C10: Mascot Overlay Layer (`components/MascotOverlayLayer.tsx`)**
  - Full-viewport container (`fixed inset-0 z-40 pointer-events-none`) with children having `pointer-events-auto` and viewport coordinate transform.
- **Contract C11: Mascot Customizer Panel (`components/MascotCustomizerPanel.tsx`)**
  - Floating collapsible panel (`fixed bottom-4 right-4 z-50`) with Mascot, Bubble, and Audio control tabs.
- **Contract C12: Page Composition & Event Integration (`app/page.tsx`)**
  - Hierarchy integrating `MascotOverlayLayer` and `MascotCustomizerPanel` alongside `ShellLayout` and spreadsheet container, with guide completion trigger wiring.

---

## 4. Work Items

### W1: Mascot & Text Bubble State Management Store
- **Goal:** Implement `store/mascotStore.ts` using Zustand to manage mascot visual properties, text bubble properties, sound settings, and customizer visibility with boundary clamping and reset invariants.
- **Expected modules/files:**
  - `store/mascotStore.ts` (new)
  - `__tests__/store/mascotStore.test.ts` (new)
- **Contract:** C7 (`docs/contracts/mascot-customization-sound.md`)
- **depends_on:** none
- **deep_test:** `true` — core state container with strict clamping rules, nested partial update merging, and reset invariants.
- **What could break:** Shallow copying could corrupt nested state objects; invalid clamping could emit invalid CSS properties.

### W2: Web Audio Sound System Controller
- **Goal:** Implement `lib/audio/soundController.ts` using native Web Audio API to provide procedural voice-mimicking speech blips, dual-mode guide completion sounds, master gain volume/mute control, and headless environment safety.
- **Expected modules/files:**
  - `lib/audio/soundController.ts` (new)
  - `__tests__/lib/soundController.test.ts` (new)
- **Contract:** C8 (`docs/contracts/mascot-customization-sound.md`)
- **depends_on:** none
- **deep_test:** `true` — audio node scheduling, gain envelopes, oscillator frequency synthesis, and headless mock verification.
- **What could break:** AudioContext access during SSR or headless test execution could throw ReferenceError; suspended autoplay policy could block sound output.

### W3: Mascot Placeholder, Text Bubble & Viewport Overlay Components
- **Goal:** Implement `components/MascotPlaceholder.tsx`, `components/TextBubble.tsx`, and `components/MascotOverlayLayer.tsx` to render customizable mascot shapes/lighting, speech bubble typography/container, and full-viewport coordinate positioning with pointer-events passthrough.
- **Expected modules/files:**
  - `components/MascotPlaceholder.tsx` (new)
  - `components/TextBubble.tsx` (new)
  - `components/MascotOverlayLayer.tsx` (new)
  - `__tests__/components/MascotPlaceholder.test.tsx` (new)
  - `__tests__/components/TextBubble.test.tsx` (new)
  - `__tests__/components/MascotOverlayLayer.test.tsx` (new)
- **Contract:** C9, C10 (`docs/contracts/mascot-customization-sound.md`)
- **depends_on:** W1
- **deep_test:** `true` — dynamic visual styling calculations, border radius mappings, inline styles, coordinate transforms, and pointer-events layering.
- **What could break:** Missing `pointer-events: none` on the overlay wrapper could intercept clicks to the underlying spreadsheet canvas or shell panels.

### W4: Interactive Visual Customization Control Panel
- **Goal:** Implement `components/MascotCustomizerPanel.tsx` providing a floating, collapsible UI panel at `fixed bottom-4 right-4 z-50` with real-time controls for mascot shape, dimensions, colors, lighting, position, opacity, blur; bubble text, shape, typography, lighting; and audio volume, mute, voice pitch, and test triggers.
- **Expected modules/files:**
  - `components/MascotCustomizerPanel.tsx` (new)
  - `__tests__/components/MascotCustomizerPanel.test.tsx` (new)
- **Contract:** C11 (`docs/contracts/mascot-customization-sound.md`)
- **depends_on:** W1, W2
- **deep_test:** `false` — standard UI control panel mapping user inputs directly to verified store actions and sound controller methods.
- **What could break:** High z-index panel occluding UI if not collapsible; form input handlers parsing invalid numeric values.

### W5: Application Shell Integration & Guide Completion Wiring
- **Goal:** Integrate `MascotOverlayLayer` and `MascotCustomizerPanel` into `app/page.tsx`, and wire a guide completion action in the lesson sidebar that plays the completion chime via `soundController.playCompletion()` and updates speech bubble text, ensuring seamless coexistence with Univer and existing controls.
- **Expected modules/files:**
  - `app/page.tsx` (modify)
  - `__tests__/app/page.test.tsx` (modify / extend)
- **Contract:** C12 (`docs/contracts/mascot-customization-sound.md`)
- **depends_on:** W2, W3, W4
- **deep_test:** `true` — page tree integration, layout coexistence, and end-to-end event triggering without regressing Univer lifecycle or display controls.
- **What could break:** Disruption of layout hierarchy could cause Univer spreadsheet re-initialization or break split-pane resizing.

---

## 5. Out of Scope

- Backend database persistence of user customization settings.
- 3D skeletal rigging or complex character skeletal animation systems.
- External third-party Cloud TTS services requiring network requests or external API keys.
- Modifications to Univer internal spreadsheet engine models or formula execution algorithms.
- Full curriculum lesson logic and interactive grading engines (reserved for Phase 3).

---

## 6. Open Risks

1. **Headless Web Audio Mocking in Node.js Test Runner:**
   - *Risk:* Node.js lacks native `AudioContext` and Web Audio nodes.
   - *Mitigation:* `soundController.ts` explicitly checks for window/AudioContext availability, and tests in `__tests__/lib/soundController.test.ts` supply lightweight mocks for `AudioContext`, `OscillatorNode`, and `GainNode`.
2. **Spreadsheet Click Interception by Overlay Layer:**
   - *Risk:* A viewport overlay covering the screen could accidentally block user clicks on the spreadsheet cells or formula bar.
   - *Mitigation:* Enforce `pointer-events: none` on `MascotOverlayLayer` container, with only the mascot, bubble, and control panel explicitly setting `pointer-events: auto`. Automated component tests will verify this CSS rule.
3. **Browser Audio Autoplay Policy:**
   - *Risk:* Modern browsers block unprompted audio playback until a user interaction gesture occurs.
   - *Mitigation:* AudioContext initialization is deferred to user interaction or button triggers, and calls to `audioContext.resume()` are made before playing synthesized tones.

---

## Tickets

- T-005 -> W1
- T-006 -> W2
- T-007 -> W3
- T-008 -> W4
- T-009 -> W5

