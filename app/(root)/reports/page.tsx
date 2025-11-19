'use client';

import { useEffect, useMemo } from "react";
import { useBatchReportsStore } from "../../../hooks/use-batch-reports-store";
import { StudyDetailContent } from "./components/study-detail-content";

export default function ReportsPage() {
  const {
    batches,
    reportsByBatch,
    selectedBatchHash,
    loading,
    error,
    fetchBatchesWithReports,
  } = useBatchReportsStore();

  useEffect(() => {
    if (!batches.length) {
      void fetchBatchesWithReports();
    }
  }, [batches.length, fetchBatchesWithReports]);

  const reports = useMemo(() => {
    if (!selectedBatchHash) {
      return [];
    }
    const batchReports = reportsByBatch[selectedBatchHash] || [];
    return batchReports.map((report, index) => ({
      CENTRALReportID: report.trial_id
        ? Number(report.trial_id) || null
        : null,
      CRGReportID: index,
      Title: report.title,
      Abstract: report.abstract ?? undefined,
      Assigned: report.assigned_studies.length > 0,
      AssignedTo: report.assigned_studies.join(", "),
    }));
  }, [reportsByBatch, selectedBatchHash]);

  const relevanceStudies = [
    {
      Linked: false,
      CRGStudyID: 1001,
      ShortName: "Study Alpha",
      Relevance: 0.86,
      NumberParticipants: 245,
      Duration: "12 months",
      Comparison: "{Drug A vs. Placebo}",
      StatusofStudy: "Completed",
      CENTRALSubmissionStatus: "Published",
      TrialistContactDetails: "Dr. John Doe",
      Countries: "USA//Canada",
      ISRCTN: "ISRCTN0000001",
      Notes: "Primary outcome achieved",
      UDef4: "Phase 3",
      reports: [
        {
          CRGReportID: 5001,
          CENTRALReportID: 2001,
          Title: "Primary efficacy outcomes of Study Alpha",
        },
      ],
    },
    {
      Linked: true,
      CRGStudyID: 1002,
      ShortName: "Study Beta",
      Relevance: 0.72,
      NumberParticipants: 312,
      Duration: "18 months",
      Comparison: "{Drug B vs. Drug C}",
      StatusofStudy: "Active",
      CENTRALSubmissionStatus: "In progress",
      TrialistContactDetails: "Dr. Jane Smith",
      Countries: "UK//Germany",
      ISRCTN: "ISRCTN0000002",
      Notes: "Enrollment ongoing",
      UDef4: "Phase 2",
      reports: [
        {
          CRGReportID: 5002,
          CENTRALReportID: 2002,
          Title: "Interim safety analysis of Study Beta",
        },
        {
          CRGReportID: 5003,
          CENTRALReportID: null,
          Title: "Baseline characteristics overview",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground text-sm">
          Fetching batches and report details from Meerkat API via Zustand.
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 border-b bg-red-50">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-4 text-sm text-muted-foreground border-b">
          Loading batches and reports...
        </div>
      )}

      {!loading && reports.length > 0 ? (
        <StudyDetailContent
          reports={reports}
          relevanceStudies={relevanceStudies}
        />
      ) : (
        !loading && (
          <div className="p-6 text-muted-foreground">
            No reports available yet. Upload a batch or try refreshing.
          </div>
        )
      )}
    </div>
  );
}
