import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  useMascotStore,
  DEFAULT_MASCOT_PROPERTIES,
  DEFAULT_BUBBLE_PROPERTIES,
  DEFAULT_SOUND_SETTINGS,
} from '../../store/mascotStore.ts';
import { useSpreadsheetStore } from '../../store/spreadsheetStore.ts';

describe('MascotStore (Contract C7 & Invariants)', () => {
  beforeEach(() => {
    useMascotStore.getState().resetAll();
    useSpreadsheetStore.getState().resetDisplay();
  });

  describe('AC1: exports useMascotStore and contract definitions', () => {
    test('exports useMascotStore as a Zustand hook function', () => {
      assert.equal(typeof useMascotStore, 'function');
      assert.equal(typeof useMascotStore.getState, 'function');
      assert.equal(typeof useMascotStore.setState, 'function');
    });

    test('exports default configuration constants matching Contract C7', () => {
      assert.equal(typeof DEFAULT_MASCOT_PROPERTIES, 'object');
      assert.equal(typeof DEFAULT_BUBBLE_PROPERTIES, 'object');
      assert.equal(typeof DEFAULT_SOUND_SETTINGS, 'object');

      assert.equal(DEFAULT_MASCOT_PROPERTIES.shape, 'rounded');
      assert.equal(DEFAULT_MASCOT_PROPERTIES.size, 80);
      assert.equal(DEFAULT_MASCOT_PROPERTIES.color, '#3b82f6');
      assert.equal(DEFAULT_MASCOT_PROPERTIES.borderColor, '#1d4ed8');
      assert.equal(DEFAULT_MASCOT_PROPERTIES.borderWidth, 2);
      assert.deepEqual(DEFAULT_MASCOT_PROPERTIES.position, { x: 40, y: 120 });
      assert.deepEqual(DEFAULT_MASCOT_PROPERTIES.lighting, {
        glowColor: 'rgba(59, 130, 246, 0.5)',
        glowBlur: 10,
        glowSpread: 0,
      });
      assert.equal(DEFAULT_MASCOT_PROPERTIES.opacity, 1.0);
      assert.equal(DEFAULT_MASCOT_PROPERTIES.blur, 0);
      assert.equal(DEFAULT_MASCOT_PROPERTIES.isVisible, true);

      assert.equal(DEFAULT_BUBBLE_PROPERTIES.text, 'Hello! I am your Excel guide.');
      assert.equal(DEFAULT_BUBBLE_PROPERTIES.isVisible, true);
      assert.equal(DEFAULT_BUBBLE_PROPERTIES.shape, 'rounded');
      assert.deepEqual(DEFAULT_BUBBLE_PROPERTIES.size, { maxWidth: 280, padding: 12 });
      assert.equal(DEFAULT_BUBBLE_PROPERTIES.color, '#ffffff');
      assert.equal(DEFAULT_BUBBLE_PROPERTIES.borderColor, '#e2e8f0');
      assert.equal(DEFAULT_BUBBLE_PROPERTIES.borderWidth, 1);
      assert.deepEqual(DEFAULT_BUBBLE_PROPERTIES.positionOffset, { x: 96, y: -16 });
      assert.deepEqual(DEFAULT_BUBBLE_PROPERTIES.lighting, {
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowBlur: 12,
        shadowSpread: 0,
      });
      assert.equal(DEFAULT_BUBBLE_PROPERTIES.opacity, 1.0);
      assert.equal(DEFAULT_BUBBLE_PROPERTIES.blur, 0);
      assert.deepEqual(DEFAULT_BUBBLE_PROPERTIES.typography, {
        fontSize: 14,
        textColor: '#1e293b',
        textAlign: 'left',
        fontWeight: '500',
      });

      assert.equal(DEFAULT_SOUND_SETTINGS.volume, 0.7);
      assert.equal(DEFAULT_SOUND_SETTINGS.isMuted, false);
      assert.equal(DEFAULT_SOUND_SETTINGS.voicePitch, 1.0);
      assert.equal(DEFAULT_SOUND_SETTINGS.voiceSpeed, 8);
    });

    test('state object exposes all actions defined in MascotStoreState', () => {
      const state = useMascotStore.getState();
      assert.equal(typeof state.setMascotProperties, 'function');
      assert.equal(typeof state.setMascotPosition, 'function');
      assert.equal(typeof state.setBubbleProperties, 'function');
      assert.equal(typeof state.setBubbleText, 'function');
      assert.equal(typeof state.setBubbleVisibility, 'function');
      assert.equal(typeof state.setSoundSettings, 'function');
      assert.equal(typeof state.toggleCustomizer, 'function');
      assert.equal(typeof state.setCustomizerOpen, 'function');
      assert.equal(typeof state.resetAll, 'function');
    });
  });

  describe('AC2: Initial state matches all default values specified in Contract C7', () => {
    test('initial state matches pristine default values', () => {
      const state = useMascotStore.getState();
      assert.deepEqual(state.mascot, DEFAULT_MASCOT_PROPERTIES);
      assert.deepEqual(state.bubble, DEFAULT_BUBBLE_PROPERTIES);
      assert.deepEqual(state.sound, DEFAULT_SOUND_SETTINGS);
      assert.equal(state.isCustomizerOpen, false);
    });
  });

  describe('AC3: setMascotProperties boundary clamping and deep-merging', () => {
    test('clamps size to [32, 256]', () => {
      useMascotStore.getState().setMascotProperties({ size: 10 });
      assert.equal(useMascotStore.getState().mascot.size, 32);

      useMascotStore.getState().setMascotProperties({ size: 300 });
      assert.equal(useMascotStore.getState().mascot.size, 256);

      useMascotStore.getState().setMascotProperties({ size: 128 });
      assert.equal(useMascotStore.getState().mascot.size, 128);

      useMascotStore.getState().setMascotProperties({ size: 32 });
      assert.equal(useMascotStore.getState().mascot.size, 32);

      useMascotStore.getState().setMascotProperties({ size: 256 });
      assert.equal(useMascotStore.getState().mascot.size, 256);
    });

    test('clamps borderWidth to [0, 12]', () => {
      useMascotStore.getState().setMascotProperties({ borderWidth: -5 });
      assert.equal(useMascotStore.getState().mascot.borderWidth, 0);

      useMascotStore.getState().setMascotProperties({ borderWidth: 15 });
      assert.equal(useMascotStore.getState().mascot.borderWidth, 12);

      useMascotStore.getState().setMascotProperties({ borderWidth: 6 });
      assert.equal(useMascotStore.getState().mascot.borderWidth, 6);
    });

    test('clamps position coordinates to non-negative x >= 0, y >= 0', () => {
      useMascotStore.getState().setMascotProperties({ position: { x: -20, y: -40 } });
      assert.deepEqual(useMascotStore.getState().mascot.position, { x: 0, y: 0 });

      useMascotStore.getState().setMascotProperties({ position: { x: 150, y: 220 } });
      assert.deepEqual(useMascotStore.getState().mascot.position, { x: 150, y: 220 });
    });

    test('clamps lighting glowBlur to [0, 50] and glowSpread to [0, 30]', () => {
      useMascotStore.getState().setMascotProperties({
        lighting: { glowBlur: -10, glowSpread: -5 },
      });
      assert.equal(useMascotStore.getState().mascot.lighting.glowBlur, 0);
      assert.equal(useMascotStore.getState().mascot.lighting.glowSpread, 0);

      useMascotStore.getState().setMascotProperties({
        lighting: { glowBlur: 75, glowSpread: 45 },
      });
      assert.equal(useMascotStore.getState().mascot.lighting.glowBlur, 50);
      assert.equal(useMascotStore.getState().mascot.lighting.glowSpread, 30);

      useMascotStore.getState().setMascotProperties({
        lighting: { glowBlur: 20, glowSpread: 15 },
      });
      assert.equal(useMascotStore.getState().mascot.lighting.glowBlur, 20);
      assert.equal(useMascotStore.getState().mascot.lighting.glowSpread, 15);
    });

    test('clamps opacity to [0.0, 1.0] and blur to [0, 20]', () => {
      useMascotStore.getState().setMascotProperties({ opacity: -0.5, blur: -4 });
      assert.equal(useMascotStore.getState().mascot.opacity, 0.0);
      assert.equal(useMascotStore.getState().mascot.blur, 0);

      useMascotStore.getState().setMascotProperties({ opacity: 1.5, blur: 30 });
      assert.equal(useMascotStore.getState().mascot.opacity, 1.0);
      assert.equal(useMascotStore.getState().mascot.blur, 20);

      useMascotStore.getState().setMascotProperties({ opacity: 0.65, blur: 8 });
      assert.equal(useMascotStore.getState().mascot.opacity, 0.65);
      assert.equal(useMascotStore.getState().mascot.blur, 8);
    });

    test('updates mascot shape, color, borderColor, and isVisible', () => {
      useMascotStore.getState().setMascotProperties({
        shape: 'pill',
        color: '#10b981',
        borderColor: '#047857',
        isVisible: false,
      });
      const mascot = useMascotStore.getState().mascot;
      assert.equal(mascot.shape, 'pill');
      assert.equal(mascot.color, '#10b981');
      assert.equal(mascot.borderColor, '#047857');
      assert.equal(mascot.isVisible, false);
    });

    test('deep-merges nested properties without dropping unspecified siblings', () => {
      // 1. Partial update on position.x keeps existing position.y
      useMascotStore.getState().setMascotProperties({ position: { x: 75 } });
      assert.equal(useMascotStore.getState().mascot.position.x, 75);
      assert.equal(useMascotStore.getState().mascot.position.y, 120);

      // 2. Partial update on position.y keeps updated position.x
      useMascotStore.getState().setMascotProperties({ position: { y: 250 } });
      assert.equal(useMascotStore.getState().mascot.position.x, 75);
      assert.equal(useMascotStore.getState().mascot.position.y, 250);

      // 3. Partial update on lighting.glowBlur keeps glowColor and glowSpread
      useMascotStore.getState().setMascotProperties({
        lighting: { glowBlur: 25 },
      });
      assert.equal(useMascotStore.getState().mascot.lighting.glowBlur, 25);
      assert.equal(
        useMascotStore.getState().mascot.lighting.glowColor,
        'rgba(59, 130, 246, 0.5)'
      );
      assert.equal(useMascotStore.getState().mascot.lighting.glowSpread, 0);

      // 4. Partial update on lighting.glowColor keeps glowBlur and glowSpread
      useMascotStore.getState().setMascotProperties({
        lighting: { glowColor: '#ff00ff' },
      });
      assert.equal(useMascotStore.getState().mascot.lighting.glowColor, '#ff00ff');
      assert.equal(useMascotStore.getState().mascot.lighting.glowBlur, 25);
      assert.equal(useMascotStore.getState().mascot.lighting.glowSpread, 0);

      // 5. Updating top-level size keeps nested position and lighting intact
      useMascotStore.getState().setMascotProperties({ size: 100 });
      assert.equal(useMascotStore.getState().mascot.size, 100);
      assert.deepEqual(useMascotStore.getState().mascot.position, { x: 75, y: 250 });
      assert.equal(useMascotStore.getState().mascot.lighting.glowColor, '#ff00ff');
      assert.equal(useMascotStore.getState().mascot.lighting.glowBlur, 25);
    });
  });

  describe('AC4: setMascotPosition clamps coordinates to non-negative values', () => {
    test('clamps negative coordinates to 0', () => {
      useMascotStore.getState().setMascotPosition({ x: -100, y: -50 });
      assert.deepEqual(useMascotStore.getState().mascot.position, { x: 0, y: 0 });
    });

    test('sets valid non-negative coordinates accurately', () => {
      useMascotStore.getState().setMascotPosition({ x: 120, y: 240 });
      assert.deepEqual(useMascotStore.getState().mascot.position, { x: 120, y: 240 });
    });

    test('handles mixed coordinates with one negative and one positive', () => {
      useMascotStore.getState().setMascotPosition({ x: -25, y: 80 });
      assert.deepEqual(useMascotStore.getState().mascot.position, { x: 0, y: 80 });

      useMascotStore.getState().setMascotPosition({ x: 95, y: -10 });
      assert.deepEqual(useMascotStore.getState().mascot.position, { x: 95, y: 0 });
    });

    test('does not affect other mascot properties', () => {
      const priorSize = useMascotStore.getState().mascot.size;
      const priorColor = useMascotStore.getState().mascot.color;
      useMascotStore.getState().setMascotPosition({ x: 50, y: 60 });
      assert.equal(useMascotStore.getState().mascot.size, priorSize);
      assert.equal(useMascotStore.getState().mascot.color, priorColor);
    });
  });

  describe('AC5: setBubbleProperties boundary clamping and deep-merging', () => {
    test('clamps size maxWidth to [120, 600] and padding to [4, 32]', () => {
      useMascotStore.getState().setBubbleProperties({
        size: { maxWidth: 50, padding: 1 },
      });
      assert.equal(useMascotStore.getState().bubble.size.maxWidth, 120);
      assert.equal(useMascotStore.getState().bubble.size.padding, 4);

      useMascotStore.getState().setBubbleProperties({
        size: { maxWidth: 900, padding: 50 },
      });
      assert.equal(useMascotStore.getState().bubble.size.maxWidth, 600);
      assert.equal(useMascotStore.getState().bubble.size.padding, 32);

      useMascotStore.getState().setBubbleProperties({
        size: { maxWidth: 350, padding: 16 },
      });
      assert.equal(useMascotStore.getState().bubble.size.maxWidth, 350);
      assert.equal(useMascotStore.getState().bubble.size.padding, 16);
    });

    test('clamps borderWidth to [0, 8]', () => {
      useMascotStore.getState().setBubbleProperties({ borderWidth: -2 });
      assert.equal(useMascotStore.getState().bubble.borderWidth, 0);

      useMascotStore.getState().setBubbleProperties({ borderWidth: 15 });
      assert.equal(useMascotStore.getState().bubble.borderWidth, 8);

      useMascotStore.getState().setBubbleProperties({ borderWidth: 3 });
      assert.equal(useMascotStore.getState().bubble.borderWidth, 3);
    });

    test('allows negative and positive values for positionOffset relative to anchor', () => {
      useMascotStore.getState().setBubbleProperties({
        positionOffset: { x: -50, y: -100 },
      });
      assert.deepEqual(useMascotStore.getState().bubble.positionOffset, {
        x: -50,
        y: -100,
      });

      useMascotStore.getState().setBubbleProperties({
        positionOffset: { x: 120, y: 40 },
      });
      assert.deepEqual(useMascotStore.getState().bubble.positionOffset, {
        x: 120,
        y: 40,
      });
    });

    test('clamps lighting shadowBlur to [0, 50] and shadowSpread to [0, 30]', () => {
      useMascotStore.getState().setBubbleProperties({
        lighting: { shadowBlur: -8, shadowSpread: -2 },
      });
      assert.equal(useMascotStore.getState().bubble.lighting.shadowBlur, 0);
      assert.equal(useMascotStore.getState().bubble.lighting.shadowSpread, 0);

      useMascotStore.getState().setBubbleProperties({
        lighting: { shadowBlur: 80, shadowSpread: 50 },
      });
      assert.equal(useMascotStore.getState().bubble.lighting.shadowBlur, 50);
      assert.equal(useMascotStore.getState().bubble.lighting.shadowSpread, 30);

      useMascotStore.getState().setBubbleProperties({
        lighting: { shadowBlur: 20, shadowSpread: 10 },
      });
      assert.equal(useMascotStore.getState().bubble.lighting.shadowBlur, 20);
      assert.equal(useMascotStore.getState().bubble.lighting.shadowSpread, 10);
    });

    test('clamps opacity to [0.0, 1.0] and blur to [0, 20]', () => {
      useMascotStore.getState().setBubbleProperties({ opacity: -0.3, blur: -5 });
      assert.equal(useMascotStore.getState().bubble.opacity, 0.0);
      assert.equal(useMascotStore.getState().bubble.blur, 0);

      useMascotStore.getState().setBubbleProperties({ opacity: 1.8, blur: 40 });
      assert.equal(useMascotStore.getState().bubble.opacity, 1.0);
      assert.equal(useMascotStore.getState().bubble.blur, 20);

      useMascotStore.getState().setBubbleProperties({ opacity: 0.85, blur: 5 });
      assert.equal(useMascotStore.getState().bubble.opacity, 0.85);
      assert.equal(useMascotStore.getState().bubble.blur, 5);
    });

    test('clamps typography fontSize to [10, 32] and updates font styles', () => {
      useMascotStore.getState().setBubbleProperties({
        typography: { fontSize: 5, textColor: '#0f172a', textAlign: 'center', fontWeight: '700' },
      });
      let typo = useMascotStore.getState().bubble.typography;
      assert.equal(typo.fontSize, 10);
      assert.equal(typo.textColor, '#0f172a');
      assert.equal(typo.textAlign, 'center');
      assert.equal(typo.fontWeight, '700');

      useMascotStore.getState().setBubbleProperties({
        typography: { fontSize: 50 },
      });
      typo = useMascotStore.getState().bubble.typography;
      assert.equal(typo.fontSize, 32);
      assert.equal(typo.textColor, '#0f172a');
      assert.equal(typo.textAlign, 'center');
      assert.equal(typo.fontWeight, '700');
    });

    test('deep-merges nested properties without dropping unspecified siblings', () => {
      // 1. Updating size.maxWidth keeps size.padding
      useMascotStore.getState().setBubbleProperties({ size: { maxWidth: 450 } });
      assert.equal(useMascotStore.getState().bubble.size.maxWidth, 450);
      assert.equal(useMascotStore.getState().bubble.size.padding, 12);

      // 2. Updating size.padding keeps size.maxWidth
      useMascotStore.getState().setBubbleProperties({ size: { padding: 24 } });
      assert.equal(useMascotStore.getState().bubble.size.maxWidth, 450);
      assert.equal(useMascotStore.getState().bubble.size.padding, 24);

      // 3. Updating positionOffset.x keeps positionOffset.y
      useMascotStore.getState().setBubbleProperties({ positionOffset: { x: 150 } });
      assert.equal(useMascotStore.getState().bubble.positionOffset.x, 150);
      assert.equal(useMascotStore.getState().bubble.positionOffset.y, -16);

      // 4. Updating lighting.shadowColor keeps shadowBlur and shadowSpread
      useMascotStore.getState().setBubbleProperties({
        lighting: { shadowColor: '#123456' },
      });
      assert.equal(useMascotStore.getState().bubble.lighting.shadowColor, '#123456');
      assert.equal(useMascotStore.getState().bubble.lighting.shadowBlur, 12);
      assert.equal(useMascotStore.getState().bubble.lighting.shadowSpread, 0);

      // 5. Updating typography.textAlign keeps fontSize, textColor, fontWeight
      useMascotStore.getState().setBubbleProperties({
        typography: { textAlign: 'right' },
      });
      assert.equal(useMascotStore.getState().bubble.typography.textAlign, 'right');
      assert.equal(useMascotStore.getState().bubble.typography.fontSize, 14);
      assert.equal(useMascotStore.getState().bubble.typography.textColor, '#1e293b');
      assert.equal(useMascotStore.getState().bubble.typography.fontWeight, '500');
    });
  });

  describe('AC6: setBubbleText and setBubbleVisibility', () => {
    test('updates text in bubble and accepts optional triggerSpeech flag', () => {
      useMascotStore.getState().setBubbleText('Welcome to SUM and AVERAGE tutorial!');
      assert.equal(
        useMascotStore.getState().bubble.text,
        'Welcome to SUM and AVERAGE tutorial!'
      );

      useMascotStore.getState().setBubbleText('Second line message.', true);
      assert.equal(useMascotStore.getState().bubble.text, 'Second line message.');
    });

    test('updates visibility boolean in bubble', () => {
      assert.equal(useMascotStore.getState().bubble.isVisible, true);
      useMascotStore.getState().setBubbleVisibility(false);
      assert.equal(useMascotStore.getState().bubble.isVisible, false);
      useMascotStore.getState().setBubbleVisibility(true);
      assert.equal(useMascotStore.getState().bubble.isVisible, true);
    });
  });

  describe('AC7: setSoundSettings clamps volume, voicePitch, and voiceSpeed', () => {
    test('clamps volume to [0.0, 1.0]', () => {
      useMascotStore.getState().setSoundSettings({ volume: -0.2 });
      assert.equal(useMascotStore.getState().sound.volume, 0.0);

      useMascotStore.getState().setSoundSettings({ volume: 1.5 });
      assert.equal(useMascotStore.getState().sound.volume, 1.0);

      useMascotStore.getState().setSoundSettings({ volume: 0.45 });
      assert.equal(useMascotStore.getState().sound.volume, 0.45);
    });

    test('clamps voicePitch to [0.5, 2.0]', () => {
      useMascotStore.getState().setSoundSettings({ voicePitch: 0.1 });
      assert.equal(useMascotStore.getState().sound.voicePitch, 0.5);

      useMascotStore.getState().setSoundSettings({ voicePitch: 3.5 });
      assert.equal(useMascotStore.getState().sound.voicePitch, 2.0);

      useMascotStore.getState().setSoundSettings({ voicePitch: 1.35 });
      assert.equal(useMascotStore.getState().sound.voicePitch, 1.35);
    });

    test('clamps voiceSpeed to [1, 20]', () => {
      useMascotStore.getState().setSoundSettings({ voiceSpeed: -5 });
      assert.equal(useMascotStore.getState().sound.voiceSpeed, 1);

      useMascotStore.getState().setSoundSettings({ voiceSpeed: 50 });
      assert.equal(useMascotStore.getState().sound.voiceSpeed, 20);

      useMascotStore.getState().setSoundSettings({ voiceSpeed: 14 });
      assert.equal(useMascotStore.getState().sound.voiceSpeed, 14);
    });

    test('toggles isMuted boolean and preserves siblings', () => {
      useMascotStore.getState().setSoundSettings({ isMuted: true });
      assert.equal(useMascotStore.getState().sound.isMuted, true);
      assert.equal(useMascotStore.getState().sound.volume, 0.7);
      assert.equal(useMascotStore.getState().sound.voicePitch, 1.0);
      assert.equal(useMascotStore.getState().sound.voiceSpeed, 8);

      useMascotStore.getState().setSoundSettings({ isMuted: false });
      assert.equal(useMascotStore.getState().sound.isMuted, false);
    });
  });

  describe('AC8: toggleCustomizer and setCustomizerOpen', () => {
    test('toggleCustomizer flips isCustomizerOpen boolean', () => {
      assert.equal(useMascotStore.getState().isCustomizerOpen, false);
      useMascotStore.getState().toggleCustomizer();
      assert.equal(useMascotStore.getState().isCustomizerOpen, true);
      useMascotStore.getState().toggleCustomizer();
      assert.equal(useMascotStore.getState().isCustomizerOpen, false);
    });

    test('setCustomizerOpen explicitly sets the flag', () => {
      useMascotStore.getState().setCustomizerOpen(true);
      assert.equal(useMascotStore.getState().isCustomizerOpen, true);
      useMascotStore.getState().setCustomizerOpen(true);
      assert.equal(useMascotStore.getState().isCustomizerOpen, true);
      useMascotStore.getState().setCustomizerOpen(false);
      assert.equal(useMascotStore.getState().isCustomizerOpen, false);
    });
  });

  describe('AC9: resetAll reverts all fields atomically to pristine defaults', () => {
    test('resets altered mascot, bubble, sound, and customizer states to defaults', () => {
      // Modify everything
      useMascotStore.getState().setMascotProperties({
        shape: 'pill',
        size: 200,
        color: '#ff0000',
        borderColor: '#990000',
        borderWidth: 8,
        position: { x: 300, y: 400 },
        lighting: { glowColor: '#00ff00', glowBlur: 40, glowSpread: 20 },
        opacity: 0.3,
        blur: 15,
        isVisible: false,
      });

      useMascotStore.getState().setBubbleProperties({
        text: 'Custom text message',
        isVisible: false,
        shape: 'speech-balloon',
        size: { maxWidth: 500, padding: 28 },
        color: '#000000',
        borderColor: '#333333',
        borderWidth: 6,
        positionOffset: { x: 200, y: 50 },
        lighting: { shadowColor: '#ff00ff', shadowBlur: 35, shadowSpread: 15 },
        opacity: 0.5,
        blur: 8,
        typography: { fontSize: 24, textColor: '#ffff00', textAlign: 'right', fontWeight: '700' },
      });

      useMascotStore.getState().setSoundSettings({
        volume: 0.2,
        isMuted: true,
        voicePitch: 1.8,
        voiceSpeed: 16,
      });

      useMascotStore.getState().setCustomizerOpen(true);

      // Verify that values were altered
      assert.equal(useMascotStore.getState().mascot.shape, 'pill');
      assert.equal(useMascotStore.getState().bubble.text, 'Custom text message');
      assert.equal(useMascotStore.getState().sound.isMuted, true);
      assert.equal(useMascotStore.getState().isCustomizerOpen, true);

      // Execute resetAll
      useMascotStore.getState().resetAll();

      // Check atomic restoration to exact default constants
      const state = useMascotStore.getState();
      assert.deepEqual(state.mascot, DEFAULT_MASCOT_PROPERTIES);
      assert.deepEqual(state.bubble, DEFAULT_BUBBLE_PROPERTIES);
      assert.deepEqual(state.sound, DEFAULT_SOUND_SETTINGS);
      assert.equal(state.isCustomizerOpen, false);
    });

    test('pristine reset returns independent objects so mutating state does not corrupt defaults', () => {
      useMascotStore.getState().resetAll();
      const state = useMascotStore.getState();

      // Ensure objects are fresh copies
      assert.notEqual(state.mascot.position, DEFAULT_MASCOT_PROPERTIES.position);
      assert.notEqual(state.mascot.lighting, DEFAULT_MASCOT_PROPERTIES.lighting);
      assert.notEqual(state.bubble.size, DEFAULT_BUBBLE_PROPERTIES.size);
      assert.notEqual(state.bubble.positionOffset, DEFAULT_BUBBLE_PROPERTIES.positionOffset);

      // Mutate state through action
      useMascotStore.getState().setMascotPosition({ x: 999, y: 888 });

      // Ensure default constant was not mutated
      assert.equal(DEFAULT_MASCOT_PROPERTIES.position.x, 40);
      assert.equal(DEFAULT_MASCOT_PROPERTIES.position.y, 120);
    });
  });

  describe('AC10: Zero side effects or mutations on useSpreadsheetStore', () => {
    test('mutations on useMascotStore have zero effect on useSpreadsheetStore', () => {
      const initialSpreadsheetState = { ...useSpreadsheetStore.getState() };

      useMascotStore.getState().setMascotProperties({ size: 150, opacity: 0.2, blur: 15 });
      useMascotStore.getState().setBubbleText('Testing isolation');
      useMascotStore.getState().toggleCustomizer();
      useMascotStore.getState().setSoundSettings({ volume: 0.1 });

      const currentSpreadsheetState = useSpreadsheetStore.getState();
      assert.equal(currentSpreadsheetState.opacity, initialSpreadsheetState.opacity);
      assert.equal(currentSpreadsheetState.blurAmount, initialSpreadsheetState.blurAmount);
      assert.equal(currentSpreadsheetState.isMinimized, initialSpreadsheetState.isMinimized);
      assert.equal(currentSpreadsheetState.isMaximized, initialSpreadsheetState.isMaximized);
      assert.equal(currentSpreadsheetState.isInteractive, initialSpreadsheetState.isInteractive);
      assert.equal(currentSpreadsheetState.isOverlayVisible, initialSpreadsheetState.isOverlayVisible);
    });

    test('mutations on useSpreadsheetStore have zero effect on useMascotStore', () => {
      useMascotStore.getState().resetAll();
      const initialMascotState = useMascotStore.getState();

      useSpreadsheetStore.getState().setOpacity(0.3);
      useSpreadsheetStore.getState().setBlurAmount(12);
      useSpreadsheetStore.getState().toggleMinimize();
      useSpreadsheetStore.getState().toggleOverlay();

      const currentMascotState = useMascotStore.getState();
      assert.deepEqual(currentMascotState.mascot, initialMascotState.mascot);
      assert.deepEqual(currentMascotState.bubble, initialMascotState.bubble);
      assert.deepEqual(currentMascotState.sound, initialMascotState.sound);
      assert.equal(currentMascotState.isCustomizerOpen, initialMascotState.isCustomizerOpen);
    });
  });
});
