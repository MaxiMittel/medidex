'use client';

import { useEffect, useMemo } from "react";
import { useBatchReportsStore } from "../../../hooks/use-batch-reports-store";
import { StudyDetailContent } from "./components/study-detail-content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const {
    batches,
    reportsByBatch,
    selectedBatchHash,
    loading,
    loadingReports,
    error,
    fetchBatches,
    selectBatch,
  } = useBatchReportsStore();

  useEffect(() => {
    if (!batches.length) {
      void fetchBatches();
    }
  }, [batches.length, fetchBatches]);

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

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.batch_hash === selectedBatchHash);
  }, [batches, selectedBatchHash]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          {loading && (
            <p className="text-muted-foreground text-sm mt-2">
              Loading batches from Meerkat API...
            </p>
          )}
        </div>

        {!loading && batches.length > 0 && (
          <div className="flex items-center gap-4">
            <label htmlFor="batch-select" className="text-sm font-medium">
              Select Batch:
            </label>
            <Select
              value={selectedBatchHash || ""}
              onValueChange={selectBatch}
            >
              <SelectTrigger id="batch-select" className="w-[400px]">
                <SelectValue placeholder="Select a batch to view reports" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.batch_hash} value={batch.batch_hash}>
                    {batch.batch_description} ({batch.number_reports} reports)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

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

      {!loading && batches.length === 0 && !error && (
        <div className="p-6 text-muted-foreground">
          No batches available. Upload a batch to get started.
        </div>
      )}

      {!loadingReports && selectedBatchHash && reports.length > 0 ? (
        <StudyDetailContent reports={reports} />
      ) : (
        !loadingReports && selectedBatchHash && reports.length === 0 && (
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
