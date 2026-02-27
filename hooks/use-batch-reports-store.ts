"use client";

import { create } from "zustand";
import type {
  BatchDto,
  ReportDetailDto,
} from "../types/apiDTOs";
import { useReportStore } from "./use-report-store";

export interface BatchReportsState {
  batches: BatchDto[];
  reportsByBatch: Record<string, BatchReportsEntry>;
  selectedBatchHash?: string;
  loading: boolean;
  loadingReports: boolean;
  error?: string;
  setBatches: (batches: BatchDto[]) => void;
  fetchBatches: () => Promise<void>;
  fetchReportsForBatch: (batchHash: string) => Promise<void>;
  setReportsForBatch: (batchHash: string, reports: ReportDetailDto[]) => void;
  selectBatch: (batchHash: string) => void;
  assignStudyToReport: (
    batchHash: string,
    reportId: number,
    studyId: number
  ) => Promise<void>;
  unassignStudyFromReport: (
    batchHash: string,
    reportId: number,
    studyId: number
  ) => Promise<void>;
}

type BatchReportsEntry = {
  order: number[];
  map: Record<number, ReportDetailDto>;
};

const buildReportsCollection = (reports: ReportDetailDto[]): BatchReportsEntry =>
  reports.reduce<BatchReportsEntry>((acc, report) => {
    const reportId = report.report?.reportId;
    if (typeof reportId === "number") {
      acc.order.push(reportId);
      acc.map[reportId] = report;
    }
    return acc;
  }, { order: [], map: {} });

export const useBatchReportsStore = create<BatchReportsState>((set, get) => ({
  batches: [],
  reportsByBatch: {},
  selectedBatchHash: undefined,
  loading: false,
  loadingReports: false,
  error: undefined,
  setBatches: (batches: BatchDto[]) => {
    if (get().batches.length === 0) {
      set({ batches });
    }
  },
  fetchBatches: async () => {
    set({ loading: true, error: undefined });
    try {
      const response = await fetch("/api/meerkat/batches");
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to load batches via proxy route."
        );
      }
      const batches = (await response.json()) as BatchDto[];
      set({ batches, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load batches.",
        loading: false,
      });
    }
  },
  fetchReportsForBatch: async (batchHash: string) => {
    set({ loadingReports: true, error: undefined });
    try {
      const batch = get().batches.find((b) => b.batch_hash === batchHash);
      if (!batch) {
        throw new Error("Batch not found.");
      }
      if (!batch.number_reports || batch.number_reports <= 0) {
        get().setReportsForBatch(batchHash, []);
        set({ loadingReports: false });
        return;
      }
      const response = await fetch(
        `/api/meerkat/batches/${batchHash}/reports`
      );
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to load reports via proxy route."
        );
      }
      const reports = (await response.json()) as ReportDetailDto[];
      get().setReportsForBatch(batchHash, reports);
      set({ loadingReports: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load reports.",
        loadingReports: false,
      });
    }
  },
  setReportsForBatch: (batchHash: string, reports: ReportDetailDto[]) => {
    const collection = buildReportsCollection(reports);
    set((state) => ({
      reportsByBatch: {
        ...state.reportsByBatch,
        [batchHash]: collection,
      },
    }));
  },
  selectBatch: (batchHash: string) => {
    if (get().selectedBatchHash === batchHash) {
      return;
    }
    set({ selectedBatchHash: batchHash });
    const batchReports = get().reportsByBatch[batchHash];
    if (!batchReports) {
      void get().fetchReportsForBatch(batchHash);
    }
  },
  assignStudyToReport: async (
    batchHash: string,
    reportId: number,
    studyId: number
  ) => {
    try {
      const batchEntry = get().reportsByBatch[batchHash];
      const currentReport = batchEntry?.map[reportId];
      if (!currentReport) {
        throw new Error("Report not found");
      }
      const currentAssignedStudies = currentReport.assignedStudies || [];
      if (currentAssignedStudies.includes(studyId)) {
        return;
      }
      const updatedStudies = [...currentAssignedStudies, studyId];
      const response = await fetch(`/api/meerkat/reports/${reportId}/studies`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_ids: updatedStudies }),
      });
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Failed to assign study to report.");
      }
      set((state) => {
        const entry = state.reportsByBatch[batchHash];
        if (!entry) {
          return state;
        }
        const updatedReport = {
          ...entry.map[reportId],
          assignedStudies: updatedStudies,
        };
        return {
          reportsByBatch: {
            ...state.reportsByBatch,
            [batchHash]: {
              order: [...entry.order],
              map: {
                ...entry.map,
                [reportId]: updatedReport,
              },
            },
          },
        };
      });
      useReportStore.getState().addAssignedStudy(reportId, studyId);
    } catch (error) {
      console.error("Failed to assign study to report:", error);
      throw error;
    }
  },
  unassignStudyFromReport: async (
    batchHash: string,
    reportId: number,
    studyId: number
  ) => {
    try {
      const batchEntry = get().reportsByBatch[batchHash];
      const currentReport = batchEntry?.map[reportId];
      if (!currentReport) {
        throw new Error("Report not found");
      }
      const currentAssignedStudies = currentReport.assignedStudies || [];
      if (!currentAssignedStudies.includes(studyId)) {
        return;
      }
      const updatedStudies = currentAssignedStudies.filter(
        (id) => id !== studyId
      );
      if (updatedStudies.length > 0) {
        const response = await fetch(
          `/api/meerkat/reports/${reportId}/studies`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ study_ids: updatedStudies }),
          }
        );
        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(errorMessage || "Failed to update assigned studies.");
        }
      } else {
        const response = await fetch(
          `/api/meerkat/reports/${reportId}/studies`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(
            errorMessage || "Failed to remove studies from report."
          );
        }
      }
      set((state) => {
        const entry = state.reportsByBatch[batchHash];
        if (!entry) {
          return state;
        }
        const updatedReport = {
          ...entry.map[reportId],
          assignedStudies: updatedStudies,
        };
        return {
          reportsByBatch: {
            ...state.reportsByBatch,
            [batchHash]: {
              order: [...entry.order],
              map: {
                ...entry.map,
                [reportId]: updatedReport,
              },
            },
          },
        };
      });
      useReportStore.getState().removeAssignedStudy(reportId, studyId);
    } catch (error) {
      console.error("Failed to unassign study from report:", error);
      throw error;
    }
  },
}));
