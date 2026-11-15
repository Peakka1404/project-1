---
id: T-006
title: "Web Audio Sound System Controller"
plan: "mascot-overlay-audio"
status: TESTING
owner: coder-agent-user
blocked_type: ""       # AMBIGUOUS | CONFLICT | SCOPE | ENV | DEPENDENCY | FAILING | UNSAFE
depends_on: []
parallel_group: "group-1"
deep_test: true
branch: "feature/mascot-overlay-audio"
---

# T-006: Web Audio Sound System Controller

## Goal

Implement `lib/audio/soundController.ts` using the native Web Audio API to provide procedural voice-mimicking speech blips, dual-mode guide completion sounds, master gain volume/mute control, and SSR/headless environment safety with zero external runtime dependencies.

## Contract

Contract C8 (`docs/contracts/mascot-customization-sound.md`):

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

### Invariants & Behavioral Rules:
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

## Files to Modify

<!-- Files the coder MAY change. context_files are read-only. -->

### files_to_modify
- `lib/audio/soundController.ts`

### context_files
- `docs/contracts/mascot-customization-sound.md`
- `docs/ARCHITECTURE.md`

### test_files
- `__tests__/lib/soundController.test.ts`

## Out of Scope

- External audio or synthesis libraries (Howler.js, Tone.js).
- Cloud TTS or remote audio APIs requiring network credentials.
- React UI components or button wiring (handled in W4/W5).
- Bundling large binary sound files into the repository.

## Requirements

1. Create `lib/audio/soundController.ts` with TypeScript types `SpeechOptions` and `ISoundController`.
2. Implement class `SoundController` implementing `ISoundController` and export a default singleton instance `soundController`:
   ```typescript
   export const soundController: ISoundController = new SoundController();
   ```
3. Support SSR and headless environments:
   - Check if `typeof window === 'undefined'` or if neither `window.AudioContext` nor `(window as any).webkitAudioContext` is defined.
   - In non-browser environments, `initAudio` resolves to `null`, and playback methods return silently without throwing.
4. Implement `initAudio()`:
   - Lazy-creates an `AudioContext` on first call.
   - Creates a master `GainNode` connected to `audioContext.destination`.
   - If `audioContext.state === 'suspended'`, calls `audioContext.resume()`.
   - Returns the `AudioContext` instance or `null`.
5. Implement `setVolume(volume: number)`:
   - Clamps `volume` to `[0.0, 1.0]`.
   - Updates internal volume state.
   - If not muted, sets `masterGainNode.gain.value = volume`.
6. Implement `setMuted(muted: boolean)`:
   - Updates internal mute state.
   - Sets `masterGainNode.gain.value = muted ? 0 : this.volume`.
7. Implement `getVolume()` returning current volume number, and `isMuted()` returning boolean.
8. Implement `playTone(frequency: number, type: OscillatorType = 'sine', duration: number = 0.1)`:
   - Checks audio initialization and mute/volume status.
   - Creates `OscillatorNode` with `frequency` and `type`.
   - Connects through an envelope `GainNode` into master `GainNode`.
   - Starts oscillator, applies attack/decay, and stops after `duration`.
9. Implement `playSpeech(text: string = '', options?: SpeechOptions)`:
   - Derives blip count from text length clamped between 2 and 12 blips.
   - Pitch multiplier default `1.0`, speed default `8` syllables/second.
   - For each blip, schedules an oscillator (e.g., triangle or square) with randomized formant variation in the 220Hz - 480Hz range multiplied by `pitch`.
   - Applies an envelope (35ms - 65ms) and spaces blips according to `speed`.
10. Implement `playCompletion(soundUrl?: string)`:
    - If `soundUrl` is provided, attempts to `fetch(soundUrl)` and `audioContext.decodeAudioData(buffer)` to play through an `AudioBufferSourceNode`.
    - If `soundUrl` is omitted or fetching/decoding fails, executes procedural fallback chime: arpeggiates C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), and C6 (1046.50 Hz) chord progression with smooth exponential decay.
11. Implement `dispose()`:
    - If `audioContext` exists and is not closed, closes `audioContext` and resets internal node references to `null`.

## Acceptance Criteria

- [x] `lib/audio/soundController.ts` exports `soundController` singleton adhering to `ISoundController` from Contract C8.
- [x] Safe SSR and headless execution: calling any method when `AudioContext` is unavailable does not throw errors and returns clean values/resolved promises.
- [x] Autoplay compliance: `initAudio` creates/resumes `AudioContext` on demand and handles suspended state.
- [x] `playSpeech` produces synthesized oscillator blips with frequency variations scaled by `pitch` multiplier and bounded between 2 and 12 notes.
- [x] `playCompletion` attempts audio file decoding when a URL is supplied and falls back to a procedural major chord arpeggio chime when omitted or on fetch error.
- [x] `setVolume` clamps input in `[0.0, 1.0]` and updates master gain node; `setMuted` silences master gain when true and restores volume when false.
- [x] `dispose` cleanly closes `AudioContext` and resets references.

## Verify Command

```
npx tsc --noEmit --allowImportingTsExtensions
```

## Blockers

None.

## Decisions

None needed.

## Implementation Report

### 1. Summary of Changes
- Created `lib/audio/soundController.ts` adhering strictly to Contract C8 (`docs/contracts/mascot-customization-sound.md`).
- Exported interfaces `SpeechOptions` and `ISoundController`, class `SoundController`, and singleton `soundController`.
- SSR and headless resilience: `isAudioSupported()` guards browser API access, returning clean resolved promises / no-ops in non-browser or headless contexts without throwing.
- Autoplay compliance: lazy-initializes `AudioContext` and master `GainNode` on demand, and resumes if suspended.
- Master gain routing: all audio output passes through a single master `GainNode` connecting to destination. Volume is clamped to `[0.0, 1.0]`, and muting sets master gain to 0 while preserving the volume state.
- Single oscillator tone: `playTone` with attack/decay envelope and configurable frequency, duration, and oscillator type.
- Procedural speech synthesis: `playSpeech` derives blip count between 2 and 12 from text length, schedules formant-varied oscillator blips (220Hz - 480Hz * pitch) with 35ms - 65ms attack/decay envelopes spaced according to syllable speed.
- Dual-mode completion sound: `playCompletion` loads and decodes remote audio via `fetch` and `decodeAudioData`, with graceful fallback to a procedural arpeggiated major chord fanfare (C5: 523.25Hz, E5: 659.25Hz, G5: 783.99Hz, C6: 1046.50Hz).
- Clean lifecycle disposal: `dispose` closes active `AudioContext`, disconnects master gain node, and resets references.

### 2. Files Modified
- `lib/audio/soundController.ts` (created)
- `.tasks/T-006-web-audio-sound-controller.md` (status to REVIEW, acceptance criteria checked, report added)

### 3. Verification Commands & Results
- `npx tsc --noEmit --allowImportingTsExtensions`: Pass (Exit code 0, 0 type errors)
- `npm run lint`: Pass (Exit code 0, 0 ESLint warnings or errors)
- Ticket `deep_test: true`: Deep test suite reserved for tester role per AGENTS.md rules.

### 4. Assumptions (Internal-Only)
- Default volume initialized to 0.7 to align with Contract C7 `sound.volume` default.
- Initial muted state initialized to false.

### 5. Risks
- None identified. Web Audio APIs are safely wrapped in feature detection and try/catch guards, preventing runtime errors in Node/SSR/JSDOM environments.

## Test Report

### 1. Test Execution Commands & Results
- **Verify Command (Typecheck):**
  - Command: `npx tsc --noEmit --allowImportingTsExtensions`
  - Output: Exit code 0 (Pass, 0 type errors)
- **Unit & Contract Test Suite:**
  - Command: `node --test --experimental-strip-types __tests__/lib/soundController.test.ts`
  - Output: Exit code 0 (37 tests passed, 0 failed, 9 suites, duration 124ms)
- **Linter:**
  - Command: `npm run lint`
  - Output: Exit code 0 (Pass, 0 ESLint warnings or errors)

### 2. Breakdown of Tested Areas
- **AC1 (Contract C8 Compliance & Singleton):**
  - Singleton `soundController` exported and implements all 9 methods in `ISoundController`.
  - Initial volume defaults to 0.7 and mute status defaults to false.
  - `SpeechOptions` type interface validation.
- **AC2 (SSR & Headless Execution Safety):**
  - `initAudio` resolves cleanly to `null` when `window` is undefined or when `AudioContext` is absent.
  - All playback methods (`playSpeech`, `playTone`, `playCompletion`), state methods (`setVolume`, `setMuted`), and `dispose` execute safely without throwing in SSR and headless environments.
- **AC3 (Autoplay Compliance & Lazy AudioContext Initialization):**
  - Lazy creation of `AudioContext` and master `GainNode` connected to destination.
  - Context resumption handled when suspended; graceful rejection handling if autoplay policy restricts playback.
  - Singleton context caching across repeated calls.
- **AC4 (Procedural Speech Synthesis):**
  - Blip count derivation correctly bounded between [2, 12] across empty, short, medium, and lengthy text inputs.
  - Formant pitch variation scaled proportionally with `pitch` multipliers (0.5x, 1.0x, 2.0x).
  - Syllable spacing adhering to `speed` option.
  - Output suppressed when muted or volume is 0.
- **AC5 (Dual-Mode Completion Chime):**
  - Default procedural fanfare triggers 4 harmonic chord arpeggios (C5 523.25Hz, E5 659.25Hz, G5 783.99Hz, C6 1046.50Hz) when `soundUrl` is omitted or empty.
  - Remote audio fetching and decoding via `createBufferSource()` when valid `soundUrl` is provided.
  - Graceful fallback to procedural fanfare when fetch returns non-200 status, network throws, or decode fails.
- **AC6 (Volume and Mute Control):**
  - `setVolume` strictly clamped within `[0.0, 1.0]`.
  - Muting sets master gain to 0 while preserving stored volume level.
  - Unmuting correctly restores the preserved volume level to master gain.
  - Volume adjustment while muted updates stored level without audible leakage.
- **AC7 (Lifecycle & Resource Disposal):**
  - `dispose()` cleanly invokes `AudioContext.close()`, disconnects master gain node, and resets internal references.
  - Idempotent disposal safe against multiple invocations.
- **Tone Generation & Edge Cases:**
  - `playTone` creates oscillator with designated frequency, type, and attack/decay gain envelope.
  - Default parameters and silence suppression when muted / zero volume.

### 3. Conclusion
- Result: PASS
- All acceptance criteria verified with deep unit tests.
- Status updated to `TESTING`. Ready for gatekeeper verification (`/gatekeeper-user T-006`).
