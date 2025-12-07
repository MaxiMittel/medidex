"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useBatchReportsStore,
  buildReportKey,
} from "@/hooks/use-batch-reports-store";

interface LoadMoreStudiesButtonProps {
  currentBatchHash?: string;
  currentReportIndex?: number;
  currentStudiesCount: number;
}

export function LoadMoreStudiesButton({
  currentBatchHash,
  currentReportIndex,
  currentStudiesCount,
}: LoadMoreStudiesButtonProps) {
  const {
    loadMoreSimilarStudies,
    similarStudiesLimit,
    similarStudiesLoading,
    reportsByBatch,
  } = useBatchReportsStore();

  if (currentBatchHash === undefined || currentReportIndex === undefined) {
    return null;
  }

  const key = buildReportKey(currentBatchHash, currentReportIndex);
  const currentLimit = similarStudiesLimit[key] || 10;
  const isLoadingMore = similarStudiesLoading[key] || false;
  const hasMore = currentStudiesCount >= currentLimit;
  const currentReport = reportsByBatch[currentBatchHash]?.[currentReportIndex];
  const assignedStudyIds = currentReport?.assigned_studies || [];

  if (!hasMore && !isLoadingMore) {
    return null;
  }

  return (
    <div className="flex justify-center pt-4 pb-2">
      <Button
        variant="outline"
        onClick={async () => {
          if (
            currentBatchHash &&
            currentReportIndex !== undefined &&
            !isLoadingMore
          ) {
            await loadMoreSimilarStudies(
              currentBatchHash,
              currentReportIndex,
              assignedStudyIds
            );
          }
        }}
        disabled={isLoadingMore}
        className="min-w-32"
      >
        {isLoadingMore ? (
          <>
            <Spinner className="mr-2" />
            Loading more studies...
          </>
        ) : (
          "Load More"
        )}
      </Button>
    </div>
  );
}
