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
      reportIndex: index,
      batchHash: selectedBatchHash,
      assignedStudyIds: report.assigned_studies ?? [],
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
        <StudyDetailContent reports={reports} />
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
