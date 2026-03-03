"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsList } from "@/components/ui/study-view/reports-list";
import { useReportStore } from "@/hooks/use-report-store";
import { ReportDetailDto } from "@/types/apiDTOs";

async function fetchBatchReports(batchHash: string): Promise<ReportDetailDto[]> {
  const response = await fetch(`/api/meerkat/batches/${batchHash}/reports`, {
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: string }).error
        : null;
    throw new Error(message ?? "Failed to load reports.");
  }

  return (payload as ReportDetailDto[]) ?? [];
}

export default function ReportList() {
  const params = useParams<{ batchHash?: string | string[] }>();
  const paramValue = params?.batchHash;
  const batchHash =
    typeof paramValue === "string"
      ? paramValue
      : Array.isArray(paramValue)
      ? paramValue[0]
      : undefined;
  const setReports = useReportStore((state) => state.setReports);
  const [reports, setReportsState] = useState<ReportDetailDto[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!batchHash) {
      setReportsState(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadReports = async () => {
      setIsLoading(true);
      setError(null);
      setReportsState(null);

      try {
        const data = await fetchBatchReports(batchHash);
        if (cancelled) {
          return;
        }
        setReportsState(data);
        setReports(data);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Unexpected error while loading reports.";
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [batchHash, reloadKey, setReports]);

  const handleRetry = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  if (!batchHash) {
    return null;
  }

  if (isLoading && !reports) {
    return <ReportListSkeleton />;
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load reports: {error}
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry} disabled={isLoading}>
          Try again
        </Button>
      </div>
    );
  }

  if (!reports) {
    return null;
  }

  return <ReportsList reports={reports} />;
}

export function ReportListSkeleton() {
  const placeholders = Array.from({ length: 4 });

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:px-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex-1 space-y-4 overflow-hidden">
        {placeholders.map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card/70 p-4 space-y-2"
          >
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-14" />
              <Skeleton className="h-2 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
