"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";
import { StudyDetailContent } from "./components/study-detail-content";
import type { BatchDto, ReportDetailDto } from "@/types/apiDTOs";

interface ReportsPageClientProps {
    initialBatches: BatchDto[];
    initialReports: ReportDetailDto[];
    selectedBatchHash: string | null;
}

export function ReportsPageClient({
    initialBatches,
    initialReports,
    selectedBatchHash,
}: ReportsPageClientProps) {
    const router = useRouter();

    const {
        batches,
        reportsByBatch,
        selectedBatchHash: storeSelectedBatch,
        loading,
        loadingReports,
        loadingMoreReports,
        error,
        selectBatch,
        setBatches,
    } = useBatchReportsStore();

    // Initialize store with server data on mount
    useEffect(() => {
        if (initialBatches.length > 0 && batches.length === 0) {
            setBatches(initialBatches);
        }
    }, [initialBatches, batches.length, setBatches]);

    // Sync batch selection from URL
    useEffect(() => {
        if (selectedBatchHash && batches.length > 0) {
            const batchExists = batches.some((b) => b.batch_hash === selectedBatchHash);
            if (batchExists && storeSelectedBatch !== selectedBatchHash) {
                selectBatch(selectedBatchHash);
            }
        }
    }, [selectedBatchHash, batches, storeSelectedBatch, selectBatch]);

    // Sync URL when batch changes (e.g., from sidebar selection)
    useEffect(() => {
        if (storeSelectedBatch && storeSelectedBatch !== selectedBatchHash) {
            router.replace(`/reports?batch=${storeSelectedBatch}`);
        }
    }, [storeSelectedBatch, selectedBatchHash, router]);

    // Redirect to home page if no batch is selected/available and not loading
    useEffect(() => {
        if (!loading && !storeSelectedBatch && !selectedBatchHash && batches.length > 0) {
            router.replace("/");
        }
    }, [loading, storeSelectedBatch, selectedBatchHash, batches.length, router]);

    // Use initial reports from server, falling back to store
    const currentBatchHash = storeSelectedBatch || selectedBatchHash;
    const storeReports = currentBatchHash ? reportsByBatch[currentBatchHash] : undefined;

    // Use server-provided reports if store doesn't have them yet
    const rawReports = useMemo(() => {
        if (storeReports && storeReports.length > 0) {
            return storeReports;
        }
        if (selectedBatchHash === currentBatchHash && initialReports.length > 0) {
            return initialReports;
        }
        return [];
    }, [storeReports, initialReports, selectedBatchHash, currentBatchHash]);

    const reports = useMemo(() => {
        if (!currentBatchHash) {
            return [];
        }
        return rawReports.map((report, index) => {
            const assignedStudies = report.assigned_studies ?? [];
            return {
                reportIndex: index,
                batchHash: currentBatchHash,
                assignedStudyIds: assignedStudies,
                CENTRALReportID: report.trial_id
                    ? Number(report.trial_id) || null
                    : null,
                CRGReportID: report.crgreportid,
                Title: report.title,
                Abstract: report.abstract ?? undefined,
                Year: report.year ?? undefined,
                Authors: report.authors ? report.authors.join(", ") : undefined,
                Assigned: assignedStudies.length > 0,
                AssignedTo: assignedStudies.join(", "),
            };
        });
    }, [rawReports, currentBatchHash]);

    const selectedBatch = useMemo(() => {
        const allBatches = batches.length > 0 ? batches : initialBatches;
        return allBatches.find((b) => b.batch_hash === currentBatchHash);
    }, [batches, initialBatches, currentBatchHash]);

    const isLoading = loading && batches.length === 0;
    const isLoadingReports = loadingReports && rawReports.length === 0;
    const allBatches = batches.length > 0 ? batches : initialBatches;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {isLoading && (
                <p className="text-muted-foreground text-sm mt-2 shrink-0">
                    Loading batches from Meerkat API...
                </p>
            )}

            {error && (
                <div className="p-4 text-sm text-red-500 border-b bg-red-50 shrink-0">
                    {error}
                </div>
            )}

            {isLoadingReports && (
                <div className="p-4 text-sm text-muted-foreground border-b shrink-0">
                    Loading reports for {selectedBatch?.batch_description}...
                </div>
            )}

            {loadingMoreReports && !isLoadingReports && (
                <div className="p-4 text-sm text-muted-foreground border-b bg-blue-50 shrink-0">
                    Loading additional reports in background...
                </div>
            )}

            {!isLoading && allBatches.length === 0 && !error && (
                <div className="p-6 text-muted-foreground shrink-0">
                    No batches available. Upload a batch to get started.
                </div>
            )}

            {!isLoadingReports && currentBatchHash && reports.length > 0 ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                    <StudyDetailContent
                        reports={reports}
                        loadingMore={loadingMoreReports}
                        totalReports={selectedBatch?.number_reports}
                    />
                </div>
            ) : (
                !isLoadingReports &&
                currentBatchHash &&
                reports.length === 0 && (
                    <div className="p-6 text-muted-foreground shrink-0">
                        No reports found in this batch.
                    </div>
                )
            )}

            {!currentBatchHash && allBatches.length > 0 && !isLoading && (
                <div className="p-6 text-muted-foreground shrink-0">
                    Redirecting to batch selection...
                </div>
            )}
        </div>
    );
}
