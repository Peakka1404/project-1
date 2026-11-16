---
id: T-008
title: "Interactive Visual Customization Control Panel"
plan: "mascot-overlay-audio"
status: DONE         # READY | IN_PROGRESS | REVIEW | TESTING | DONE | BLOCKED
owner: "coder-agent-user"
blocked_type: ""       # AMBIGUOUS | CONFLICT | SCOPE | ENV | DEPENDENCY | FAILING | UNSAFE
depends_on:
  - T-005
  - T-006
parallel_group: "group-2"
deep_test: false
branch: "feature/mascot-overlay-audio"
---

# T-008: Interactive Visual Customization Control Panel

## Goal

Implement `components/MascotCustomizerPanel.tsx` providing a floating, collapsible UI panel at `fixed bottom-4 right-4 z-50` with real-time controls for mascot shape, dimensions, colors, lighting, position, opacity, blur; bubble text, shape, typography, lighting; and audio volume, mute, voice pitch, and sound test triggers.

## Contract

Contract C11 (`docs/contracts/mascot-customization-sound.md`):

### Mascot Customizer Panel (`components/MascotCustomizerPanel.tsx`)
- **Props:** None (connects to `useMascotStore` and `soundController`)
- **Docking & Positioning:** `fixed bottom-4 right-4 z-50`
- **Collapsed Mode:**
  - Floating action button/pill displaying: "🎨 Customize Mascot".
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

## Files to Modify

<!-- Files the coder MAY change. context_files are read-only. -->

### files_to_modify
- `components/MascotCustomizerPanel.tsx`

### context_files
- `store/mascotStore.ts`
- `lib/audio/soundController.ts`
- `docs/contracts/mascot-customization-sound.md`
- `docs/ARCHITECTURE.md`

### test_files
- `__tests__/components/MascotCustomizerPanel.test.ts`

## Out of Scope

- Mounting panel into `app/page.tsx` (handled in T-009).
- Modifying mascot or bubble display presentation components (handled in T-007).
- Persistent storage of customizer configuration to localStorage/DB.

## Requirements

1. Create `components/MascotCustomizerPanel.tsx` marked `'use client'`.
2. Connect to `useMascotStore`:
   - State: `mascot`, `bubble`, `sound`, `isCustomizerOpen`.
   - Actions: `setMascotProperties`, `setMascotPosition`, `setBubbleProperties`, `setBubbleText`, `setBubbleVisibility`, `setSoundSettings`, `toggleCustomizer`, `setCustomizerOpen`, `resetAll`.
3. Connect to `soundController` from `@/lib/audio/soundController`:
   - Methods: `playSpeech`, `playCompletion`, `setVolume`, `setMuted`.
4. Render container positioned at `fixed bottom-4 right-4 z-50`:
   - When `!isCustomizerOpen`: render a floating action button/pill displaying `"🎨 Customize Mascot"` that triggers `toggleCustomizer()` on click.
   - When `isCustomizerOpen`: render a floating card dialog (max-height `80vh`, overflow-y auto, width ~360px, shadow-xl, bg-white, rounded-xl, border).
5. In expanded card panel, implement:
   - **Header:** Title `"Customize Mascot"`, close button triggering `toggleCustomizer()`.
   - **Tabs or Sections:** Mascot, Bubble, Audio.
   - **Mascot section:**
     - Shape selector buttons/select (`square`, `rounded`, `circle`, `pill`).
     - Size slider (min 32, max 256).
     - Color inputs: Background color & border color.
     - Border width slider (min 0, max 12).
     - Lighting glow inputs: color, glowBlur slider (0-50), glowSpread slider (0-30).
     - Position X & Y sliders.
     - Opacity slider (0-1.0) and Blur slider (0-20).
   - **Bubble section:**
     - Text input for `bubble.text` with a "Speak" button calling `soundController.playSpeech(bubble.text, { pitch: sound.voicePitch, speed: sound.voiceSpeed })`.
     - Shape selector (`rounded`, `square`, `speech-balloon`).
     - Max width slider (120-600) and padding slider (4-32).
     - Color & border color pickers.
     - Typography: font size slider (10-32), text color picker, text align selector (`left`, `center`, `right`).
     - Opacity & blur sliders.
   - **Audio section:**
     - Volume slider (0-100%) calling `setSoundSettings({ volume })` and `soundController.setVolume(volume)`.
     - Mute toggle calling `setSoundSettings({ isMuted: !sound.isMuted })` and `soundController.setMuted(!sound.isMuted)`.
     - Voice pitch slider (0.5 to 2.0) calling `setSoundSettings({ voicePitch })`.
     - Button "Test Procedural Voice" calling `soundController.playSpeech("Hello learner!", { pitch: sound.voicePitch, speed: sound.voiceSpeed })`.
     - Button "Test Guide Completion Chime" calling `soundController.playCompletion()`.
   - **Footer:**
     - "Reset All" button calling `resetAll()`.
     - Close / Minimize button.

## Acceptance Criteria

- [x] `components/MascotCustomizerPanel.tsx` is exported and renders at `fixed bottom-4 right-4 z-50`.
- [x] In collapsed mode, renders `"🎨 Customize Mascot"` button that toggles open state.
- [x] In expanded mode, renders controls for mascot shape, dimensions, colors, lighting glow, position, opacity, and blur.
- [x] In expanded mode, renders controls for text bubble text, shape, dimensions, typography, lighting, and "Speak" button.
- [x] In expanded mode, renders audio volume slider, mute toggle, pitch slider, and test trigger buttons calling `soundController.playSpeech` and `soundController.playCompletion`.
- [x] "Reset All" button invokes `resetAll()` to restore pristine defaults across mascot, bubble, and sound settings.

## Verify Command

```
npx tsc --noEmit --allowImportingTsExtensions
```

## Blockers

<!-- None -->

## Decisions

<!-- None -->

## Implementation Report

### Changes Made and Why
- Implemented `components/MascotCustomizerPanel.tsx` adhering strictly to Contract C11.
- Component is marked `'use client'` and mounts fixed at `fixed bottom-4 right-4 z-50`.
- Supports Collapsed and Expanded states driven by `isCustomizerOpen` in `useMascotStore`:
  - Collapsed: renders pill button `"🎨 Customize Mascot"` which calls `toggleCustomizer()`.
  - Expanded: renders card dialog with header, tabbed sections (Mascot, Bubble, Audio), and footer action bar.
- Mascot tab:
  - Shape buttons: `rounded`, `square`, `circle`, `pill` calling `setMascotProperties({ shape })`.
  - Size slider: [32, 256] px with real-time numeric indicator.
  - Background & border color: `<input type="color">` and hex input text box.
  - Border width slider: [0, 12] px.
  - Lighting & glow: glow color input, blur slider [0, 50] px, spread slider [0, 30] px.
  - Position coordinates: X slider [0, 1400] and Y slider [0, 900] px calling `setMascotPosition`.
  - Opacity [0, 1.0] and Blur [0, 20] sliders.
- Bubble tab:
  - Bubble text message input/textarea with visibility toggle checkbox calling `setBubbleVisibility`.
  - "🗣️ Speak" button calling `soundController.playSpeech(bubble.text, { pitch: sound.voicePitch, speed: sound.voiceSpeed })`.
  - Bubble shape selector: `rounded`, `square`, `speech-balloon` calling `setBubbleProperties({ shape })`.
  - Max width [120, 600] px and padding [4, 32] px sliders.
  - Background and border color pickers with hex text inputs.
  - Typography: font size slider [10, 32] px, text color picker, and text alignment selector (`left`, `center`, `right`).
  - Opacity and blur sliders.
- Audio tab:
  - Master volume slider [0, 1.0] synced to both `setSoundSettings({ volume })` and `soundController.setVolume(volume)`.
  - Mute/unmute toggle button synced to `setSoundSettings({ isMuted })` and `soundController.setMuted()`.
  - Voice pitch multiplier slider [0.5, 2.0] calling `setSoundSettings({ voicePitch })`.
  - Voice speed slider [1, 20] calling `setSoundSettings({ voiceSpeed })`.
  - Test buttons: "🤖 Test Procedural Voice" and "🔔 Test Guide Completion Chime" calling `soundController.playSpeech` and `soundController.playCompletion`.
- Footer:
  - "Reset All" button calling `resetAll()`.
  - "Close" button calling `setCustomizerOpen(false)`.

### Files Modified
- `components/MascotCustomizerPanel.tsx` (new component)
- `.tasks/T-008-mascot-customizer-panel.md` (ticket status and report)

### Verification Commands & Results
- `npx tsc --noEmit --allowImportingTsExtensions`: Exit code 0 (TypeScript compilation succeeded without errors).
- `npm run lint`: Exit code 0 (No ESLint warnings or errors).
- `node --test __tests__/components/MascotCustomizerPanel.test.ts`: Exit code 0 (1 test passed, 0 failed).

### Assumptions
- Organized controls using clean tabs (Mascot, Bubble, Audio) within the 360px x 80vh panel to maximize ergonomics and prevent overwhelming vertical scroll.

### Risks
- None. Changes are fully localized to `components/MascotCustomizerPanel.tsx`.

## Gate Log

### Gatekeeper Verification (All Gates PASS)
- Gate 1 (Scope): PASS - Staged and committed files strictly match scope (`components/MascotCustomizerPanel.tsx`, `.tasks/T-008-mascot-customizer-panel.md`).
- Gate 2 (No new dependencies): PASS - `package.json` and lockfile untouched; zero new dependencies.
- Gate 3 (Verification reports): PASS - Implementation Report verified with passing `verify_command` output (`npx tsc --noEmit --allowImportingTsExtensions` exited 0, lint exited 0, test passed).
- Gate 4 (Acceptance criteria): PASS - All 6 acceptance criteria verified with code and test evidence.
- Gate 5 (Hygiene): PASS - No secrets, debug logs, or commented code.
- Gate 6 (Architecture): PASS - Respects module boundaries and Contract C11.
- Gate 7 (Assumptions): PASS - UI layout assumptions are internal and conform to Contract C11 specification.
- Commit: `a82aec703d05b9bc29e1082c4831f59cb65ad877`

