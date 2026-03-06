"use client";

import { type ReactNode } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ReportDetailDto } from "@/types/apiDTOs";
import { ReportList } from "@/components/ui/study-view/report-list";

interface ReportColumnClientProps {
  children: ReactNode;
  reports: ReportDetailDto[];
  projectId: string;
}

const reportFilterOptions = [
  { value: "withPdf", label: "PDF" },
  { value: "WithoutPdf", label: "No PDF" },
];

export function ReportColumnClient({ children, reports, projectId }: ReportColumnClientProps) {
  const panelBaseId = `project-panels-${projectId}`;
  const reportsPanelId = `${panelBaseId}-reports`;
  const detailsPanelId = `${panelBaseId}-details`;
  const resizeHandleId = `${panelBaseId}-resize-handle`;
  
  return (
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
          <ReportList
            reports={reports}
            baseUrl="pdf-upload"
            useStudyBadges={false}
            filterOptions={reportFilterOptions}
          />
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
  );
}
