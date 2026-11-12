import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useSpreadsheetStore } from '../../store/spreadsheetStore.ts';

describe('SpreadsheetDisplayStore (C1 Contract & Invariants)', () => {
  beforeEach(() => {
    useSpreadsheetStore.getState().resetDisplay();
  });

  test('AC1: exports useSpreadsheetStore and initializes with default values', () => {
    const state = useSpreadsheetStore.getState();
    assert.equal(typeof useSpreadsheetStore, 'function');
    assert.equal(state.opacity, 1.0);
    assert.equal(state.blurAmount, 0);
    assert.equal(state.isMinimized, false);
    assert.equal(state.isMaximized, false);
    assert.equal(state.isInteractive, true);
    assert.equal(state.isOverlayVisible, false);
  });

  describe('AC2: setOpacity behavior and interactivity invariant', () => {
    test('clamps values below 0 to 0 and disables interactivity', () => {
      useSpreadsheetStore.getState().setOpacity(-0.5);
      const state = useSpreadsheetStore.getState();
      assert.equal(state.opacity, 0);
      assert.equal(state.isInteractive, false);
    });

    test('clamps values above 1 to 1 and keeps interactivity if blur is 0', () => {
      useSpreadsheetStore.getState().setOpacity(1.5);
      const state = useSpreadsheetStore.getState();
      assert.equal(state.opacity, 1);
      assert.equal(state.isInteractive, true);
    });

    test('sets opacity in (0, 1) and sets isInteractive to false', () => {
      useSpreadsheetStore.getState().setOpacity(0.5);
      let state = useSpreadsheetStore.getState();
      assert.equal(state.opacity, 0.5);
      assert.equal(state.isInteractive, false);

      // Restore to 1.0 when blur is 0
      useSpreadsheetStore.getState().setOpacity(1.0);
      state = useSpreadsheetStore.getState();
      assert.equal(state.opacity, 1.0);
      assert.equal(state.isInteractive, true);
    });

    test('does NOT restore interactivity if blurAmount > 0 when opacity becomes 1.0', () => {
      useSpreadsheetStore.getState().setBlurAmount(5);
      assert.equal(useSpreadsheetStore.getState().isInteractive, false);

      useSpreadsheetStore.getState().setOpacity(0.4);
      assert.equal(useSpreadsheetStore.getState().isInteractive, false);

      useSpreadsheetStore.getState().setOpacity(1.0);
      const state = useSpreadsheetStore.getState();
      assert.equal(state.opacity, 1.0);
      assert.equal(state.isInteractive, false); // still blurred!
    });
  });

  describe('AC3: setBlurAmount behavior and interactivity invariant', () => {
    test('clamps values below 0 to 0', () => {
      useSpreadsheetStore.getState().setBlurAmount(-10);
      const state = useSpreadsheetStore.getState();
      assert.equal(state.blurAmount, 0);
      assert.equal(state.isInteractive, true);
    });

    test('clamps values above 20 to 20 and disables interactivity', () => {
      useSpreadsheetStore.getState().setBlurAmount(35);
      const state = useSpreadsheetStore.getState();
      assert.equal(state.blurAmount, 20);
      assert.equal(state.isInteractive, false);
    });

    test('disables interactivity when blur > 0 and restores when blur = 0', () => {
      useSpreadsheetStore.getState().setBlurAmount(8);
      let state = useSpreadsheetStore.getState();
      assert.equal(state.blurAmount, 8);
      assert.equal(state.isInteractive, false);

      useSpreadsheetStore.getState().setBlurAmount(0);
      state = useSpreadsheetStore.getState();
      assert.equal(state.blurAmount, 0);
      assert.equal(state.isInteractive, true);
    });

    test('does NOT restore interactivity if opacity < 1.0 when blur becomes 0', () => {
      useSpreadsheetStore.getState().setOpacity(0.6);
      useSpreadsheetStore.getState().setBlurAmount(10);
      assert.equal(useSpreadsheetStore.getState().isInteractive, false);

      useSpreadsheetStore.getState().setBlurAmount(0);
      const state = useSpreadsheetStore.getState();
      assert.equal(state.blurAmount, 0);
      assert.equal(state.isInteractive, false); // still low opacity!
    });
  });

  describe('AC4: toggleMinimize & toggleMaximize mutual exclusivity', () => {
    test('toggleMinimize sets isMinimized to true and clears isMaximized', () => {
      useSpreadsheetStore.getState().toggleMaximize();
      assert.equal(useSpreadsheetStore.getState().isMaximized, true);

      useSpreadsheetStore.getState().toggleMinimize();
      const state = useSpreadsheetStore.getState();
      assert.equal(state.isMinimized, true);
      assert.equal(state.isMaximized, false);
    });

    test('toggleMaximize sets isMaximized to true and clears isMinimized', () => {
      useSpreadsheetStore.getState().toggleMinimize();
      assert.equal(useSpreadsheetStore.getState().isMinimized, true);

      useSpreadsheetStore.getState().toggleMaximize();
      const state = useSpreadsheetStore.getState();
      assert.equal(state.isMaximized, true);
      assert.equal(state.isMinimized, false);
    });

    test('toggling minimize again un-minimizes without affecting maximize', () => {
      useSpreadsheetStore.getState().toggleMinimize();
      assert.equal(useSpreadsheetStore.getState().isMinimized, true);

      useSpreadsheetStore.getState().toggleMinimize();
      const state = useSpreadsheetStore.getState();
      assert.equal(state.isMinimized, false);
      assert.equal(state.isMaximized, false);
    });
  });

  describe('AC5: resetDisplay restores all fields to default', () => {
    test('resets altered state to default values', () => {
      useSpreadsheetStore.getState().setOpacity(0.2);
      useSpreadsheetStore.getState().setBlurAmount(15);
      useSpreadsheetStore.getState().toggleMinimize();
      useSpreadsheetStore.getState().toggleOverlay();
      useSpreadsheetStore.getState().setInteractive(false);

      useSpreadsheetStore.getState().resetDisplay();
      const state = useSpreadsheetStore.getState();
      assert.equal(state.opacity, 1.0);
      assert.equal(state.blurAmount, 0);
      assert.equal(state.isMinimized, false);
      assert.equal(state.isMaximized, false);
      assert.equal(state.isInteractive, true);
      assert.equal(state.isOverlayVisible, false);
    });
  });

  describe('Additional Actions: setInteractive and toggleOverlay', () => {
    test('toggleOverlay toggles isOverlayVisible', () => {
      assert.equal(useSpreadsheetStore.getState().isOverlayVisible, false);
      useSpreadsheetStore.getState().toggleOverlay();
      assert.equal(useSpreadsheetStore.getState().isOverlayVisible, true);
      useSpreadsheetStore.getState().toggleOverlay();
      assert.equal(useSpreadsheetStore.getState().isOverlayVisible, false);
    });

    test('setInteractive explicitly sets boolean value', () => {
      useSpreadsheetStore.getState().setInteractive(false);
      assert.equal(useSpreadsheetStore.getState().isInteractive, false);
      useSpreadsheetStore.getState().setInteractive(true);
      assert.equal(useSpreadsheetStore.getState().isInteractive, true);
    });
  });
});
