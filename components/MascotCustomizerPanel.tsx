'use client';

import React, { useState } from 'react';
import {
  useMascotStore,
  MascotShape,
  BubbleShape,
  TextAlignment,
} from '@/store/mascotStore';
import { soundController } from '@/lib/audio/soundController';

/**
 * Converts any CSS color or fallback to a 7-character hex string (#rrggbb)
 * required by standard HTML <input type="color">.
 */
function toHexColor(color: string, fallback = '#3b82f6'): string {
  if (!color) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = Math.min(255, parseInt(match[1], 10)).toString(16).padStart(2, '0');
    const g = Math.min(255, parseInt(match[2], 10)).toString(16).padStart(2, '0');
    const b = Math.min(255, parseInt(match[3], 10)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return fallback;
}

export function MascotCustomizerPanel() {
  const [activeTab, setActiveTab] = useState<'mascot' | 'bubble' | 'audio'>('mascot');

  const mascot = useMascotStore((state) => state.mascot);
  const bubble = useMascotStore((state) => state.bubble);
  const sound = useMascotStore((state) => state.sound);
  const isCustomizerOpen = useMascotStore((state) => state.isCustomizerOpen);

  const setMascotProperties = useMascotStore((state) => state.setMascotProperties);
  const setMascotPosition = useMascotStore((state) => state.setMascotPosition);
  const setBubbleProperties = useMascotStore((state) => state.setBubbleProperties);
  const setBubbleText = useMascotStore((state) => state.setBubbleText);
  const setBubbleVisibility = useMascotStore((state) => state.setBubbleVisibility);
  const setSoundSettings = useMascotStore((state) => state.setSoundSettings);
  const toggleCustomizer = useMascotStore((state) => state.toggleCustomizer);
  const setCustomizerOpen = useMascotStore((state) => state.setCustomizerOpen);
  const resetAll = useMascotStore((state) => state.resetAll);

  // Audio handlers syncing Zustand store & soundController
  const handleVolumeChange = (newVolume: number) => {
    setSoundSettings({ volume: newVolume });
    soundController.setVolume(newVolume);
  };

  const handleMuteToggle = () => {
    const nextMuted = !sound.isMuted;
    setSoundSettings({ isMuted: nextMuted });
    soundController.setMuted(nextMuted);
  };

  const handleVoicePitchChange = (pitch: number) => {
    setSoundSettings({ voicePitch: pitch });
  };

  const handleVoiceSpeedChange = (speed: number) => {
    setSoundSettings({ voiceSpeed: speed });
  };

  const handleSpeakBubble = () => {
    soundController.playSpeech(bubble.text, {
      pitch: sound.voicePitch,
      speed: sound.voiceSpeed,
    });
  };

  const handleTestSpeech = () => {
    soundController.playSpeech('Hello learner!', {
      pitch: sound.voicePitch,
      speed: sound.voiceSpeed,
    });
  };

  const handleTestChime = () => {
    soundController.playCompletion();
  };

  return (
    <div
      data-testid="mascot-customizer-panel"
      className="fixed bottom-4 right-4 z-50 select-none font-sans"
    >
      {/* Collapsed Mode: Floating Action Button */}
      {!isCustomizerOpen ? (
        <button
          type="button"
          data-testid="customizer-toggle-btn"
          onClick={toggleCustomizer}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 font-semibold text-sm rounded-full shadow-xl border border-slate-200 transition-all hover:bg-slate-50 hover:shadow-2xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <span>🎨 Customize Mascot</span>
        </button>
      ) : (
        /* Expanded Mode: Floating Dialog Card */
        <div
          data-testid="customizer-card"
          className="w-[360px] max-h-[80vh] flex flex-col bg-white text-slate-800 shadow-2xl rounded-xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-800">Customize Mascot</span>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setCustomizerOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors text-sm font-bold leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('mascot')}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                activeTab === 'mascot'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mascot
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bubble')}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                activeTab === 'bubble'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bubble
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                activeTab === 'audio'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audio
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* ========================================================= */}
            {/* TAB 1: MASCOT CONTROLS                                    */}
            {/* ========================================================= */}
            {activeTab === 'mascot' && (
              <div className="space-y-4">
                {/* Shape Selector */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1.5">
                    Shape
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['rounded', 'square', 'circle', 'pill'] as MascotShape[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMascotProperties({ shape: s })}
                        className={`py-1.5 px-2 rounded-md capitalize font-medium text-center border transition-all cursor-pointer ${
                          mascot.shape === s
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">Size</label>
                    <span className="font-mono text-slate-500">{mascot.size}px</span>
                  </div>
                  <input
                    type="range"
                    min={32}
                    max={256}
                    value={mascot.size}
                    onChange={(e) => setMascotProperties({ size: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Background & Border Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={toHexColor(mascot.color, '#3b82f6')}
                        onChange={(e) => setMascotProperties({ color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={mascot.color}
                        onChange={(e) => setMascotProperties({ color: e.target.value })}
                        className="flex-1 px-2 py-1 font-mono text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Border Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={toHexColor(mascot.borderColor, '#1d4ed8')}
                        onChange={(e) => setMascotProperties({ borderColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={mascot.borderColor}
                        onChange={(e) => setMascotProperties({ borderColor: e.target.value })}
                        className="flex-1 px-2 py-1 font-mono text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Border Width Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">Border Width</label>
                    <span className="font-mono text-slate-500">{mascot.borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={mascot.borderWidth}
                    onChange={(e) => setMascotProperties({ borderWidth: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Lighting Glow */}
                <div className="border border-slate-100 bg-slate-50/70 p-2.5 rounded-lg space-y-2.5">
                  <span className="block text-slate-700 font-semibold">Lighting & Glow</span>

                  <div>
                    <label className="block text-slate-600 mb-1">Glow Color</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={toHexColor(mascot.lighting.glowColor, '#3b82f6')}
                        onChange={(e) =>
                          setMascotProperties({
                            lighting: { glowColor: e.target.value },
                          })
                        }
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={mascot.lighting.glowColor}
                        onChange={(e) =>
                          setMascotProperties({
                            lighting: { glowColor: e.target.value },
                          })
                        }
                        className="flex-1 px-2 py-1 font-mono text-xs border border-slate-200 rounded text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-600">Blur</label>
                        <span className="font-mono text-slate-500">{mascot.lighting.glowBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={mascot.lighting.glowBlur}
                        onChange={(e) =>
                          setMascotProperties({
                            lighting: { glowBlur: Number(e.target.value) },
                          })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-600">Spread</label>
                        <span className="font-mono text-slate-500">{mascot.lighting.glowSpread}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={mascot.lighting.glowSpread}
                        onChange={(e) =>
                          setMascotProperties({
                            lighting: { glowSpread: Number(e.target.value) },
                          })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Viewport Coordinates (Position X & Y) */}
                <div className="border border-slate-100 bg-slate-50/70 p-2.5 rounded-lg space-y-2.5">
                  <span className="block text-slate-700 font-semibold">Position Coordinates</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-600">X Coordinate</label>
                        <span className="font-mono text-slate-500">{mascot.position.x}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1400}
                        step={5}
                        value={mascot.position.x}
                        onChange={(e) =>
                          setMascotPosition({
                            x: Number(e.target.value),
                            y: mascot.position.y,
                          })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-600">Y Coordinate</label>
                        <span className="font-mono text-slate-500">{mascot.position.y}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={900}
                        step={5}
                        value={mascot.position.y}
                        onChange={(e) =>
                          setMascotPosition({
                            x: mascot.position.x,
                            y: Number(e.target.value),
                          })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Opacity and Blur */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 font-semibold">Opacity</label>
                      <span className="font-mono text-slate-500">
                        {Math.round(mascot.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={mascot.opacity}
                      onChange={(e) => setMascotProperties({ opacity: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 font-semibold">Blur Filter</label>
                      <span className="font-mono text-slate-500">{mascot.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={mascot.blur}
                      onChange={(e) => setMascotProperties({ blur: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: TEXT BUBBLE CONTROLS                               */}
            {/* ========================================================= */}
            {activeTab === 'bubble' && (
              <div className="space-y-4">
                {/* Text input with Speak button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-semibold">Bubble Text</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bubble.isVisible}
                        onChange={(e) => setBubbleVisibility(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="text-slate-600">Visible</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={bubble.text}
                      onChange={(e) => setBubbleText(e.target.value)}
                      placeholder="Type guide message..."
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      data-testid="speak-bubble-btn"
                      onClick={handleSpeakBubble}
                      className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🗣️ Speak</span>
                    </button>
                  </div>
                </div>

                {/* Shape Selector */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1.5">
                    Bubble Shape
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['rounded', 'square', 'speech-balloon'] as BubbleShape[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBubbleProperties({ shape: s })}
                        className={`py-1.5 px-2 rounded-md capitalize font-medium text-center border transition-all cursor-pointer ${
                          bubble.shape === s
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {s === 'speech-balloon' ? 'Balloon' : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimensions (Max Width & Padding) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 font-semibold">Max Width</label>
                      <span className="font-mono text-slate-500">{bubble.size.maxWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={120}
                      max={600}
                      step={10}
                      value={bubble.size.maxWidth}
                      onChange={(e) =>
                        setBubbleProperties({
                          size: { maxWidth: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 font-semibold">Padding</label>
                      <span className="font-mono text-slate-500">{bubble.size.padding}px</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={32}
                      step={2}
                      value={bubble.size.padding}
                      onChange={(e) =>
                        setBubbleProperties({
                          size: { padding: Number(e.target.value) },
                        })
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>

                {/* Colors (Background & Border) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={toHexColor(bubble.color, '#ffffff')}
                        onChange={(e) => setBubbleProperties({ color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={bubble.color}
                        onChange={(e) => setBubbleProperties({ color: e.target.value })}
                        className="flex-1 px-2 py-1 font-mono text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Border Color
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={toHexColor(bubble.borderColor, '#e2e8f0')}
                        onChange={(e) => setBubbleProperties({ borderColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={bubble.borderColor}
                        onChange={(e) => setBubbleProperties({ borderColor: e.target.value })}
                        className="flex-1 px-2 py-1 font-mono text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography Settings */}
                <div className="border border-slate-100 bg-slate-50/70 p-2.5 rounded-lg space-y-2.5">
                  <span className="block text-slate-700 font-semibold">Typography</span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-600">Font Size</label>
                        <span className="font-mono text-slate-500">
                          {bubble.typography.fontSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={32}
                        value={bubble.typography.fontSize}
                        onChange={(e) =>
                          setBubbleProperties({
                            typography: { fontSize: Number(e.target.value) },
                          })
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Text Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={toHexColor(bubble.typography.textColor, '#1e293b')}
                          onChange={(e) =>
                            setBubbleProperties({
                              typography: { textColor: e.target.value },
                            })
                          }
                          className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={bubble.typography.textColor}
                          onChange={(e) =>
                            setBubbleProperties({
                              typography: { textColor: e.target.value },
                            })
                          }
                          className="flex-1 px-2 py-1 font-mono text-xs border border-slate-200 rounded text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Text Alignment</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['left', 'center', 'right'] as TextAlignment[]).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() =>
                            setBubbleProperties({
                              typography: { textAlign: align },
                            })
                          }
                          className={`py-1 px-2 rounded capitalize font-medium text-center border transition-all cursor-pointer ${
                            bubble.typography.textAlign === align
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Opacity and Blur */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 font-semibold">Opacity</label>
                      <span className="font-mono text-slate-500">
                        {Math.round(bubble.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={bubble.opacity}
                      onChange={(e) => setBubbleProperties({ opacity: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 font-semibold">Blur Filter</label>
                      <span className="font-mono text-slate-500">{bubble.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={bubble.blur}
                      onChange={(e) => setBubbleProperties({ blur: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: AUDIO & SOUND CONTROLS                            */}
            {/* ========================================================= */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                {/* Master Volume */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">Master Volume</label>
                    <span className="font-mono text-slate-500">
                      {Math.round(sound.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={sound.volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Mute / Unmute Toggle Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleMuteToggle}
                    className={`w-full py-2 px-3 rounded-lg font-medium text-xs border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      sound.isMuted
                        ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <span>{sound.isMuted ? '🔇 Audio is Muted (Click to Unmute)' : '🔊 Audio is Active (Click to Mute)'}</span>
                  </button>
                </div>

                {/* Voice Pitch Multiplier */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">Voice Pitch</label>
                    <span className="font-mono text-slate-500">
                      {sound.voicePitch.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={sound.voicePitch}
                    onChange={(e) => handleVoicePitchChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Voice Speed */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-semibold">Voice Speed</label>
                    <span className="font-mono text-slate-500">
                      {sound.voiceSpeed} syl/sec
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={sound.voiceSpeed}
                    onChange={(e) => handleVoiceSpeedChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Test Triggers */}
                <div className="border border-slate-100 bg-slate-50/70 p-3 rounded-lg space-y-2.5">
                  <span className="block text-slate-700 font-semibold">Sound Test Triggers</span>

                  <button
                    type="button"
                    data-testid="test-speech-btn"
                    onClick={handleTestSpeech}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🤖 Test Procedural Voice</span>
                  </button>

                  <button
                    type="button"
                    data-testid="test-chime-btn"
                    onClick={handleTestChime}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🔔 Test Guide Completion Chime</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <button
              type="button"
              data-testid="reset-all-btn"
              onClick={resetAll}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => setCustomizerOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MascotCustomizerPanel;
