"use client";

import { create } from "zustand";
import type {
  BatchDto,
  ReportDetailDto,
  StudyDto,
  InterventionDto,
  ConditionDto,
  OutcomeDto,
} from "../types/apiDTOs";
import type { CreateStudyPayload } from "@/lib/api/studiesApi";
import type { RelevanceStudy, StudyDetailData } from "../types/reports";

type NewStudyFormState = {
  short_name: string;
  status_of_study: string;
  countries: string;
  central_submission_status: string;
  duration: string;
  number_of_participants: string;
  comparison: string;
};

const initialNewStudyForm: NewStudyFormState = {
  short_name: "",
  status_of_study: "",
  countries: "",
  central_submission_status: "",
  duration: "",
  number_of_participants: "",
  comparison: "",
};

export interface BatchReportsState {
  batches: BatchDto[];
  reportsByBatch: Record<string, ReportDetailDto[]>;
  selectedBatchHash?: string;
  loading: boolean;
  loadingReports: boolean;
  loadingMoreReports: boolean;
  error?: string;
  setBatches: (batches: BatchDto[]) => void;
  fetchBatches: () => Promise<void>;
  fetchReportsForBatch: (batchHash: string) => Promise<void>;
  selectBatch: (batchHash: string) => void;
  similarStudiesByReport: Record<string, RelevanceStudy[]>;
  similarStudiesLoading: Record<string, boolean>;
  assignedStudiesByReport: Record<string, RelevanceStudy[]>;
  assignedStudiesLoading: Record<string, boolean>;
  similarStudiesLimit: Record<string, number>; // Track how many studies have been loaded
  fetchSimilarStudiesForReport: (
    batchHash: string,
    reportIndex: number,
    assignedStudyIds: number[],
    force?: boolean
  ) => Promise<void>;
  fetchAssignedStudiesForReport: (
    batchHash: string,
    reportIndex: number,
    reportCRGId?: number,
    force?: boolean
  ) => Promise<void>;
  loadMoreSimilarStudies: (
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
  // Add study creation form state
  addStudyDialogOpen: boolean;
  newStudyForm: NewStudyFormState;
  creatingStudy: boolean;
  setAddStudyDialogOpen: (open: boolean) => void;
  updateNewStudyForm: <K extends keyof NewStudyFormState>(
    field: K,
    value: NewStudyFormState[K]
  ) => void;
  resetNewStudyForm: () => void;
  submitNewStudy: (options?: { reportIndex?: number; batchHash?: string; reportCRGId?: number }) => Promise<StudyDto>;
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
  assignedStudiesByReport: {},
  assignedStudiesLoading: {},
  similarStudiesLimit: {},
  studyDetails: {},
  studyDetailsLoading: {},
  addStudyDialogOpen: false,
  newStudyForm: initialNewStudyForm,
  creatingStudy: false,
  setBatches: (batches: BatchDto[]) => {
    // Only set if store is empty to avoid overwriting fresh data
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
      set({
        batches,
        loading: false,
      });
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
        set((state) => ({
          reportsByBatch: {
            ...state.reportsByBatch,
            [batchHash]: [],
          },
          loadingReports: false,
        }));
        return;
      }

      const fetchReport = async (
        reportIndex: number
      ): Promise<ReportDetailDto> => {
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
      const initialBatchSize = Math.min(
        INITIAL_BATCH_SIZE,
        batch.number_reports
      );

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
          error instanceof Error ? error.message : "Failed to load reports.",
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
    assignedStudyIds: number[],
    force = false
  ) => {
    const key = buildReportKey(batchHash, reportIndex);
    if (!force && get().similarStudiesByReport[key]) {
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
      params.set("limit", "10");

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
        similarStudiesLimit: {
          ...state.similarStudiesLimit,
          [key]: 10,
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
  fetchAssignedStudiesForReport: async (batchHash, reportIndex, reportCRGId, force = false) => {
    const key = buildReportKey(batchHash, reportIndex);
    if (!force && get().assignedStudiesByReport[key]) {
      return;
    }

    set((state) => ({
      assignedStudiesLoading: { ...state.assignedStudiesLoading, [key]: true },
    }));

    try {
      const response = await fetch(`/api/meerkat/reports/${reportCRGId}/studies`);
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Failed to load assigned studies.");
      }

      const studies = (await response.json()) as StudyDto[];

      const mapped: RelevanceStudy[] = studies.map((study) => ({
        Linked: true,
        CRGStudyID: study.CRGStudyID,
        Relevance: 1,
        ShortName: study.ShortName,
        NumberParticipants: study.NumberParticipants,
        Duration: study.Duration,
        Comparison: study.Comparison,
        Countries: study.Countries || undefined,
        StatusofStudy: study.StatusofStudy || undefined,
        DateEntered: study.DateEntered || undefined,
        DateEdited: study.DateEdited || undefined,
        TrialistContactDetails: study.TrialistContactDetails || undefined,
        CENTRALSubmissionStatus: study.CENTRALSubmissionStatus || undefined,
        ISRCTN: study.ISRCTN || undefined,
        Notes: study.Notes || undefined,
        UDef4: study.UDef4 || undefined,
        reports: [],
      }));

      set((state) => ({
        assignedStudiesByReport: {
          ...state.assignedStudiesByReport,
          [key]: mapped,
        },
      }));
    } catch (error) {
      console.error("Failed fetching assigned studies", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load assigned studies.",
      });
    } finally {
      set((state) => ({
        assignedStudiesLoading: {
          ...state.assignedStudiesLoading,
          [key]: false,
        },
      }));
    }
  },
  loadMoreSimilarStudies: async (
    batchHash: string,
    reportIndex: number,
    assignedStudyIds: number[]
  ) => {
    const key = buildReportKey(batchHash, reportIndex);
    const currentLimit = get().similarStudiesLimit[key] || 10;

    // Don't load if already loading
    if (get().similarStudiesLoading[key]) {
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
      // Load 10 more studies
      const newLimit = currentLimit + 10;
      params.set("limit", newLimit.toString());

      const response = await fetch(
        `/api/meerkat/batches/${batchHash}/${reportIndex}/similar-studies?${params.toString()}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to load more similar studies via proxy route."
        );
      }

      const allStudies = (await response.json()) as RelevanceStudy[];

      set((state) => ({
        similarStudiesByReport: {
          ...state.similarStudiesByReport,
          [key]: allStudies,
        },
        similarStudiesLimit: {
          ...state.similarStudiesLimit,
          [key]: newLimit,
        },
      }));
    } catch (error) {
      console.error("Failed fetching more similar studies", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load more relevant studies.",
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
        throw new Error(errorMessage || "Failed to assign study to report.");
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
          study.CRGStudyID === studyId ? { ...study, Linked: true } : study
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
          throw new Error(errorMessage || "Failed to update assigned studies.");
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
          study.CRGStudyID === studyId ? { ...study, Linked: false } : study
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
  setAddStudyDialogOpen: (open: boolean) => {
    set({ addStudyDialogOpen: open });
    if (!open) {
      set({ newStudyForm: initialNewStudyForm });
    }
  },
  updateNewStudyForm: (field, value) => {
    set((state) => ({
      newStudyForm: {
        ...state.newStudyForm,
        [field]: value,
      },
    }));
  },
  resetNewStudyForm: () => set({ newStudyForm: initialNewStudyForm }),
  submitNewStudy: async (options) => {
    const { newStudyForm } = get();
    const reportIndex = options?.reportIndex;
    const batchHash = options?.batchHash;
    const reportCRGId = options?.reportCRGId;

    const countries = newStudyForm.countries
      .split(",")
      .map((country) => country.trim())
      .filter(Boolean);

    const number_of_participants = Number(newStudyForm.number_of_participants);

    const payload: CreateStudyPayload = {
      short_name: newStudyForm.short_name.trim(),
      status_of_study: newStudyForm.status_of_study.trim(),
      countries,
      central_submission_status: newStudyForm.central_submission_status.trim(),
      duration: newStudyForm.duration.trim(),
      number_of_participants,
      comparison: newStudyForm.comparison.trim(),
    };

    // Basic required field guard
    if (
      !payload.short_name ||
      !payload.status_of_study ||
      !payload.central_submission_status ||
      !payload.duration ||
      !payload.comparison ||
      Number.isNaN(number_of_participants)
    ) {
      throw new Error("Please fill in all required fields.");
    }

    if (countries.length === 0) {
      throw new Error("Please provide at least one country.");
    }

    set({ creatingStudy: true });

    try {
      const response = await fetch("/api/meerkat/studies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to create study via Meerkat API."
        );
      }

      const createdStudy = (await response.json()) as StudyDto;

      // If we have report context, assign the new study to the report before refreshing
      if (typeof reportIndex === "number" && batchHash) {
        await get().assignStudyToReport(batchHash, reportIndex, createdStudy.CRGStudyID);
        await get().fetchAssignedStudiesForReport(batchHash,reportIndex, reportCRGId, true);
      } else {
        throw new Error("Batch context missing for assigning new study.");
      }

      set({
        creatingStudy: false,
        newStudyForm: initialNewStudyForm,
        addStudyDialogOpen: false,
      });

      return createdStudy;
    } catch (error) {
      set({ creatingStudy: false });
      throw error;
    }
  },
}));
