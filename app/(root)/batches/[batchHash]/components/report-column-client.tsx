"use client";

import { type ReactNode } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
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
  const panelBaseId = `batch-panels-${batchHash}`;
  const reportsPanelId = `${panelBaseId}-reports`;
  const detailsPanelId = `${panelBaseId}-details`;
  const resizeHandleId = `${panelBaseId}-resize-handle`;

  return (
    <DetailsSheetProvider>
      <ResizablePanelGroup
        id={panelBaseId}
        direction="horizontal"
        className="h-full"
      >
        <ResizablePanel
          id={reportsPanelId}
          defaultSize={55}
          minSize={25}
          className="border-r bg-background min-w-0 flex-[0_0_55%]"
        >
          <ReportList reports={reports} />
        </ResizablePanel>

        <ResizableHandle
          id={resizeHandleId}
          className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize"
        />

        <ResizablePanel
          id={detailsPanelId}
          defaultSize={45}
          minSize={35}
          className="min-w-0 flex-[0_0_45%]"
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
      <StudySheet />
    </DetailsSheetProvider>
  );
}
