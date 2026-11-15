'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ShellLayout } from '@/components/ShellLayout';
import { SpreadsheetControls } from '@/components/SpreadsheetControls';
import { SpreadsheetContainer } from '@/components/SpreadsheetContainer';
import { OverlayLayer } from '@/components/OverlayLayer';
import { MascotOverlayLayer } from '@/components/MascotOverlayLayer';
import { MascotCustomizerPanel } from '@/components/MascotCustomizerPanel';
import { soundController } from '@/lib/audio/soundController';
import { useMascotStore } from '@/store/mascotStore';

const SpreadsheetWrapper = dynamic(
  () => import('@/components/SpreadsheetWrapper'),
  { ssr: false }
);

export default function HomePage() {
  const handleCompleteGuide = () => {
    soundController.playCompletion();
    useMascotStore
      .getState()
      .setBubbleText('🎉 Excellent work! You completed this guide successfully!', true);
    useMascotStore.getState().setBubbleVisibility(true);
  };

  const sidebarContent = (
    <div className="h-full p-4 bg-gray-50 border-r flex flex-col justify-between">
      <div>
        <h2 className="font-semibold text-gray-700">Lesson Outline</h2>
        <p className="text-sm text-gray-500 mt-2">Lesson sidebar placeholder</p>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          type="button"
          data-testid="complete-guide-btn"
          onClick={handleCompleteGuide}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Complete Guide</span>
        </button>
      </div>
    </div>
  );

  const mainContent = (
    <div className="h-full flex flex-col">
      <SpreadsheetControls />
      <div className="relative flex-1 overflow-hidden">
        <SpreadsheetContainer>
          <SpreadsheetWrapper />
        </SpreadsheetContainer>
        <OverlayLayer />
      </div>
    </div>
  );

  return (
    <>
      <ShellLayout sidebar={sidebarContent} main={mainContent} />
      <MascotOverlayLayer />
      <MascotCustomizerPanel />
    </>
  );
}

