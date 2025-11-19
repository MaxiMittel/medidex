'use client';

import { create } from "zustand";
import type { BatchDto, ReportDetailDto } from "../types/apiDTOs";
import { getBatches, getReportData } from "../lib/api/batchApi";
import { login } from "../lib/api/authApi";
import apiClient from "../lib/api/apiClient";

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
      const username = process.env.NEXT_PUBLIC_MEERKAT_USERNAME;
      const password = process.env.NEXT_PUBLIC_MEERKAT_PASSWORD;

      if (!username || !password) {
        throw new Error("Meerkat credentials are not configured.");
      }

      const token = await login(username, password);
      apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token.access_token}`;

      const batches = await getBatches();
      const reportsByBatch: Record<string, ReportDetailDto[]> = {};

      for (const batch of batches) {
        if (!batch.number_reports || batch.number_reports <= 0) {
          reportsByBatch[batch.batch_hash] = [];
          continue;
        }

        const reportPromises = Array.from(
          { length: batch.number_reports },
          (_, reportIndex) => getReportData(batch.batch_hash, reportIndex)
        );

        reportsByBatch[batch.batch_hash] = await Promise.all(reportPromises);
      }

      set({
        batches,
        reportsByBatch,
        selectedBatchHash: batches[0]?.batch_hash,
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
