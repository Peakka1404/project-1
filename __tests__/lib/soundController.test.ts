import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { soundController, SoundController } from '../../lib/audio/soundController.ts';
import type { ISoundController, SpeechOptions } from '../../lib/audio/soundController.ts';

// ============================================================================
// Web Audio API Mocks for Headless / Unit Testing
// ============================================================================

interface ScheduledRamp {
  type: 'set' | 'linear' | 'exponential';
  value: number;
  time: number;
}

class MockAudioParam {
  value: number;
  scheduledEvents: ScheduledRamp[] = [];

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  setValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledEvents.push({ type: 'set', value: val, time });
  }

  linearRampToValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledEvents.push({ type: 'linear', value: val, time });
  }

  exponentialRampToValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledEvents.push({ type: 'exponential', value: val, time });
  }
}

class MockAudioNode {
  connections: unknown[] = [];
  disconnected: boolean = false;

  connect(target: unknown): unknown {
    this.connections.push(target);
    return target;
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

class MockGainNode extends MockAudioNode {
  gain: MockAudioParam;

  constructor(initialGain: number = 1.0) {
    super();
    this.gain = new MockAudioParam(initialGain);
  }
}

class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = 'sine';
  frequency: MockAudioParam;
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  onended: (() => void) | null = null;

  constructor(initialFreq: number = 440) {
    super();
    this.frequency = new MockAudioParam(initialFreq);
  }

  start(time?: number): void {
    this.startedAt = time ?? 0;
  }

  stop(time?: number): void {
    this.stoppedAt = time ?? 0;
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  buffer: unknown = null;
  startedAt: number | null = null;
  stoppedAt: number | null = null;

  start(time?: number): void {
    this.startedAt = time ?? 0;
  }

  stop(time?: number): void {
    this.stoppedAt = time ?? 0;
  }
}

class MockAudioContext {
  currentTime: number = 1.0;
  state: AudioContextState = 'suspended';
  destination: MockAudioNode = new MockAudioNode();
  resumeCallCount: number = 0;
  closeCallCount: number = 0;
  shouldResumeReject: boolean = false;
  shouldDecodeReject: boolean = false;

  gainNodes: MockGainNode[] = [];
  oscillatorNodes: MockOscillatorNode[] = [];
  bufferSourceNodes: MockAudioBufferSourceNode[] = [];

  createGain(): MockGainNode {
    const node = new MockGainNode();
    this.gainNodes.push(node);
    return node;
  }

  createOscillator(): MockOscillatorNode {
    const node = new MockOscillatorNode();
    this.oscillatorNodes.push(node);
    return node;
  }

  createBufferSource(): MockAudioBufferSourceNode {
    const node = new MockAudioBufferSourceNode();
    this.bufferSourceNodes.push(node);
    return node;
  }

  decodeAudioData(
    _buffer: ArrayBuffer,
    successCallback?: (decoded: unknown) => void,
    errorCallback?: (err: unknown) => void
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (this.shouldDecodeReject) {
        const err = new Error('Audio decoding failed');
        if (errorCallback) errorCallback(err);
        reject(err);
      } else {
        const dummyBuffer = { duration: 1.2, length: 52920, sampleRate: 44100 };
        if (successCallback) successCallback(dummyBuffer);
        resolve(dummyBuffer);
      }
    });
  }

  async resume(): Promise<void> {
    this.resumeCallCount++;
    if (this.shouldResumeReject) {
      throw new Error('Autoplay policy prevented audio resumption');
    }
    this.state = 'running';
  }

  async close(): Promise<void> {
    this.closeCallCount++;
    this.state = 'closed';
  }
}

let lastMockContext: MockAudioContext | null = null;

function getLastMockContext(): MockAudioContext | null {
  return lastMockContext;
}

class TestAudioContext extends MockAudioContext {
  constructor() {
    super();
    lastMockContext = this;
  }
}

function installBrowserAudioMock(): void {
  lastMockContext = null;
  (globalThis as unknown as { window?: unknown }).window = {
    AudioContext: TestAudioContext,
  };
}

function removeBrowserAudioMock(): void {
  delete (globalThis as unknown as { window?: unknown }).window;
  lastMockContext = null;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Web Audio Sound Controller (Contract C8 & T-006)', () => {

  describe('AC1: Singleton and Contract C8 Compliance', () => {
    test('exports soundController singleton adhering to ISoundController', () => {
      assert.ok(soundController, 'soundController singleton must be defined');
      assert.strictEqual(typeof soundController.initAudio, 'function');
      assert.strictEqual(typeof soundController.playSpeech, 'function');
      assert.strictEqual(typeof soundController.playCompletion, 'function');
      assert.strictEqual(typeof soundController.playTone, 'function');
      assert.strictEqual(typeof soundController.setVolume, 'function');
      assert.strictEqual(typeof soundController.setMuted, 'function');
      assert.strictEqual(typeof soundController.getVolume, 'function');
      assert.strictEqual(typeof soundController.isMuted, 'function');
      assert.strictEqual(typeof soundController.dispose, 'function');
    });

    test('initial state matches specification (default volume 0.7, unmuted)', () => {
      const controller = new SoundController();
      assert.strictEqual(controller.getVolume(), 0.7);
      assert.strictEqual(controller.isMuted(), false);
    });

    test('SpeechOptions interface allows pitch and speed configuration', () => {
      const opts: SpeechOptions = { pitch: 1.2, speed: 10 };
      assert.strictEqual(opts.pitch, 1.2);
      assert.strictEqual(opts.speed, 10);
    });
  });

  describe('AC2: Safe SSR and Headless Execution', () => {
    beforeEach(() => {
      removeBrowserAudioMock(); // Ensure window is undefined
    });

    test('calling initAudio when window is undefined resolves to null without throwing', async () => {
      const controller = new SoundController();
      const result = await controller.initAudio();
      assert.strictEqual(result, null);
    });

    test('playSpeech safely no-ops in SSR environment without throwing', () => {
      const controller = new SoundController();
      assert.doesNotThrow(() => {
        controller.playSpeech('Hello world in SSR');
        controller.playSpeech('', { pitch: 1.5, speed: 12 });
        controller.playSpeech(undefined);
      });
    });

    test('playTone safely no-ops in SSR environment without throwing', () => {
      const controller = new SoundController();
      assert.doesNotThrow(() => {
        controller.playTone(440, 'triangle', 0.2);
        controller.playTone(880);
      });
    });

    test('playCompletion safely no-ops in SSR environment without throwing', async () => {
      const controller = new SoundController();
      await assert.doesNotReject(async () => {
        await controller.playCompletion();
        await controller.playCompletion('https://example.com/victory.mp3');
      });
    });

    test('volume and mute controls function correctly in SSR environment', () => {
      const controller = new SoundController();
      controller.setVolume(0.4);
      assert.strictEqual(controller.getVolume(), 0.4);

      controller.setMuted(true);
      assert.strictEqual(controller.isMuted(), true);

      controller.setMuted(false);
      assert.strictEqual(controller.isMuted(), false);
    });

    test('dispose safely no-ops in SSR environment without throwing', () => {
      const controller = new SoundController();
      assert.doesNotThrow(() => {
        controller.dispose();
      });
    });

    test('safely handles browser environment where AudioContext is undefined', async () => {
      (globalThis as unknown as { window?: unknown }).window = {};
      try {
        const controller = new SoundController();
        const ctx = await controller.initAudio();
        assert.strictEqual(ctx, null);

        assert.doesNotThrow(() => {
          controller.playTone(440);
          controller.playSpeech('Test no AudioContext');
        });
      } finally {
        delete (globalThis as unknown as { window?: unknown }).window;
      }
    });
  });

  describe('AC3: Autoplay Compliance and AudioContext Initialization', () => {
    beforeEach(() => {
      installBrowserAudioMock();
    });

    afterEach(() => {
      removeBrowserAudioMock();
    });

    test('initAudio lazily instantiates AudioContext and creates master GainNode', async () => {
      const controller = new SoundController();
      assert.strictEqual(getLastMockContext(), null, 'Context should not be created prior to init');

      const ctx = await controller.initAudio();
      assert.ok(ctx, 'AudioContext should be returned');
      const mockCtx = getLastMockContext();
      assert.ok(mockCtx, 'Mock context should be created');
      assert.strictEqual(mockCtx.gainNodes.length, 1, 'Master gain node should be created');

      const masterGain = mockCtx.gainNodes[0];
      assert.strictEqual(masterGain.gain.value, 0.7, 'Master gain should match default volume');
      assert.ok(
        masterGain.connections.includes(mockCtx.destination),
        'Master gain should connect to destination'
      );
    });

    test('initAudio resumes AudioContext when state is suspended', async () => {
      const controller = new SoundController();
      const ctx = await controller.initAudio();

      assert.ok(ctx);
      assert.strictEqual(lastMockContext?.resumeCallCount, 1);
      assert.strictEqual(lastMockContext?.state, 'running');
    });

    test('initAudio gracefully handles rejected resume() without throwing', async () => {
      const controller = new SoundController();
      // Ensure the context created will reject resume
      const originalTestAudioContext = (globalThis as unknown as { window: { AudioContext: typeof TestAudioContext } }).window.AudioContext;
      class RejectingAudioContext extends TestAudioContext {
        constructor() {
          super();
          this.shouldResumeReject = true;
        }
      }
      (globalThis as unknown as { window: { AudioContext: unknown } }).window.AudioContext = RejectingAudioContext;

      await assert.doesNotReject(async () => {
        const ctx = await controller.initAudio();
        assert.ok(ctx, 'AudioContext still returns even if resume rejected');
      });

      (globalThis as unknown as { window: { AudioContext: unknown } }).window.AudioContext = originalTestAudioContext;
    });

    test('ensureAudioContext reuses active context instead of recreating', async () => {
      const controller = new SoundController();
      const ctx1 = await controller.initAudio();
      const firstContextInstance = lastMockContext;

      const ctx2 = await controller.initAudio();
      assert.strictEqual(ctx1, ctx2, 'Consecutive init calls should return the same AudioContext instance');
      assert.strictEqual(lastMockContext, firstContextInstance);
    });
  });

  describe('AC4: Procedural Voice-Mimicking Speech Synthesis', () => {
    beforeEach(() => {
      installBrowserAudioMock();
    });

    afterEach(() => {
      removeBrowserAudioMock();
    });

    test('playSpeech derives minimum bound of 2 blips for empty or very short text', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;
      ctx.oscillatorNodes = [];

      controller.playSpeech('');
      assert.strictEqual(ctx.oscillatorNodes.length, 2, 'Empty string must synthesize 2 blips');

      ctx.oscillatorNodes = [];
      controller.playSpeech('Hi');
      assert.strictEqual(ctx.oscillatorNodes.length, 2, 'Very short text must synthesize 2 blips');

      ctx.oscillatorNodes = [];
      controller.playSpeech(undefined);
      assert.strictEqual(ctx.oscillatorNodes.length, 2, 'Undefined text must synthesize 2 blips');
    });

    test('playSpeech derives maximum bound of 12 blips for lengthy text', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;
      ctx.oscillatorNodes = [];

      const longText = 'word '.repeat(50); // 50 words, 250 characters
      controller.playSpeech(longText);
      assert.strictEqual(ctx.oscillatorNodes.length, 12, 'Long text must be clamped to 12 blips maximum');
    });

    test('playSpeech derives proportional blip count between 2 and 12 for medium text', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;
      ctx.oscillatorNodes = [];

      const mediumText = 'Here is a friendly lesson explanation for Excel formulas.';
      controller.playSpeech(mediumText);
      assert.ok(
        ctx.oscillatorNodes.length >= 2 && ctx.oscillatorNodes.length <= 12,
        `Blip count ${ctx.oscillatorNodes.length} must be bounded between 2 and 12`
      );
    });

    test('playSpeech scales formant frequencies by pitch multiplier', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;

      // Test with normal pitch (1.0)
      ctx.oscillatorNodes = [];
      controller.playSpeech('Excel formula', { pitch: 1.0 });
      for (const osc of ctx.oscillatorNodes) {
        assert.strictEqual(osc.type, 'triangle', 'Speech blip oscillator should be triangle');
        const freq = osc.frequency.value;
        // Range 220Hz - 480Hz
        assert.ok(freq >= 210 && freq <= 490, `Base freq ${freq} should be in 220-480Hz range`);
      }

      // Test with high pitch (2.0)
      ctx.oscillatorNodes = [];
      controller.playSpeech('Excel formula', { pitch: 2.0 });
      for (const osc of ctx.oscillatorNodes) {
        const freq = osc.frequency.value;
        // Range 440Hz - 960Hz
        assert.ok(freq >= 430 && freq <= 980, `Pitch 2.0 freq ${freq} should be in 440-960Hz range`);
      }

      // Test with low pitch (0.5)
      ctx.oscillatorNodes = [];
      controller.playSpeech('Excel formula', { pitch: 0.5 });
      for (const osc of ctx.oscillatorNodes) {
        const freq = osc.frequency.value;
        // Range 110Hz - 240Hz
        assert.ok(freq >= 105 && freq <= 250, `Pitch 0.5 freq ${freq} should be in 110-240Hz range`);
      }
    });

    test('playSpeech spaces blip start times according to speed parameter', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;
      ctx.currentTime = 5.0;
      ctx.oscillatorNodes = [];

      const speed = 10; // 10 syllables per second -> 0.1s interval
      controller.playSpeech('Testing blip spacing', { speed });

      assert.ok(ctx.oscillatorNodes.length >= 2);
      const firstStart = ctx.oscillatorNodes[0].startedAt!;
      const secondStart = ctx.oscillatorNodes[1].startedAt!;
      const interval = secondStart - firstStart;

      assert.ok(Math.abs(interval - 0.1) < 0.001, `Interval ${interval} should be ~0.1s for speed 10`);
    });

    test('playSpeech produces no audio when muted or volume is 0', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;

      // Muted check
      controller.setMuted(true);
      ctx.oscillatorNodes = [];
      controller.playSpeech('Muted speech should be silent');
      assert.strictEqual(ctx.oscillatorNodes.length, 0, 'No oscillators should be scheduled when muted');

      // Volume 0 check
      controller.setMuted(false);
      controller.setVolume(0);
      ctx.oscillatorNodes = [];
      controller.playSpeech('Zero volume speech should be silent');
      assert.strictEqual(ctx.oscillatorNodes.length, 0, 'No oscillators should be scheduled when volume is 0');
    });
  });

  describe('AC5: Dual-Mode Completion Sound', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      installBrowserAudioMock();
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      removeBrowserAudioMock();
      globalThis.fetch = originalFetch;
    });

    test('plays procedural fanfare (C5, E5, G5, C6) when soundUrl is omitted', async () => {
      const controller = new SoundController();
      await controller.playCompletion();

      const ctx = lastMockContext!;
      assert.strictEqual(ctx.bufferSourceNodes.length, 0, 'Should not create buffer source when no URL');
      assert.strictEqual(ctx.oscillatorNodes.length, 4, 'Procedural fanfare must synthesize 4 harmonic notes');

      const expectedFrequencies = [523.25, 659.25, 783.99, 1046.5];
      for (let i = 0; i < 4; i++) {
        const osc = ctx.oscillatorNodes[i];
        assert.strictEqual(osc.type, 'triangle');
        const freqDiff = Math.abs(osc.frequency.value - expectedFrequencies[i]);
        assert.ok(freqDiff < 0.1, `Note ${i} frequency ${osc.frequency.value} should match ${expectedFrequencies[i]}`);
      }
    });

    test('plays procedural fanfare when soundUrl is empty or whitespace string', async () => {
      const controller = new SoundController();
      await controller.playCompletion('   ');

      const ctx = lastMockContext!;
      assert.strictEqual(ctx.bufferSourceNodes.length, 0);
      assert.strictEqual(ctx.oscillatorNodes.length, 4, 'Whitespace URL must trigger procedural fanfare');
    });

    test('loads and decodes remote audio when soundUrl is provided and valid', async () => {
      const mockArrayBuffer = new ArrayBuffer(32);
      globalThis.fetch = async (input: string | URL | Request) => {
        assert.strictEqual(input, 'https://cdn.example.com/chime.mp3');
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => mockArrayBuffer,
        } as unknown as Response;
      };

      const controller = new SoundController();
      await controller.playCompletion('https://cdn.example.com/chime.mp3');

      const ctx = lastMockContext!;
      assert.strictEqual(ctx.bufferSourceNodes.length, 1, 'Should create AudioBufferSourceNode for remote audio');
      assert.ok(ctx.bufferSourceNodes[0].buffer, 'Buffer source should have decoded audio buffer');
      assert.strictEqual(ctx.bufferSourceNodes[0].startedAt, 0, 'Buffer source start should be triggered');
      assert.strictEqual(ctx.oscillatorNodes.length, 0, 'Should not synthesize procedural fanfare when URL succeeds');
    });

    test('falls back to procedural fanfare when fetch returns non-200 status', async () => {
      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 404,
        } as unknown as Response;
      };

      const controller = new SoundController();
      await controller.playCompletion('https://cdn.example.com/missing.mp3');

      const ctx = lastMockContext!;
      assert.strictEqual(ctx.bufferSourceNodes.length, 0, 'Buffer source should not be created on 404');
      assert.strictEqual(ctx.oscillatorNodes.length, 4, 'Should fallback to 4-note procedural fanfare on fetch error');
    });

    test('falls back to procedural fanfare when network fetch throws exception', async () => {
      globalThis.fetch = async () => {
        throw new Error('Network disconnection');
      };

      const controller = new SoundController();
      await controller.playCompletion('https://cdn.example.com/offline.mp3');

      const ctx = lastMockContext!;
      assert.strictEqual(ctx.oscillatorNodes.length, 4, 'Should fallback to procedural fanfare on fetch rejection');
    });

    test('falls back to procedural fanfare when decodeAudioData fails', async () => {
      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => new ArrayBuffer(16),
        } as unknown as Response;
      };

      const controller = new SoundController();
      await controller.initAudio();
      lastMockContext!.shouldDecodeReject = true;

      await controller.playCompletion('https://cdn.example.com/corrupt.mp3');

      const ctx = lastMockContext!;
      assert.strictEqual(ctx.bufferSourceNodes.length, 0);
      assert.strictEqual(ctx.oscillatorNodes.length, 4, 'Should fallback to procedural fanfare on decode error');
    });
  });

  describe('AC6: Volume and Mute Control', () => {
    beforeEach(() => {
      installBrowserAudioMock();
    });

    afterEach(() => {
      removeBrowserAudioMock();
    });

    test('setVolume updates volumeState and masterGain value', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const masterGain = lastMockContext!.gainNodes[0];

      controller.setVolume(0.45);
      assert.strictEqual(controller.getVolume(), 0.45);
      assert.strictEqual(masterGain.gain.value, 0.45);
    });

    test('setVolume clamps values strictly to [0.0, 1.0]', async () => {
      const controller = new SoundController();
      await controller.initAudio();
      const masterGain = lastMockContext!.gainNodes[0];

      // Lower boundary clamping
      controller.setVolume(-0.25);
      assert.strictEqual(controller.getVolume(), 0.0);
      assert.strictEqual(masterGain.gain.value, 0.0);

      // Upper boundary clamping
      controller.setVolume(1.8);
      assert.strictEqual(controller.getVolume(), 1.0);
      assert.strictEqual(masterGain.gain.value, 1.0);

      // NaN / invalid handling
      controller.setVolume(NaN);
      assert.strictEqual(controller.getVolume(), 0.0);
      assert.strictEqual(masterGain.gain.value, 0.0);
    });

    test('setMuted(true) sets masterGain to 0 while preserving internal volumeState', async () => {
      const controller = new SoundController();
      await controller.initAudio();
      const masterGain = lastMockContext!.gainNodes[0];

      controller.setVolume(0.85);
      assert.strictEqual(controller.getVolume(), 0.85);
      assert.strictEqual(masterGain.gain.value, 0.85);

      controller.setMuted(true);
      assert.strictEqual(controller.isMuted(), true);
      assert.strictEqual(masterGain.gain.value, 0, 'Master gain must be 0 when muted');
      assert.strictEqual(controller.getVolume(), 0.85, 'Stored volume must be preserved while muted');
    });

    test('setMuted(false) restores masterGain value to preserved volume', async () => {
      const controller = new SoundController();
      await controller.initAudio();
      const masterGain = lastMockContext!.gainNodes[0];

      controller.setVolume(0.65);
      controller.setMuted(true);
      assert.strictEqual(masterGain.gain.value, 0);

      controller.setMuted(false);
      assert.strictEqual(controller.isMuted(), false);
      assert.strictEqual(masterGain.gain.value, 0.65, 'Master gain must be restored to 0.65');
    });

    test('adjusting volume while muted updates stored volume without unmuting masterGain', async () => {
      const controller = new SoundController();
      await controller.initAudio();
      const masterGain = lastMockContext!.gainNodes[0];

      controller.setMuted(true);
      controller.setVolume(0.3);

      assert.strictEqual(controller.getVolume(), 0.3);
      assert.strictEqual(masterGain.gain.value, 0, 'Master gain must remain 0 while muted');

      controller.setMuted(false);
      assert.strictEqual(masterGain.gain.value, 0.3, 'Unmuting must apply the newly set volume');
    });
  });

  describe('AC7: Lifecycle and Disposal', () => {
    beforeEach(() => {
      installBrowserAudioMock();
    });

    afterEach(() => {
      removeBrowserAudioMock();
    });

    test('dispose closes active AudioContext and disconnects masterGain', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;
      const masterGain = ctx.gainNodes[0];

      controller.dispose();

      assert.strictEqual(ctx.closeCallCount, 1, 'AudioContext.close() must be called once');
      assert.strictEqual(masterGain.disconnected, true, 'Master gain must be disconnected');
    });

    test('dispose is idempotent and safe to call multiple times', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;

      assert.doesNotThrow(() => {
        controller.dispose();
        controller.dispose();
        controller.dispose();
      });

      assert.strictEqual(ctx.closeCallCount, 1);
    });

    test('methods continue to operate cleanly without error after dispose', async () => {
      const controller = new SoundController();
      await controller.initAudio();
      controller.dispose();

      assert.doesNotThrow(() => {
        controller.playTone(440);
        controller.playSpeech('Post dispose');
        controller.setVolume(0.5);
        controller.setMuted(true);
      });
    });
  });

  describe('Tone Generation & Edge Cases', () => {
    beforeEach(() => {
      installBrowserAudioMock();
    });

    afterEach(() => {
      removeBrowserAudioMock();
    });

    test('playTone schedules oscillator with specified frequency, type, and envelope', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;
      ctx.currentTime = 2.0;
      ctx.oscillatorNodes = [];

      controller.playTone(440, 'square', 0.25);

      assert.strictEqual(ctx.oscillatorNodes.length, 1);
      const osc = ctx.oscillatorNodes[0];
      assert.strictEqual(osc.type, 'square');
      assert.strictEqual(osc.frequency.value, 440);
      assert.strictEqual(osc.startedAt, 2.0);
      assert.strictEqual(osc.stoppedAt, 2.25);
    });

    test('playTone uses default parameters (frequency only)', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;
      ctx.currentTime = 0;
      ctx.oscillatorNodes = [];

      controller.playTone(520);

      assert.strictEqual(ctx.oscillatorNodes.length, 1);
      const osc = ctx.oscillatorNodes[0];
      assert.strictEqual(osc.type, 'sine');
      assert.strictEqual(osc.frequency.value, 520);
      assert.strictEqual(osc.stoppedAt, 0.1, 'Default duration should be 0.1s');
    });

    test('playTone suppresses audio when muted or volume is zero', async () => {
      const controller = new SoundController();
      await controller.initAudio();

      const ctx = lastMockContext!;

      // Muted
      controller.setMuted(true);
      ctx.oscillatorNodes = [];
      controller.playTone(440);
      assert.strictEqual(ctx.oscillatorNodes.length, 0);

      // Volume zero
      controller.setMuted(false);
      controller.setVolume(0);
      ctx.oscillatorNodes = [];
      controller.playTone(440);
      assert.strictEqual(ctx.oscillatorNodes.length, 0);
    });
  });
});
