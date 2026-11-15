'use client';

import React from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

export interface ShellLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
}

export function ShellLayout({ sidebar, main }: ShellLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className="h-screen">
      <Panel defaultSize={25} minSize={15} collapsible>
        {sidebar}
      </Panel>
      <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-400 transition-colors cursor-col-resize" />
      <Panel defaultSize={75} minSize={40}>
        {main}
      </Panel>
    </PanelGroup>
  );
}

export default ShellLayout;
