"use client";

import { useEffect } from "react";
import { ReportsList } from "@/components/ui/study-view/reports-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useReportStore } from "@/hooks/use-report-store";
import { ReportDetailDto } from "@/types/apiDTOs";
import { cn } from "@/lib/utils";

interface ReportListProps {
  reports: ReportDetailDto[];
}

export default function ReportList({ reports }: ReportListProps) {
  const setReports = useReportStore((state) => state.setReports);

  useEffect(() => {
    setReports(reports);
  }, [reports, setReports]);

  return <ReportsList reports={reports} />;
}

interface ReportListSkeletonProps {
  className?: string;
}

export function ReportListSkeleton({ className }: ReportListSkeletonProps = {}) {
  const placeholders = Array.from({ length: 4 });

  return (
    <div className={cn("h-full flex flex-col gap-4 p-4 md:px-6", className)}>
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
