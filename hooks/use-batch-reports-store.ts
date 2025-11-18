'use client';

import { create } from "zustand";
import type { BatchDto, ReportDetailDto } from "../types/apiDTOs";

export interface BatchReportsState {
  batches: BatchDto[];
  reportsByBatch: Record<string, ReportDetailDto[]>;
  selectedBatchHash?: string;
  loading: boolean;
  error?: string;
  fetchBatchesWithReports: () => Promise<void>;
  selectBatch: (batchHash: string) => void;
}

export const useBatchReportsStore = create<BatchReportsState>((set, get) => ({
  batches: [],
  reportsByBatch: {},
  selectedBatchHash: undefined,
  loading: false,
  error: undefined,
  fetchBatchesWithReports: async () => {
    set({ loading: true, error: undefined });
    try {
      const response = await fetch("/api/meerkat/batches");
      if (!response.ok) {
        const payload = await response.json().catch(() => undefined);
        throw new Error(
          payload?.error || "Failed to load batches and reports."
        );
      }

      const data = (await response.json()) as {
        batches: BatchDto[];
        reportsByBatch: Record<string, ReportDetailDto[]>;
      };

      set({
        batches: data.batches,
        reportsByBatch: data.reportsByBatch,
        selectedBatchHash: data.batches[0]?.batch_hash,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load batches and reports.",
        loading: false,
      });
    }
  },
  selectBatch: (batchHash: string) => {
    if (get().selectedBatchHash === batchHash) {
      return;
    }
    set({ selectedBatchHash: batchHash });
  },
}));
