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
    return batchReports.map((report, index) => ({
      reportIndex: index,
      batchHash: selectedBatchHash,
      assignedStudyIds: report.assigned_studies ?? [],
      CENTRALReportID: report.trial_id ? Number(report.trial_id) || null : null,
      CRGReportID: index,
      Title: report.title,
      Abstract: report.abstract ?? undefined,
      Assigned: report.assigned_studies.length > 0,
      AssignedTo: report.assigned_studies.join(", "),
    }));
  }, [reportsByBatch, selectedBatchHash]);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.batch_hash === selectedBatchHash);
  }, [batches, selectedBatchHash]);

  return (
    <div className="flex flex-col h-full">
      {loading && (
        <p className="text-muted-foreground text-sm mt-2">
          Loading batches from Meerkat API...
        </p>
      )}

      {error && (
        <div className="p-4 text-sm text-red-500 border-b bg-red-50">
          {error}
        </div>
      )}

      {loadingReports && (
        <div className="p-4 text-sm text-muted-foreground border-b">
          Loading reports for {selectedBatch?.batch_description}...
        </div>
      )}

      {loadingMoreReports && !loadingReports && (
        <div className="p-4 text-sm text-muted-foreground border-b bg-blue-50">
          Loading additional reports in background...
        </div>
      )}

      {!loading && batches.length === 0 && !error && (
        <div className="p-6 text-muted-foreground">
          No batches available. Upload a batch to get started.
        </div>
      )}

      {!loadingReports && selectedBatchHash && reports.length > 0 ? (
        <StudyDetailContent
          reports={reports}
          loadingMore={loadingMoreReports}
          totalReports={selectedBatch?.number_reports}
        />
      ) : (
        !loadingReports &&
        selectedBatchHash &&
        reports.length === 0 && (
          <div className="p-6 text-muted-foreground">
            No reports found in this batch.
          </div>
        )
      )}

      {!selectedBatchHash && batches.length > 0 && !loading && (
        <div className="p-6 text-muted-foreground">
          Please select a batch to view its reports.
        </div>
      )}
    </div>
  );
}
