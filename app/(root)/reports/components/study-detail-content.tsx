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
  loadingMore?: boolean;
  totalReports?: number;
}

export function StudyDetailContent({ reports, loadingMore, totalReports }: StudyDetailContentProps) {
  const {
    similarStudiesByReport,
    similarStudiesLoading,
    fetchSimilarStudiesForReport,
    assignedStudiesByReport,
    assignedStudiesLoading,
    fetchAssignedStudiesForReport,
  } = useBatchReportsStore();
  const [selectedReportIndex, setSelectedReportIndex] = useState<number | null>(
    null
  );

  // Build a map of study ID -> study name from similar studies
  const studyNamesById = useMemo(() => {
    const map: Record<number, string> = {};
    Object.values(similarStudiesByReport).forEach((studies) => {
      studies.forEach((study) => {
        map[study.CRGStudyID] = study.ShortName;
      });
    });
    Object.values(assignedStudiesByReport).forEach((studies) => {
      studies.forEach((study) => {
        map[study.CRGStudyID] = study.ShortName;
      });
    });
    return map;
  }, [similarStudiesByReport, assignedStudiesByReport]);

  // Preload similar studies for all reports with assigned studies to get study names
  useEffect(() => {
    reports.forEach((report) => {
      if (report.assignedStudyIds && report.assignedStudyIds.length > 0) {
        const key = buildReportKey(report.batchHash, report.reportIndex);
        if (!similarStudiesByReport[key] && !similarStudiesLoading[key]) {
          void fetchSimilarStudiesForReport(
            report.batchHash,
            report.reportIndex,
            report.assignedStudyIds
          );
        }
        if (!assignedStudiesByReport[key] && !assignedStudiesLoading[key]) {
          void fetchAssignedStudiesForReport(
            report.batchHash,
            report.reportIndex,
            report.CRGReportID
          );
        }
      }
    });
  }, [
    reports,
    similarStudiesByReport,
    similarStudiesLoading,
    fetchSimilarStudiesForReport,
    assignedStudiesByReport,
    assignedStudiesLoading,
    fetchAssignedStudiesForReport,
  ]);

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
    if (!assignedStudiesByReport[key]) {
      void fetchAssignedStudiesForReport(
        currentReport.batchHash,
        currentReport.reportIndex,
        currentReport.CRGReportID
      );
    }
  }, [
    currentReport,
    fetchSimilarStudiesForReport,
    similarStudiesByReport,
    assignedStudiesByReport,
    fetchAssignedStudiesForReport,
  ]);

  const currentRelevanceStudies: RelevanceStudy[] = useMemo(() => {
    if (!currentReport) {
      return [];
    }
    const key = buildReportKey(
      currentReport.batchHash,
      currentReport.reportIndex
    );
    const assigned = assignedStudiesByReport[key] ?? [];
    const similar = similarStudiesByReport[key] ?? [];

    const seen = new Set<number>();
    const merged: RelevanceStudy[] = [];

    assigned.forEach((study) => {
      if (!seen.has(study.CRGStudyID)) {
        seen.add(study.CRGStudyID);
        merged.push(study);
      }
    });

    similar.forEach((study) => {
      if (!seen.has(study.CRGStudyID)) {
        seen.add(study.CRGStudyID);
        merged.push(study);
      }
    });

    return merged;
  }, [currentReport, assignedStudiesByReport, similarStudiesByReport]);

  const relevanceLoading = useMemo(() => {
    if (!currentReport) {
      return false;
    }
    const key = buildReportKey(
      currentReport.batchHash,
      currentReport.reportIndex
    );
    return (
      (similarStudiesLoading[key] ?? false) ||
      (assignedStudiesLoading[key] ?? false)
    );
  }, [currentReport, similarStudiesLoading, assignedStudiesLoading]);

  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel
        defaultSize={40}
        minSize={25}
        className="border-r bg-background min-w-0"
      >
        <div className="h-full p-4 md:px-6 overflow-hidden flex flex-col">
          <ReportsList
            reports={reports}
            selectedReportIndex={selectedReportIndex ?? undefined}
            onReportSelect={(report) => {
              setSelectedReportIndex(report.reportIndex);
            }}
            loadingMore={loadingMore}
            totalReports={totalReports}
            studyNamesById={studyNamesById}
          />
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

      <Panel defaultSize={60} minSize={35} className="min-w-0">
        <div className="h-full flex flex-col min-w-0 overflow-hidden p-4 md:px-8">
          <StudyRelevanceTable
            studies={currentRelevanceStudies}
            loading={relevanceLoading}
            currentBatchHash={currentReport?.batchHash}
            currentReportIndex={currentReport?.reportIndex}
            currentReportCRGId={currentReport?.CRGReportID}
          />
        </div>
      </Panel>
    </PanelGroup>
  );
}
