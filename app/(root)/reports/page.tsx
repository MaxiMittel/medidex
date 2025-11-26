"use client";

import { useMemo } from "react";
import { useBatchReportsStore } from "../../../hooks/use-batch-reports-store";
import { StudyDetailContent } from "./components/study-detail-content";

export default function ReportsPage() {
  const {
    batches,
    reportsByBatch,
    selectedBatchHash,
    loading,
    loadingReports,
    loadingMoreReports,
    error,
  } = useBatchReportsStore();

  const reports = useMemo(() => {
    if (!selectedBatchHash) {
      return [];
    }
    const batchReports = reportsByBatch[selectedBatchHash] || [];
    return batchReports.map((report, index) => {
      const assignedStudies = report.assigned_studies ?? [];
      return {
        reportIndex: index,
        batchHash: selectedBatchHash,
        assignedStudyIds: assignedStudies,
        CENTRALReportID: report.trial_id
          ? Number(report.trial_id) || null
          : null,
        CRGReportID: index,
        Title: report.title,
        Abstract: report.abstract ?? undefined,
        Assigned: assignedStudies.length > 0,
        AssignedTo: assignedStudies.join(", "),
      };
    });
  }, [reportsByBatch, selectedBatchHash]);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.batch_hash === selectedBatchHash);
  }, [batches, selectedBatchHash]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {loading && (
        <p className="text-muted-foreground text-sm mt-2 shrink-0">
          Loading batches from Meerkat API...
        </p>
      )}

      {error && (
        <div className="p-4 text-sm text-red-500 border-b bg-red-50 shrink-0">
          {error}
        </div>
      )}

      {loadingReports && (
        <div className="p-4 text-sm text-muted-foreground border-b shrink-0">
          Loading reports for {selectedBatch?.batch_description}...
        </div>
      )}

      {loadingMoreReports && !loadingReports && (
        <div className="p-4 text-sm text-muted-foreground border-b bg-blue-50 shrink-0">
          Loading additional reports in background...
        </div>
      )}

      {!loading && batches.length === 0 && !error && (
        <div className="p-6 text-muted-foreground shrink-0">
          No batches available. Upload a batch to get started.
        </div>
      )}

      {!loadingReports && selectedBatchHash && reports.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <StudyDetailContent
            reports={reports}
            loadingMore={loadingMoreReports}
            totalReports={selectedBatch?.number_reports}
          />
        </div>
      ) : (
        !loadingReports &&
        selectedBatchHash &&
        reports.length === 0 && (
          <div className="p-6 text-muted-foreground shrink-0">
            No reports found in this batch.
          </div>
        )
      )}

      {!selectedBatchHash && batches.length > 0 && !loading && (
        <div className="p-6 text-muted-foreground shrink-0">
          Please select a batch to view its reports.
        </div>
      )}
    </div>
  );
}
