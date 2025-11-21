'use client';

import { create } from "zustand";
import type { BatchDto, ReportDetailDto, StudyDto, InterventionDto, ConditionDto, OutcomeDto } from "../types/apiDTOs";
import {
  getBatches,
  getReportData,
  getSimilarStudies,
} from "../lib/api/batchApi";
import { login } from "../lib/api/authApi";
import apiClient from "../lib/api/apiClient";
import { 
  getReportsByStudyId, 
  getStudies,
  getInterventionsForStudy,
  getConditionsForStudy,
  getOutcomesForStudy,
  getDesignForStudy,
} from "../lib/api/studiesApi";
import type { RelevanceStudy, StudyReportSummary, StudyDetailData } from "../types/reports";

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

      // Fetch first batch of reports (10) for quick initial render
      const INITIAL_BATCH_SIZE = 10;
      const initialBatchSize = Math.min(INITIAL_BATCH_SIZE, batch.number_reports);
      
      const initialReportPromises = Array.from(
        { length: initialBatchSize },
        (_, reportIndex) => getReportData(batchHash, reportIndex)
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
          (_, index) => getReportData(batchHash, index + initialBatchSize)
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
      const response = await getSimilarStudies(batchHash, reportIndex, {
        return_details: true,
      });
      const studies: RelevanceStudy[] = await Promise.all(
        response.CRGStudyID.map(async (studyId, idx) => {
          let relatedReports: StudyReportSummary[] = [];
          try {
            const reports = await getReportsByStudyId(studyId);
            relatedReports = reports.map((report) => ({
              CENTRALReportID: report.CENTRALReportID ?? null,
              CRGReportID: report.CRGReportID,
              Title: report.Title,
            }));
          } catch (error) {
            console.error(
              `Failed fetching reports for study ${studyId}`,
              error
            );
          }

          return {
            Linked: assignedStudyIds.includes(studyId),
            CRGStudyID: studyId,
            Relevance: Number(response.Relevance[idx] ?? 0),
            ShortName: response.ShortName[idx] ?? "",
            NumberParticipants: response.NumberParticipants[idx] ?? null,
            Duration: response.Duration[idx] ?? null,
            Comparison: response.Comparison[idx] ?? null,
            Countries: response.Countries[idx] ?? "",
            StatusofStudy: response.StatusofStudy[idx] ?? "",
            DateEntered: response.DateEntered[idx] ?? "",
            DateEdited: response.DateEdited[idx] ?? "",
            reports: relatedReports,
          } satisfies RelevanceStudy;
        })
      );

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
      // Fetch all study data in parallel
      const [studyInfoArray, interventions, conditions, outcomes, design] = await Promise.all([
        getStudies([studyId]),
        getInterventionsForStudy(studyId),
        getConditionsForStudy(studyId),
        getOutcomesForStudy(studyId),
        getDesignForStudy(studyId),
      ]);

      const studyInfo = studyInfoArray[0];
      if (!studyInfo) {
        throw new Error(`Study ${studyId} not found`);
      }

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
}));
