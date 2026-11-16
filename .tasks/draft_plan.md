# Draft Plan: Mascot Overlay, Customization System & Procedural Audio (Phase 2)

## User Request

> Implement Phase 2 of the Excel teaching platform: an overlay mascot placeholder system positionable anywhere across the entire interface, accompanied by customizable text bubbles, an interactive visual customization control panel, and a controllable sound system.
>
> ### Requirements
>
> #### R1. Mascot Placeholder Display
> - Provide a mascot display component rendered on an overlay layer that can be positioned anywhere across the entire interface via viewport coordinates.
> - Display an empty square or icon placeholder in its place as the initial mascot graphic.
> - The mascot placeholder must be customizable in shape, size, colour, position, lighting, opacity, and blur.
>
> #### R2. Text Bubble and Customization System
> - Provide a text bubble component that displays text alongside the mascot or on interface events.
> - Both the text bubble and the text inside it must be customizable in shape, size, colour, position, lighting, opacity, and blur.
> - Expose a programmatic state/API (store actions and configuration) giving callers full control over all mascot and text bubble properties.
> - Provide an interactive visual control panel on the interface to test and adjust all customization properties in real time.
>
> #### R3. Controllable Sound System
> - Provide a controllable sound system callable on demand.
> - Implement procedural voice-mimicking sound synthesis via Web Audio API that plays when the text bubble appears.
> - Support audio file loading and playback for event sounds, including a completion sound when a user completes a guide.
>
> ### Acceptance Criteria
>
> #### Mascot & Text Bubble Customization
> - [ ] Placeholder mascot renders anywhere across the interface via configurable viewport coordinates without disrupting spreadsheet or shell layout interactions.
> - [ ] Mascot visual properties (shape, size, colour, position, lighting, opacity, blur) update dynamically upon state changes.
> - [ ] Text bubble renders text with customizable shape, size, colour, position, lighting, opacity, and blur.
> - [ ] An interactive visual control panel is present in the UI allowing real-time inspection and adjustment of mascot and bubble customization properties.
>
> #### Audio System
> - [ ] Controllable programmatic API triggers sound playback on demand.
> - [ ] Procedural voice-mimicking audio plays via Web Audio API when the text bubble appears.
> - [ ] Sound playback triggers correctly on guide completion events.
>
> #### Verification & Automated Testing
> - [ ] Automated tests verify state mutations, actions, and boundary invariants for mascot, text bubble, and customization properties.
> - [ ] Automated component tests verify rendering, positioning, and visibility toggling for the mascot and text bubble.
> - [ ] Automated tests verify the audio controller interface and playback trigger invocations.

## Goal

Extend the Excel teaching platform with an interactive, positionable overlay mascot and customizable text bubble system, an on-screen visual customization control panel for real-time styling adjustments, and a zero-dependency Web Audio API procedural speech and event sound system with comprehensive automated test coverage.

## Proposed Scope

- **Mascot & Bubble State Management:**
  - Define state model and store actions for mascot visual properties: shape (e.g. square, rounded, circle), size (width, height), colors (background, border), position (viewport coordinates x/y), lighting (box-shadow / glow / highlight), opacity, and blur.
  - Define state model and store actions for text bubble properties: bubble container shape, size/padding, colors, relative/viewport position, lighting, opacity, blur, plus inner typography styling (font size, font color, text lighting, alignment).
  - Provide programmatic store actions to trigger speech display, dismiss bubbles, update visual properties, and reset to defaults with boundary clamping.
- **Mascot Placeholder Overlay Component:**
  - Render a mascot placeholder (empty square / geometric shape or icon placeholder) situated in an overlay layer spanning the entire application interface.
  - Position dynamically anywhere across the interface using configurable viewport coordinates.
  - Apply custom visual properties (shape, size, color, lighting/shadow, opacity, blur) dynamically.
  - Ensure mascot and overlay do not disrupt normal mouse and keyboard interactions with the underlying spreadsheet canvas or shell layout (using selective pointer-events passthrough).
- **Customizable Text Bubble Component:**
  - Render dynamic speech/text bubbles anchored to the mascot or positioned on interface events.
  - Implement dynamic styling for bubble container (shape, dimensions, background, border, shadow, opacity, blur) and contained text (font size, color, shadow).
  - Handle visibility toggles, text transitions, and dismiss interactions.
- **Interactive Visual Customization Control Panel:**
  - Implement an on-screen interactive control panel allowing users and developers to inspect and tune mascot and bubble properties in real time.
  - Provide interactive UI controls: numeric/range sliders (size, position coordinates, blur, opacity, shadow blur/spread), color pickers (mascot color, bubble color, text color), shape selectors (square, rounded, circle, pill), and a preset reset button.
  - Ensure the panel is collapsible or minimizable so it does not permanently occlude the spreadsheet workspace.
- **Procedural Speech & Event Sound System:**
  - Implement a sound controller module using the native Web Audio API (zero external runtime dependencies).
  - Synthesize procedural voice-mimicking audio (rhythmic frequency/formant-modulated oscillator blips or babble synthesis) triggered automatically when a text bubble appears or speech updates.
  - Provide sound event playback support, including loading external audio files or generating procedural celebration chimes for guide completion events.
  - Expose a programmatic controller API (play speech, play event, set volume, toggle mute) callable from UI components or lesson triggers.
- **Interface Integration:**
  - Mount the overlay mascot, text bubble, and customization panel in the primary application page layout (`app/page.tsx`) without breaking the existing `ShellLayout`, `SpreadsheetContainer`, or Univer engine.
- **Automated Verification & Testing:**
  - Automated unit tests covering store actions, state mutations, clamping rules, and reset invariants using Node's test runner (`node:test` / `npx sucrase-node`).
  - Automated component tests verifying mascot and text bubble DOM structure, styling classes/inline styles, coordinates, and visibility behavior.
  - Automated unit tests verifying the Web Audio controller (with Web Audio API node mocks) covering speech triggering, completion sound triggers, mute/volume management, and error handling.

## Affected Modules / Files (estimated)

> The following file list is estimated based on `docs/ARCHITECTURE.md` and codebase conventions. The Architect Reviewer will verify and finalize file targets.

- `store/mascotStore.ts` (new) — Zustand store managing mascot visual state, text bubble configuration, and customizer panel state.
- `components/MascotPlaceholder.tsx` (new) — Presentational component for the mascot graphic with dynamic shape, lighting, and coordinate positioning.
- `components/TextBubble.tsx` (new) — Speech bubble component rendering customizable container and typography.
- `components/MascotOverlayLayer.tsx` (new) — Full-viewport overlay container managing coordinate rendering and pointer-events passthrough for mascot and bubbles.
- `components/MascotCustomizerPanel.tsx` (new) — Real-time interactive UI control panel for adjusting mascot and bubble properties.
- `lib/audio/soundController.ts` (new) — Web Audio API procedural speech synthesizer and audio file/event playback service.
- `app/page.tsx` (modify) — Integrate mascot overlay and customization panel into the page tree.
- `docs/contracts/mascot-customization-sound.md` (new) — Architecture contract defining interfaces C7–C11 for Phase 2 components and services.
- `docs/ARCHITECTURE.md` (modify) — Update documentation with Phase 2 component hierarchy, data flow, and sound system invariants.
- `__tests__/store/mascotStore.test.ts` (new) — Unit tests for state management, clamping, and actions.
- `__tests__/components/MascotPlaceholder.test.tsx` (new) — Component tests for mascot rendering and style application.
- `__tests__/components/TextBubble.test.tsx` (new) — Component tests for text bubble rendering and typography customization.
- `__tests__/lib/soundController.test.ts` (new) — Unit tests for Web Audio procedural voice generation and event playback triggers.

## Out of Scope

- Backend persistence of user customization settings to a database (customization is managed in client state / Zustand).
- 3D models, skeletal rigging, or advanced character skeletal animations (placeholder graphics and SVG/CSS styling are specified).
- Full curriculum lesson logic, spreadsheet formula evaluation, or workbook grading engines (reserved for subsequent phases).
- External cloud Text-To-Speech (TTS) third-party services requiring network calls or paid API keys.
- Modifications to Univer spreadsheet internal engines or workbook data structures.

## Open Questions

1. **Overlay Layer Architecture:**
   - *Option A:* Create a dedicated full-screen overlay component (`MascotOverlayLayer.tsx`) at `fixed inset-0 z-40 pointer-events-none` (with children set to `pointer-events-auto`). This allows the mascot to traverse the entire interface (sidebar, header, spreadsheet) freely without interfering with the existing dimming `OverlayLayer` (`z-30`).
   - *Option B:* Refactor the existing `components/OverlayLayer.tsx` to handle both dimming modal prompts and floating mascot/bubble overlays.
   *(Architect Reviewer to decide; Option A maintains cleaner separation of concerns).*

2. **State Store Topology:**
   - *Option A:* Create a dedicated `store/mascotStore.ts` for mascot visual properties, bubble state, and customizer visibility. This keeps spreadsheet display invariants (`SpreadsheetDisplayState`) completely isolated from character customization state.
   - *Option B:* Merge mascot and sound state directly into `store/spreadsheetStore.ts`.
   *(Architect Reviewer to decide; Option A prevents monolithic store bloat).*

3. **Web Audio Autoplay and Initialization Policy:**
   - *Option A:* Lazy-initialize the Web Audio `AudioContext` on the first user interaction (click/keydown) anywhere in the application shell to comply with browser autoplay restrictions without throwing warnings.
   - *Option B:* Provide an explicit audio toggle / unmute button in the visual control panel that activates the `AudioContext`.
   *(Architect Reviewer to decide).*

4. **Guide Completion Sound Asset Strategy:**
   - *Option A:* Dual-mode audio player: implement procedural synthesis for the completion chime (e.g. pentatonic fanfare via Web Audio oscillators) as a built-in default, with support for loading optional external audio files (e.g. `.mp3`/`.wav`) if an asset URL is provided.
   - *Option B:* Rely strictly on bundled audio asset files in `public/sounds/`.
   *(Architect Reviewer to decide; Option A ensures reliable operation even if static media assets are absent).*

5. **Customizer Control Panel Placement in the UI:**
   - *Option A:* A floating, collapsible panel widget docked at the bottom-right or top-right of the viewport (`z-50`) that can be expanded or minimized.
   - *Option B:* An embedded panel placed within the left sidebar placeholder of `ShellLayout`.
   *(Architect Reviewer to decide).*

## Dependencies / Risks (if any)

- **Headless Node.js Test Environment for Web Audio API:** Node.js (`node:test`) does not include browser Web Audio API primitives (`AudioContext`, `OscillatorNode`, `GainNode`). Tests for `soundController.ts` must use lightweight mocks to verify scheduling, oscillator frequency assignment, and gain envelopes without failing in CI.
- **Pointer Events Click Passthrough:** Because the mascot overlay layer spans the entire viewport, improper CSS positioning or missing `pointer-events: none` on container wrappers could block user clicks on the spreadsheet grid, formula bar, or shell resizer panels.
- **CSS Filter / Shadow Performance:** Dynamic adjustment of CSS `filter: blur()` and heavy box shadows across animated positions can cause GPU repainting on lower-end devices. Hardware-accelerated CSS transforms (`translate3d`) and standard box shadows should be prioritized.
- **Browser AudioContext Autoplay Constraints:** Modern browsers block audio playback before a user gesture. The sound controller must gracefully handle suspended audio contexts and resume on initial user gesture.
