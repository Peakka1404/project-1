import { create } from 'zustand';

export interface SpreadsheetDisplayState {
  // State
  opacity: number;
  blurAmount: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isInteractive: boolean;
  isOverlayVisible: boolean;

  // Actions
  setOpacity: (v: number) => void;
  setBlurAmount: (v: number) => void;
  toggleMinimize: () => void;
  toggleMaximize: () => void;
  setInteractive: (v: boolean) => void;
  toggleOverlay: () => void;
  resetDisplay: () => void;
}

const initialDisplayState = {
  opacity: 1.0,
  blurAmount: 0,
  isMinimized: false,
  isMaximized: false,
  isInteractive: true,
  isOverlayVisible: false,
};

export const useSpreadsheetStore = create<SpreadsheetDisplayState>((set) => ({
  ...initialDisplayState,

  setOpacity: (v: number) =>
    set((state) => {
      const opacity = Math.min(1, Math.max(0, v));
      let isInteractive = state.isInteractive;
      if (opacity < 1.0) {
        isInteractive = false;
      } else if (opacity === 1.0 && state.blurAmount === 0) {
        isInteractive = true;
      }
      return { opacity, isInteractive };
    }),

  setBlurAmount: (v: number) =>
    set((state) => {
      const blurAmount = Math.min(20, Math.max(0, v));
      let isInteractive = state.isInteractive;
      if (blurAmount > 0) {
        isInteractive = false;
      } else if (blurAmount === 0 && state.opacity === 1.0) {
        isInteractive = true;
      }
      return { blurAmount, isInteractive };
    }),

  toggleMinimize: () =>
    set((state) => ({
      isMinimized: !state.isMinimized,
      isMaximized: false,
    })),

  toggleMaximize: () =>
    set((state) => ({
      isMaximized: !state.isMaximized,
      isMinimized: false,
    })),

  setInteractive: (isInteractive: boolean) => set({ isInteractive }),

  toggleOverlay: () =>
    set((state) => ({
      isOverlayVisible: !state.isOverlayVisible,
    })),

  resetDisplay: () => set(initialDisplayState),
}));
