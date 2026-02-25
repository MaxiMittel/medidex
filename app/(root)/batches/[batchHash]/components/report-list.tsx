import { Skeleton } from "@/components/ui/skeleton";
import { getBatchReports } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import ReportListClient from "./report-list-client";

interface ReportListProps {
  batchHash?: string;
}

export default async function ReportList({ batchHash }: ReportListProps) {
  if (!batchHash) {
    return null;
  }

  const headers = await getMeerkatHeaders();
  const reports = await getBatchReports(batchHash, { headers });

  /*const reportItems = reports.map((report, index) => ({
    reportIndex: index,
    batchHash,
    assignedStudies: report.assignedStudies ?? [],
    reportId: report.report.reportId,
    title: report.report.title,
    abstract: report.report.abstract ?? undefined,
    year: report.report.year ?? undefined,
    authors:
      report.report.authors && report.report.authors.length > 0
        ? report.report.authors.join(", ")
        : undefined,
  }));*/
        
  return (
    <ReportListClient
      reports={reports}
      //totalReports={reportItems.length}
    />
  );
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
