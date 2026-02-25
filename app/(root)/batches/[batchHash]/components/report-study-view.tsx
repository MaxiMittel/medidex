"use client";

import { Panel, PanelResizeHandle, PanelGroup} from "react-resizable-panels";
import { ReactNode } from "react";

type ReportStudyViewProps = {
  left: ReactNode;
  right: ReactNode;
};

export default function ReportStudyView({ left, right }: ReportStudyViewProps) {

  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={40} minSize={25} className="border-r bg-background min-w-0">
        {left}
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

      <Panel defaultSize={60} minSize={35} className="min-w-0">
        {right}
      </Panel>
    </PanelGroup>
  );
}