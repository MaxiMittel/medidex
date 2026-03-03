"use client";

import { Suspense, type ReactNode } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { DetailsSheetProvider } from "@/app/context/details-sheet-context";
import StudySheet from "../study-sheet";
import { ReportDetailDto } from "@/types/apiDTOs";
import ReportList from "./report-list";
import { Skeleton } from "@/components/ui/skeleton";

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
      <PanelGroup
        id={panelBaseId}
        direction="horizontal"
        className="h-full"
      >
        <Panel
          id={reportsPanelId}
          defaultSize={55}
          minSize={25}
          className="border-r bg-background min-w-0"
        >
          <ReportList reports={reports} />
        </Panel>

        <PanelResizeHandle
          id={resizeHandleId}
          className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize"
        />

        <Panel
          id={detailsPanelId}
          defaultSize={45}
          minSize={35}
          className="min-w-0"
        >
          <Suspense fallback={<ReportDetailsSkeleton />}>
            {children}
          </Suspense>
        </Panel>
      </PanelGroup>
      <StudySheet />
    </DetailsSheetProvider>
  );
}

function ReportDetailsSkeleton() {
  const rowPlaceholders = Array.from({ length: 4 });

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden p-4 md:px-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex-1 mt-4 space-y-4 overflow-hidden">
        {rowPlaceholders.map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card/70 p-4 space-y-3"
          >
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
