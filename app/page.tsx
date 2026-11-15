'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ShellLayout } from '@/components/ShellLayout';
import { SpreadsheetControls } from '@/components/SpreadsheetControls';
import { SpreadsheetContainer } from '@/components/SpreadsheetContainer';
import { OverlayLayer } from '@/components/OverlayLayer';

const SpreadsheetWrapper = dynamic(
  () => import('@/components/SpreadsheetWrapper'),
  { ssr: false }
);

export default function HomePage() {
  const sidebarContent = (
    <div className="h-full p-4 bg-gray-50 border-r">
      <h2 className="font-semibold text-gray-700">Lesson Outline</h2>
      <p className="text-sm text-gray-500 mt-2">Lesson sidebar placeholder</p>
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

  return <ShellLayout sidebar={sidebarContent} main={mainContent} />;
}
