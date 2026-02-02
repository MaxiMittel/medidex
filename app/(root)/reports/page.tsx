import { getBatches, getReportData } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import { ReportsPageClient } from "./reports-page-client";
import type { ReportDetailDto } from "@/types/apiDTOs";

interface ReportsPageProps {
  searchParams: Promise<{ batch?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { batch: selectedBatchHash } = await searchParams;

  // Fetch batches on the server
  const headers = await getMeerkatHeaders();
  const batches = await getBatches({ headers });

  // If a batch is selected, fetch initial reports for it
  let initialReports: ReportDetailDto[] = [];

  if (selectedBatchHash) {
    const selectedBatch = batches.find((b) => b.batch_hash === selectedBatchHash);

    if (selectedBatch && selectedBatch.number_reports && selectedBatch.number_reports > 0) {
      const INITIAL_BATCH_SIZE = 10;
      const initialBatchSize = Math.min(INITIAL_BATCH_SIZE, selectedBatch.number_reports);

      // Fetch initial reports in parallel
      const reportPromises = Array.from({ length: initialBatchSize }, (_, index) =>
        getReportData(selectedBatchHash, index, { headers })
      );

      try {
        initialReports = await Promise.all(reportPromises);
      } catch (error) {
        console.error("Error fetching initial reports:", error);
        // Continue with empty reports - client will handle the error state
      }
    }
  }

  return (
    <ReportsPageClient
      initialBatches={batches}
      initialReports={initialReports}
      selectedBatchHash={selectedBatchHash ?? null}
    />
  );
}
