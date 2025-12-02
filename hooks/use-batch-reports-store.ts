'use client';

import { create } from "zustand";
import type { BatchDto, ReportDetailDto, StudyDto, InterventionDto, ConditionDto, OutcomeDto } from "../types/apiDTOs";
import {
  assignStudiesToReport,
  removeStudiesFromReport,
} from "../lib/api/batchApi";
import type { RelevanceStudy, StudyDetailData } from "../types/reports";

export interface BatchReportsState {
  batches: BatchDto[];
  reportsByBatch: Record<string, ReportDetailDto[]>;
  selectedBatchHash?: string;
  loading: boolean;
  loadingReports: boolean;
  loadingMoreReports: boolean;
  error?: string;
  fetchBatches: () => Promise<void>;
  fetchReportsForBatch: (batchHash: string) => Promise<void>;
  selectBatch: (batchHash: string) => void;
  similarStudiesByReport: Record<string, RelevanceStudy[]>;
  similarStudiesLoading: Record<string, boolean>;
  fetchSimilarStudiesForReport: (
    batchHash: string,
    reportIndex: number,
    assignedStudyIds: number[]
  ) => Promise<void>;
  studyDetails: Record<number, StudyDetailData>;
  studyDetailsLoading: Record<number, boolean>;
  fetchStudyDetails: (studyId: number) => Promise<void>;
  // Add new functions for assignment
  assignStudyToReport: (
    batchHash: string,
    reportIndex: number,
    studyId: number
  ) => Promise<void>;
  unassignStudyFromReport: (
    batchHash: string,
    reportIndex: number,
    studyId: number
  ) => Promise<void>;
}

export const buildReportKey = (batchHash: string, reportIndex: number) =>
  `${batchHash}:${reportIndex}`;

export const useBatchReportsStore = create<BatchReportsState>((set, get) => ({
  batches: [],
  reportsByBatch: {},
  selectedBatchHash: undefined,
  loading: false,
  loadingReports: false,
  loadingMoreReports: false,
  error: undefined,
  similarStudiesByReport: {},
  similarStudiesLoading: {},
  studyDetails: {},
  studyDetailsLoading: {},
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
      set({
        batches,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load batches.",
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
        set((state) => ({
          reportsByBatch: {
            ...state.reportsByBatch,
            [batchHash]: [],
          },
          loadingReports: false,
        }));
        return;
      }

      const fetchReport = async (reportIndex: number): Promise<ReportDetailDto> => {
        const response = await fetch(
          `/api/meerkat/batches/${batchHash}/${reportIndex}`
        );
        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(
            errorMessage || `Failed to load report ${reportIndex}.`
          );
        }
        return (await response.json()) as ReportDetailDto;
      };

      // Fetch first batch of reports (10) for quick initial render
      const INITIAL_BATCH_SIZE = 10;
      const initialBatchSize = Math.min(INITIAL_BATCH_SIZE, batch.number_reports);
      
      const initialReportPromises = Array.from(
        { length: initialBatchSize },
        (_, reportIndex) => fetchReport(reportIndex)
      );
      const initialReports = await Promise.all(initialReportPromises);

      // Update state with initial reports and mark initial loading as complete
      set((state) => ({
        reportsByBatch: {
          ...state.reportsByBatch,
          [batchHash]: initialReports,
        },
        loadingReports: false,
        loadingMoreReports: batch.number_reports > initialBatchSize,
      }));

      // Fetch remaining reports in the background if there are more
      if (batch.number_reports > initialBatchSize) {
        const remainingReportPromises = Array.from(
          { length: batch.number_reports - initialBatchSize },
          (_, index) => fetchReport(index + initialBatchSize)
        );
        
        const remainingReports = await Promise.all(remainingReportPromises);
        
        // Merge with initial reports
        set((state) => ({
          reportsByBatch: {
            ...state.reportsByBatch,
            [batchHash]: [...initialReports, ...remainingReports],
          },
          loadingMoreReports: false,
        }));
      }

      // Don't fetch similar studies here - let them be fetched on-demand when a report is selected
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load reports.",
        loadingReports: false,
        loadingMoreReports: false,
      });
    }
  },
  selectBatch: (batchHash: string) => {
    if (get().selectedBatchHash === batchHash) {
      return;
    }
    set({ selectedBatchHash: batchHash });
    
    // If reports for this batch aren't loaded yet, fetch them
    const batchReports = get().reportsByBatch[batchHash];
    if (!batchReports) {
      void get().fetchReportsForBatch(batchHash);
    }
  },
  fetchSimilarStudiesForReport: async (
    batchHash: string,
    reportIndex: number,
    assignedStudyIds: number[]
  ) => {
    const key = buildReportKey(batchHash, reportIndex);
    if (get().similarStudiesByReport[key]) {
      return;
    }

    set((state) => ({
      similarStudiesLoading: { ...state.similarStudiesLoading, [key]: true },
    }));

    try {
      const params = new URLSearchParams();
      if (assignedStudyIds.length > 0) {
        params.set("assignedStudyIds", assignedStudyIds.join(","));
      }

      const response = await fetch(
        `/api/meerkat/batches/${batchHash}/${reportIndex}/similar-studies?${params.toString()}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to load similar studies via proxy route."
        );
      }

      const studies = (await response.json()) as RelevanceStudy[];

      set((state) => ({
        similarStudiesByReport: {
          ...state.similarStudiesByReport,
          [key]: studies,
        },
      }));
    } catch (error) {
      console.error("Failed fetching similar studies", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load relevant studies.",
      });
    } finally {
      set((state) => ({
        similarStudiesLoading: {
          ...state.similarStudiesLoading,
          [key]: false,
        },
      }));
    }
  },
  fetchStudyDetails: async (studyId: number) => {
    // Check if already loaded or loading
    if (get().studyDetails[studyId] || get().studyDetailsLoading[studyId]) {
      return;
    }

    set((state) => ({
      studyDetailsLoading: { ...state.studyDetailsLoading, [studyId]: true },
    }));

    try {
      const response = await fetch(`/api/meerkat/studies/${studyId}/details`);
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || `Failed to load study details for ${studyId}.`
        );
      }

      const {
        studyInfo,
        interventions,
        conditions,
        outcomes,
        design,
      }: {
        studyInfo: StudyDto;
        interventions: InterventionDto[];
        conditions: ConditionDto[];
        outcomes: OutcomeDto[];
        design: string[];
      } = await response.json();

      // Transform the data using actual API structure
      const studyDetailData: StudyDetailData = {
        studyInfo,
        interventions: interventions.map((intervention) => ({
          id: intervention.ID,
          description: intervention.Description,
        })),
        conditions: conditions.map((condition) => ({
          id: condition.ID,
          description: condition.Description,
        })),
        outcomes: outcomes.map((outcome) => ({
          id: outcome.ID,
          description: outcome.Description,
        })),
        design,
      };

      set((state) => ({
        studyDetails: {
          ...state.studyDetails,
          [studyId]: studyDetailData,
        },
        studyDetailsLoading: {
          ...state.studyDetailsLoading,
          [studyId]: false,
        },
      }));
    } catch (error) {
      console.error(`Failed fetching details for study ${studyId}`, error);
      set((state) => ({
        studyDetailsLoading: {
          ...state.studyDetailsLoading,
          [studyId]: false,
        },
      }));
    }
  },
  
  // Add assignment functions
  assignStudyToReport: async (
    batchHash: string,
    reportIndex: number,
    studyId: number
  ) => {
    try {
      // Get current assigned studies for this report
      const currentReport = get().reportsByBatch[batchHash]?.[reportIndex];
      if (!currentReport) {
        throw new Error("Report not found");
      }

      const currentAssignedStudies = currentReport.assigned_studies || [];
      
      // Check if already assigned
      if (currentAssignedStudies.includes(studyId)) {
        return; // Already assigned, nothing to do
      }

      // Add the new study to the list
      const updatedStudies = [...currentAssignedStudies, studyId];

      // Call API to assign via server route
      const response = await fetch(
        `/api/meerkat/batches/${batchHash}/${reportIndex}/studies`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ study_ids: updatedStudies }),
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to assign study to report."
        );
      }

      // Update local state
      set((state) => {
        const updatedReports = [...(state.reportsByBatch[batchHash] || [])];
        if (updatedReports[reportIndex]) {
          updatedReports[reportIndex] = {
            ...updatedReports[reportIndex],
            assigned_studies: updatedStudies,
          };
        }

        return {
          reportsByBatch: {
            ...state.reportsByBatch,
            [batchHash]: updatedReports,
          },
        };
      });

      // Update the similar studies list to reflect the change
      const key = buildReportKey(batchHash, reportIndex);
      const similarStudies = get().similarStudiesByReport[key];
      if (similarStudies) {
        const updatedSimilarStudies = similarStudies.map((study) =>
          study.CRGStudyID === studyId
            ? { ...study, Linked: true }
            : study
        );
        set((state) => ({
          similarStudiesByReport: {
            ...state.similarStudiesByReport,
            [key]: updatedSimilarStudies,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to assign study to report:", error);
      throw error;
    }
  },

  unassignStudyFromReport: async (
    batchHash: string,
    reportIndex: number,
    studyId: number
  ) => {
    try {
      // Get current assigned studies for this report
      const currentReport = get().reportsByBatch[batchHash]?.[reportIndex];
      if (!currentReport) {
        throw new Error("Report not found");
      }

      const currentAssignedStudies = currentReport.assigned_studies || [];
      
      // Check if not assigned
      if (!currentAssignedStudies.includes(studyId)) {
        return; // Not assigned, nothing to do
      }

      // Remove the study from the list
      const updatedStudies = currentAssignedStudies.filter(
        (id) => id !== studyId
      );

      // Call API to update assignments via server route
      if (updatedStudies.length > 0) {
        const response = await fetch(
          `/api/meerkat/batches/${batchHash}/${reportIndex}/studies`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ study_ids: updatedStudies }),
          }
        );

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(
            errorMessage || "Failed to update assigned studies."
          );
        }
      } else {
        const response = await fetch(
          `/api/meerkat/batches/${batchHash}/${reportIndex}/studies`,
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

      // Update local state
      set((state) => {
        const updatedReports = [...(state.reportsByBatch[batchHash] || [])];
        if (updatedReports[reportIndex]) {
          updatedReports[reportIndex] = {
            ...updatedReports[reportIndex],
            assigned_studies: updatedStudies,
          };
        }

        return {
          reportsByBatch: {
            ...state.reportsByBatch,
            [batchHash]: updatedReports,
          },
        };
      });

      // Update the similar studies list to reflect the change
      const key = buildReportKey(batchHash, reportIndex);
      const similarStudies = get().similarStudiesByReport[key];
      if (similarStudies) {
        const updatedSimilarStudies = similarStudies.map((study) =>
          study.CRGStudyID === studyId
            ? { ...study, Linked: false }
            : study
        );
        set((state) => ({
          similarStudiesByReport: {
            ...state.similarStudiesByReport,
            [key]: updatedSimilarStudies,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to unassign study from report:", error);
      throw error;
    }
  },
}));
