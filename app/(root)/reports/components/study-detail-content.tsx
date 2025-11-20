"use client";

import { useEffect, useMemo, useState } from "react";
import { StudyRelevanceTable } from "./study-relevance-table";
import { ReportsList } from "./reports-list";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import {
  useBatchReportsStore,
  buildReportKey,
} from "@/hooks/use-batch-reports-store";
import type { RelevanceStudy } from "@/types/reports";

interface StudyDetailContentProps {
  reports: Array<{
    reportIndex: number;
    batchHash: string;
    assignedStudyIds: number[];
    CENTRALReportID?: number | null;
    CRGReportID: number;
    Title: string;
    Abstract?: string;
    Year?: number;
    DatetoCENTRAL?: string;
    Dateentered?: string;
    NumberParticipants?: string | number;
    Assigned?: boolean;
    AssignedTo?: string;
  }>;
}

export function StudyDetailContent({ reports }: StudyDetailContentProps) {
  const {
    similarStudiesByReport,
    similarStudiesLoading,
    fetchSimilarStudiesForReport,
  } = useBatchReportsStore();

  const [selectedReportIndex, setSelectedReportIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (reports.length === 0) {
      setSelectedReportIndex(null);
      return;
    }

    if (
      selectedReportIndex === null ||
      !reports.some((report) => report.reportIndex === selectedReportIndex)
    ) {
      setSelectedReportIndex(reports[0].reportIndex);
    }
  }, [reports, selectedReportIndex]);

  const currentReport = useMemo(() => {
    if (selectedReportIndex === null) {
      return undefined;
    }
    return reports.find((report) => report.reportIndex === selectedReportIndex);
  }, [reports, selectedReportIndex]);

  useEffect(() => {
    if (!currentReport) {
      return;
    }
    const key = buildReportKey(
      currentReport.batchHash,
      currentReport.reportIndex
    );
    if (!similarStudiesByReport[key]) {
      void fetchSimilarStudiesForReport(
        currentReport.batchHash,
        currentReport.reportIndex,
        currentReport.assignedStudyIds ?? []
      );
    }
  }, [currentReport, fetchSimilarStudiesForReport, similarStudiesByReport]);

  const currentRelevanceStudies: RelevanceStudy[] = useMemo(() => {
    if (!currentReport) {
      return [];
    }
    const key = buildReportKey(
      currentReport.batchHash,
      currentReport.reportIndex
    );
    return similarStudiesByReport[key] ?? [];
  }, [currentReport, similarStudiesByReport]);

  const relevanceLoading = useMemo(() => {
    if (!currentReport) {
      return false;
    }
    const key = buildReportKey(
      currentReport.batchHash,
      currentReport.reportIndex
    );
    return similarStudiesLoading[key] ?? false;
  }, [currentReport, similarStudiesLoading]);

  return (
    <PanelGroup direction="horizontal" className="h-screen">
      <Panel
        defaultSize={40}
        minSize={25}
        className="border-r bg-background min-w-0"
      >
        <div className="h-full p-4 md:px-6 overflow-hidden">
          <ReportsList
            reports={reports}
            selectedReportIndex={selectedReportIndex ?? undefined}
            onReportSelect={(report) => {
              setSelectedReportIndex(report.reportIndex);
            }}
          />
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

      <Panel defaultSize={60} minSize={35} className="min-w-0">
        <div className="h-full flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:px-8">
            <StudyRelevanceTable
              studies={currentRelevanceStudies}
              loading={relevanceLoading}
            />
          </div>
        </div>
      </Panel>
    </PanelGroup>
  );
}
