/**
 * Web Audio Sound System Controller
 *
 * Implements Contract C8: Procedural Web Audio API sound generator and media loader
 * with zero external runtime dependencies.
 *
 * Features:
 * - SSR & headless environment safe (returns cleanly without throwing)
 * - Autoplay compliance (lazy AudioContext instantiation and resume)
 * - Procedural voice-mimicking synthesis (formant-varied speech blips)
 * - Dual-mode completion chime (URL fetch/decode with major chord arpeggio fallback)
 * - Master gain control for volume and muting
 */

export interface SpeechOptions {
  pitch?: number; // Multiplier, default 1.0 (base ~300Hz)
  speed?: number; // Syllables per second, default 8
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

export class SoundController implements ISoundController {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volumeState: number = 0.7;
  private isMutedState: boolean = false;

  constructor() {
    // Safe initialization without accessing window or audio APIs at import time
  }

  /**
   * Check whether the execution environment supports Web Audio.
   */
  private isAudioSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const hasAudioContext =
      typeof window.AudioContext !== 'undefined' ||
      typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !==
        'undefined';
    return Boolean(hasAudioContext);
  }

  /**
   * Synchronously get or create AudioContext and master GainNode.
   */
  private ensureAudioContext(): AudioContext | null {
    if (!this.isAudioSupported()) {
      return null;
    }

    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
          return null;
        }

        this.audioContext = new AudioContextClass();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.isMutedState ? 0 : this.volumeState;
        this.masterGain.connect(this.audioContext.destination);
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      return this.audioContext;
    } catch {
      return null;
    }
  }

  /**
   * Lazy-initializes or resumes AudioContext. Returns the AudioContext instance or null.
   * Autoplay compliant: resumes suspended context.
   */
  async initAudio(): Promise<AudioContext | null> {
    if (!this.isAudioSupported()) {
      return null;
    }

    const ctx = this.ensureAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    return ctx;
  }

  /**
   * Sets master volume clamped to [0.0, 1.0].
   * Updates master GainNode if not muted.
   */
  setVolume(volume: number): void {
    if (typeof volume !== 'number' || Number.isNaN(volume)) {
      volume = 0;
    }
    this.volumeState = Math.max(0, Math.min(1, volume));

    if (this.masterGain && !this.isMutedState) {
      this.masterGain.gain.value = this.volumeState;
    }
  }

  /**
   * Sets mute state.
   * Updates master GainNode to 0 if muted, or restores volume if unmuted.
   */
  setMuted(muted: boolean): void {
    this.isMutedState = Boolean(muted);

    if (this.masterGain) {
      this.masterGain.gain.value = this.isMutedState ? 0 : this.volumeState;
    }
  }

  /**
   * Returns current master volume [0.0, 1.0].
   */
  getVolume(): number {
    return this.volumeState;
  }

  /**
   * Returns current mute status.
   */
  isMuted(): boolean {
    return this.isMutedState;
  }

  /**
   * Plays a single oscillator tone through master gain with attack/decay envelope.
   */
  playTone(frequency: number, type: OscillatorType = 'sine', duration: number = 0.1): void {
    if (!this.isAudioSupported() || this.isMutedState || this.volumeState <= 0) {
      return;
    }

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.masterGain) {
      return;
    }

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = type;
      if (osc.frequency.setValueAtTime) {
        osc.frequency.setValueAtTime(frequency, now);
      } else {
        osc.frequency.value = frequency;
      }

      const attack = Math.min(0.01, duration * 0.1);
      if (env.gain.setValueAtTime) {
        env.gain.setValueAtTime(0.0001, now);
        if (env.gain.linearRampToValueAtTime) {
          env.gain.linearRampToValueAtTime(0.3, now + attack);
          if (env.gain.exponentialRampToValueAtTime) {
            env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
          } else {
            env.gain.linearRampToValueAtTime(0.0001, now + duration);
          }
        } else {
          env.gain.value = 0.3;
        }
      } else {
        env.gain.value = 0.3;
      }

      osc.connect(env);
      env.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        try {
          osc.disconnect();
          env.disconnect();
        } catch {
          // ignore
        }
      };
    } catch {
      // Gracefully handle any scheduling/audio errors
    }
  }

  /**
   * Procedural voice-mimicking synthesis.
   * Calculates blip count from text length bounded between 2 and 12 blips.
   * Schedules rapid formant-varied oscillator blips with attack/decay envelopes.
   */
  playSpeech(text?: string, options?: SpeechOptions): void {
    if (!this.isAudioSupported() || this.isMutedState || this.volumeState <= 0) {
      return;
    }

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.masterGain) {
      return;
    }

    const pitch = typeof options?.pitch === 'number' && !Number.isNaN(options.pitch) ? options.pitch : 1.0;
    const speed =
      typeof options?.speed === 'number' && !Number.isNaN(options.speed) && options.speed > 0
        ? options.speed
        : 8;

    const content = (text ?? '').trim();
    let blipCount = 4;
    if (content.length === 0) {
      blipCount = 2;
    } else {
      const words = content.split(/\s+/).filter(Boolean).length;
      const chars = content.length;
      const estimated = Math.max(words, Math.round(chars / 5));
      blipCount = Math.max(2, Math.min(12, estimated));
    }

    try {
      const now = ctx.currentTime;
      const blipInterval = 1 / speed;

      for (let i = 0; i < blipCount; i++) {
        const blipStart = now + i * blipInterval;
        const blipDuration = 0.035 + Math.random() * 0.030; // 35ms - 65ms

        // Formant pitch variation between 220Hz and 480Hz scaled by pitch
        const baseFreq = 220 + Math.random() * (480 - 220);
        const freq = baseFreq * pitch;

        const osc = ctx.createOscillator();
        const env = ctx.createGain();

        osc.type = 'triangle';

        if (osc.frequency.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, blipStart);
          if (osc.frequency.linearRampToValueAtTime) {
            osc.frequency.linearRampToValueAtTime(
              freq * (1 + (Math.random() * 0.08 - 0.04)),
              blipStart + blipDuration
            );
          }
        } else {
          osc.frequency.value = freq;
        }

        const attackTime = 0.008; // 8ms rapid attack
        if (env.gain.setValueAtTime) {
          env.gain.setValueAtTime(0.0001, blipStart);
          if (env.gain.linearRampToValueAtTime) {
            env.gain.linearRampToValueAtTime(0.25, blipStart + attackTime);
            if (env.gain.exponentialRampToValueAtTime) {
              env.gain.exponentialRampToValueAtTime(0.0001, blipStart + blipDuration);
            } else {
              env.gain.linearRampToValueAtTime(0.0001, blipStart + blipDuration);
            }
          } else {
            env.gain.value = 0.25;
          }
        } else {
          env.gain.value = 0.25;
        }

        osc.connect(env);
        env.connect(this.masterGain);

        osc.start(blipStart);
        osc.stop(blipStart + blipDuration);

        osc.onended = () => {
          try {
            osc.disconnect();
            env.disconnect();
          } catch {
            // ignore
          }
        };
      }
    } catch {
      // Gracefully handle any audio scheduling issues
    }
  }

  /**
   * Dual-mode guide completion chime.
   * Attempts fetch and decode of soundUrl if supplied; on omission or error, falls back
   * to a procedural victory fanfare chord progression: C5, E5, G5, C6.
   */
  async playCompletion(soundUrl?: string): Promise<void> {
    if (!this.isAudioSupported()) {
      return;
    }

    const ctx = await this.initAudio();
    if (!ctx || !this.masterGain) {
      return;
    }

    if (soundUrl && typeof soundUrl === 'string' && soundUrl.trim().length > 0) {
      try {
        const response = await fetch(soundUrl);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
          const promiseOrVoid = ctx.decodeAudioData(
            arrayBuffer,
            (decoded) => resolve(decoded),
            (err) => reject(err)
          );
          if (promiseOrVoid && typeof (promiseOrVoid as Promise<AudioBuffer>).then === 'function') {
            (promiseOrVoid as Promise<AudioBuffer>).then(resolve).catch(reject);
          }
        });

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.masterGain);
        source.start();
        return;
      } catch {
        // Fall back to built-in procedural victory fanfare
      }
    }

    this.playProceduralFanfare(ctx);
  }

  /**
   * Synthesize procedural fanfare chord progression: C5 (523.25 Hz), E5 (659.25 Hz),
   * G5 (783.99 Hz), and C6 (1046.50 Hz) with harmonic decay.
   */
  private playProceduralFanfare(ctx: AudioContext): void {
    if (!this.masterGain) {
      return;
    }

    const notes = [
      { freq: 523.25, timeOffset: 0.0, duration: 0.6 }, // C5
      { freq: 659.25, timeOffset: 0.1, duration: 0.6 }, // E5
      { freq: 783.99, timeOffset: 0.2, duration: 0.6 }, // G5
      { freq: 1046.5, timeOffset: 0.3, duration: 0.9 }, // C6
    ];

    const now = ctx.currentTime;

    for (const note of notes) {
      try {
        const startTime = now + note.timeOffset;
        const stopTime = startTime + note.duration;

        const osc = ctx.createOscillator();
        const env = ctx.createGain();

        osc.type = 'triangle';
        if (osc.frequency.setValueAtTime) {
          osc.frequency.setValueAtTime(note.freq, startTime);
        } else {
          osc.frequency.value = note.freq;
        }

        const attack = 0.015; // 15ms attack
        if (env.gain.setValueAtTime) {
          env.gain.setValueAtTime(0.0001, startTime);
          if (env.gain.linearRampToValueAtTime) {
            env.gain.linearRampToValueAtTime(0.3, startTime + attack);
            if (env.gain.exponentialRampToValueAtTime) {
              env.gain.exponentialRampToValueAtTime(0.0001, stopTime);
            } else {
              env.gain.linearRampToValueAtTime(0.0001, stopTime);
            }
          } else {
            env.gain.value = 0.3;
          }
        } else {
          env.gain.value = 0.3;
        }

        osc.connect(env);
        env.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(stopTime);

        osc.onended = () => {
          try {
            osc.disconnect();
            env.disconnect();
          } catch {
            // ignore
          }
        };
      } catch {
        // ignore
      }
    }
  }

  /**
   * Cleanly closes AudioContext and resets internal references.
   */
  dispose(): void {
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
      }
      this.audioContext = null;
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // ignore
      }
      this.masterGain = null;
    }
  }
}

export const soundController: ISoundController = new SoundController();
export default soundController;
