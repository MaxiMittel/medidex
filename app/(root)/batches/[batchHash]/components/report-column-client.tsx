"use client";

import { type ReactNode } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { DetailsSheetProvider } from "@/app/context/details-sheet-context";
import StudySheet from "../study-sheet";
import { ReportDetailDto } from "@/types/apiDTOs";
import ReportList from "./report-list";

interface ReportColumnClientProps {
  children: ReactNode;
  reports: ReportDetailDto[];
  batchHash: string;
}

export function ReportColumnClient({ children, reports, batchHash }: ReportColumnClientProps) {
  return (
    <DetailsSheetProvider>
      <PanelGroup
        id={`batch-panels-${batchHash}`}
        direction="horizontal"
        className="h-full"
      >
        <Panel defaultSize={55} minSize={25} className="border-r bg-background min-w-0">
          <ReportList reports={reports} />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

        <Panel defaultSize={45} minSize={35} className="min-w-0">
          {children}
        </Panel>
      </PanelGroup>
      <StudySheet />
    </DetailsSheetProvider>
  );
}
