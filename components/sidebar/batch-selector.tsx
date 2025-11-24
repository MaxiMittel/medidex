'use client';

import { useEffect } from "react";
import { useBatchReportsStore } from "../../hooks/use-batch-reports-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BatchSelector() {
  const {
    batches,
    selectedBatchHash,
    loading,
    fetchBatches,
    selectBatch,
  } = useBatchReportsStore();

  useEffect(() => {
    if (!batches.length) {
      void fetchBatches();
    }
  }, [batches.length, fetchBatches]);

  if (loading || batches.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <label htmlFor="batch-select" className="text-sm font-medium whitespace-nowrap hidden sm:inline">
        Batch:
      </label>
      <Select
        value={selectedBatchHash || ""}
        onValueChange={selectBatch}
      >
        <SelectTrigger id="batch-select" className="w-full sm:w-[400px] h-8">
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
  );
}

