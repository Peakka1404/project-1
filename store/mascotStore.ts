import { create } from 'zustand';

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

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export interface MascotStoreState {
  mascot: MascotVisualProperties;
  bubble: TextBubbleProperties;
  sound: SoundSettingsState;
  isCustomizerOpen: boolean;

  // Actions
  setMascotProperties: (props: DeepPartial<MascotVisualProperties>) => void;
  setMascotPosition: (pos: { x: number; y: number }) => void;
  setBubbleProperties: (props: DeepPartial<TextBubbleProperties>) => void;
  setBubbleText: (text: string, triggerSpeech?: boolean) => void;
  setBubbleVisibility: (visible: boolean) => void;
  setSoundSettings: (settings: Partial<SoundSettingsState>) => void;
  toggleCustomizer: () => void;
  setCustomizerOpen: (open: boolean) => void;
  resetAll: () => void;
}

export const DEFAULT_MASCOT_PROPERTIES: MascotVisualProperties = {
  shape: 'rounded',
  size: 80,
  color: '#3b82f6',
  borderColor: '#1d4ed8',
  borderWidth: 2,
  position: {
    x: 40,
    y: 120,
  },
  lighting: {
    glowColor: 'rgba(59, 130, 246, 0.5)',
    glowBlur: 10,
    glowSpread: 0,
  },
  opacity: 1.0,
  blur: 0,
  isVisible: true,
};

export const DEFAULT_BUBBLE_PROPERTIES: TextBubbleProperties = {
  text: 'Hello! I am your Excel guide.',
  isVisible: true,
  shape: 'rounded',
  size: {
    maxWidth: 280,
    padding: 12,
  },
  color: '#ffffff',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  positionOffset: {
    x: 96,
    y: -16,
  },
  lighting: {
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowBlur: 12,
    shadowSpread: 0,
  },
  opacity: 1.0,
  blur: 0,
  typography: {
    fontSize: 14,
    textColor: '#1e293b',
    textAlign: 'left',
    fontWeight: '500',
  },
};

export const DEFAULT_SOUND_SETTINGS: SoundSettingsState = {
  volume: 0.7,
  isMuted: false,
  voicePitch: 1.0,
  voiceSpeed: 8,
};

const clamp = (val: number, min: number, max: number): number => {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
};

const clampMin = (val: number, min: number): number => {
  if (Number.isNaN(val)) return min;
  return Math.max(min, val);
};

const mergeMascotProperties = (
  current: MascotVisualProperties,
  incoming: DeepPartial<MascotVisualProperties>
): MascotVisualProperties => {
  return {
    shape: incoming.shape ?? current.shape,
    size:
      incoming.size !== undefined
        ? clamp(incoming.size, 32, 256)
        : current.size,
    color: incoming.color ?? current.color,
    borderColor: incoming.borderColor ?? current.borderColor,
    borderWidth:
      incoming.borderWidth !== undefined
        ? clamp(incoming.borderWidth, 0, 12)
        : current.borderWidth,
    position: {
      x:
        incoming.position?.x !== undefined
          ? clampMin(incoming.position.x, 0)
          : current.position.x,
      y:
        incoming.position?.y !== undefined
          ? clampMin(incoming.position.y, 0)
          : current.position.y,
    },
    lighting: {
      glowColor: incoming.lighting?.glowColor ?? current.lighting.glowColor,
      glowBlur:
        incoming.lighting?.glowBlur !== undefined
          ? clamp(incoming.lighting.glowBlur, 0, 50)
          : current.lighting.glowBlur,
      glowSpread:
        incoming.lighting?.glowSpread !== undefined
          ? clamp(incoming.lighting.glowSpread, 0, 30)
          : current.lighting.glowSpread,
    },
    opacity:
      incoming.opacity !== undefined
        ? clamp(incoming.opacity, 0.0, 1.0)
        : current.opacity,
    blur:
      incoming.blur !== undefined
        ? clamp(incoming.blur, 0, 20)
        : current.blur,
    isVisible: incoming.isVisible ?? current.isVisible,
  };
};

const mergeBubbleProperties = (
  current: TextBubbleProperties,
  incoming: DeepPartial<TextBubbleProperties>
): TextBubbleProperties => {
  return {
    text: incoming.text ?? current.text,
    isVisible: incoming.isVisible ?? current.isVisible,
    shape: incoming.shape ?? current.shape,
    size: {
      maxWidth:
        incoming.size?.maxWidth !== undefined
          ? clamp(incoming.size.maxWidth, 120, 600)
          : current.size.maxWidth,
      padding:
        incoming.size?.padding !== undefined
          ? clamp(incoming.size.padding, 4, 32)
          : current.size.padding,
    },
    color: incoming.color ?? current.color,
    borderColor: incoming.borderColor ?? current.borderColor,
    borderWidth:
      incoming.borderWidth !== undefined
        ? clamp(incoming.borderWidth, 0, 8)
        : current.borderWidth,
    positionOffset: {
      x:
        incoming.positionOffset?.x !== undefined
          ? incoming.positionOffset.x
          : current.positionOffset.x,
      y:
        incoming.positionOffset?.y !== undefined
          ? incoming.positionOffset.y
          : current.positionOffset.y,
    },
    lighting: {
      shadowColor:
        incoming.lighting?.shadowColor ?? current.lighting.shadowColor,
      shadowBlur:
        incoming.lighting?.shadowBlur !== undefined
          ? clamp(incoming.lighting.shadowBlur, 0, 50)
          : current.lighting.shadowBlur,
      shadowSpread:
        incoming.lighting?.shadowSpread !== undefined
          ? clamp(incoming.lighting.shadowSpread, 0, 30)
          : current.lighting.shadowSpread,
    },
    opacity:
      incoming.opacity !== undefined
        ? clamp(incoming.opacity, 0.0, 1.0)
        : current.opacity,
    blur:
      incoming.blur !== undefined
        ? clamp(incoming.blur, 0, 20)
        : current.blur,
    typography: {
      fontSize:
        incoming.typography?.fontSize !== undefined
          ? clamp(incoming.typography.fontSize, 10, 32)
          : current.typography.fontSize,
      textColor:
        incoming.typography?.textColor ?? current.typography.textColor,
      textAlign:
        incoming.typography?.textAlign ?? current.typography.textAlign,
      fontWeight:
        incoming.typography?.fontWeight ?? current.typography.fontWeight,
    },
  };
};

const mergeSoundSettings = (
  current: SoundSettingsState,
  incoming: Partial<SoundSettingsState>
): SoundSettingsState => {
  return {
    volume:
      incoming.volume !== undefined
        ? clamp(incoming.volume, 0.0, 1.0)
        : current.volume,
    isMuted: incoming.isMuted ?? current.isMuted,
    voicePitch:
      incoming.voicePitch !== undefined
        ? clamp(incoming.voicePitch, 0.5, 2.0)
        : current.voicePitch,
    voiceSpeed:
      incoming.voiceSpeed !== undefined
        ? clamp(incoming.voiceSpeed, 1, 20)
        : current.voiceSpeed,
  };
};

export const useMascotStore = create<MascotStoreState>((set) => ({
  mascot: {
    ...DEFAULT_MASCOT_PROPERTIES,
    position: { ...DEFAULT_MASCOT_PROPERTIES.position },
    lighting: { ...DEFAULT_MASCOT_PROPERTIES.lighting },
  },
  bubble: {
    ...DEFAULT_BUBBLE_PROPERTIES,
    size: { ...DEFAULT_BUBBLE_PROPERTIES.size },
    positionOffset: { ...DEFAULT_BUBBLE_PROPERTIES.positionOffset },
    lighting: { ...DEFAULT_BUBBLE_PROPERTIES.lighting },
    typography: { ...DEFAULT_BUBBLE_PROPERTIES.typography },
  },
  sound: {
    ...DEFAULT_SOUND_SETTINGS,
  },
  isCustomizerOpen: false,

  setMascotProperties: (props) =>
    set((state) => ({
      mascot: mergeMascotProperties(state.mascot, props),
    })),

  setMascotPosition: (pos) =>
    set((state) => ({
      mascot: {
        ...state.mascot,
        position: {
          x: clampMin(pos.x, 0),
          y: clampMin(pos.y, 0),
        },
      },
    })),

  setBubbleProperties: (props) =>
    set((state) => ({
      bubble: mergeBubbleProperties(state.bubble, props),
    })),

  setBubbleText: (text: string, _triggerSpeech?: boolean) =>
    set((state) => ({
      bubble: {
        ...state.bubble,
        text,
      },
    })),

  setBubbleVisibility: (visible: boolean) =>
    set((state) => ({
      bubble: {
        ...state.bubble,
        isVisible: visible,
      },
    })),

  setSoundSettings: (settings) =>
    set((state) => ({
      sound: mergeSoundSettings(state.sound, settings),
    })),

  toggleCustomizer: () =>
    set((state) => ({
      isCustomizerOpen: !state.isCustomizerOpen,
    })),

  setCustomizerOpen: (open: boolean) =>
    set({ isCustomizerOpen: open }),

  resetAll: () =>
    set({
      mascot: {
        ...DEFAULT_MASCOT_PROPERTIES,
        position: { ...DEFAULT_MASCOT_PROPERTIES.position },
        lighting: { ...DEFAULT_MASCOT_PROPERTIES.lighting },
      },
      bubble: {
        ...DEFAULT_BUBBLE_PROPERTIES,
        size: { ...DEFAULT_BUBBLE_PROPERTIES.size },
        positionOffset: { ...DEFAULT_BUBBLE_PROPERTIES.positionOffset },
        lighting: { ...DEFAULT_BUBBLE_PROPERTIES.lighting },
        typography: { ...DEFAULT_BUBBLE_PROPERTIES.typography },
      },
      sound: {
        ...DEFAULT_SOUND_SETTINGS,
      },
      isCustomizerOpen: false,
    }),
}));
