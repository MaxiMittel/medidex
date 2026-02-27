"use client";

import { create } from "zustand";
import { evaluateStudiesStream } from "@/lib/api/genaiStreamApi";
import type { PromptOverrides, ReportDto, StreamEvent, StudyDto } from "@/types/apiDTOs";
import { RelevanceStudy } from "@/types/reports";

export type AIClassification = "match" | "likely_match" | "unsure" | "not_match" | "very_likely";
export type AIModel = "gpt-5.2" | "gpt-5" | "gpt-5-mini" | "gpt-4.1";

export interface StudyAIResult {
  studyId: number;
  classification: AIClassification;
  reason: string;
}

interface ReportEvaluationState {
  isStreaming: boolean;
  streamMessages: StreamEvent[];
  currentMessage: string | null;
  processedStudies: number;
  totalStudies: number;
  error: string | null;
}

// Using plain objects instead of Maps for better Zustand reactivity
type ResultsMap = Record<string, Record<number, StudyAIResult>>;
type EvaluationsMap = Record<string, ReportEvaluationState>;

interface GenAIEvaluationStore {
  results: ResultsMap;
  evaluationsByReport: EvaluationsMap;
  runningEvaluations: string[];
  streamCleanups: Record<string, () => void>;
  dismissedSuggestions: Set<string>;

  getReportKey: (batchHash: string, reportId: number) => string;
  canStartEvaluation: () => boolean;
  isSuggestionDismissed: (suggestionKey: string) => boolean;
  dismissSuggestion: (suggestionKey: string) => void;
  getReportEvaluationState: (batchHash: string, reportId: number) => ReportEvaluationState | null;
  isEvaluationRunning: (batchHash: string, reportId: number) => boolean;
  getRunningEvaluationsCount: () => number;
  getStudyResult: (batchHash: string, reportId: number, studyId: number) => StudyAIResult | null;
  getResultsForReport: (batchHash: string, reportId: number) => Record<number, StudyAIResult> | undefined;
  
  addStudyResult: (reportKey: string, studyId: number, classification: AIClassification, reason: string) => void;
  updateClassification: (reportKey: string, studyId: number, classification: AIClassification, reason?: string) => void;
  setEvaluationState: (reportKey: string, state: Partial<ReportEvaluationState>) => void;
  startEvaluation: (reportKey: string, totalStudies: number) => void;
  endEvaluation: (reportKey: string, error?: string) => void;
  
  evaluateStream: (
    batchHash: string,
    report: ReportDto,
    studies: StudyDto[],
    options: { model?: AIModel; includePdf?: boolean; promptOverrides?: PromptOverrides },
    onStreamComplete?: () => void
  ) => () => void;
  
  cancelStream: (batchHash?: string, reportId?: number) => void;
  clearResults: (batchHash?: string, reportId?: number) => void;
}

export const useGenAIEvaluationStore = create<GenAIEvaluationStore>((set, get) => ({
  results: {},
  evaluationsByReport: {},
  runningEvaluations: [],
  streamCleanups: {},
  dismissedSuggestions: new Set(),

  getReportKey: (batchHash: string, reportId: number) => `${batchHash}-${reportId}`,

  canStartEvaluation: () => get().runningEvaluations.length < 4,

  isSuggestionDismissed: (suggestionKey: string) => get().dismissedSuggestions.has(suggestionKey),

  dismissSuggestion: (suggestionKey: string) => {
    set((state) => {
      const newSet = new Set(state.dismissedSuggestions);
      newSet.add(suggestionKey);
      return { dismissedSuggestions: newSet };
    });
  },

  getReportEvaluationState: (batchHash: string, reportId: number) => {
    const key = get().getReportKey(batchHash, reportId);
    return get().evaluationsByReport[key] || null;
  },

  isEvaluationRunning: (batchHash: string, reportId: number) => {
    const key = get().getReportKey(batchHash, reportId);
    return get().runningEvaluations.includes(key);
  },

  getRunningEvaluationsCount: () => get().runningEvaluations.length,

  getStudyResult: (batchHash: string, reportId: number, studyId: number) => {
    const key = get().getReportKey(batchHash, reportId);
    return get().results[key]?.[studyId] || null;
  },

  getResultsForReport: (batchHash: string, reportId: number) => {
    const key = get().getReportKey(batchHash, reportId);
    return get().results[key];
  },

  addStudyResult: (reportKey: string, studyId: number, classification: AIClassification, reason: string) => {
    set((state) => {
      const existingResults = state.results[reportKey] || {};
      const newReportResults = { ...existingResults, [studyId]: { studyId, classification, reason } };
      return { results: { ...state.results, [reportKey]: newReportResults } };
    });
  },

  updateClassification: (reportKey: string, studyId: number, classification: AIClassification, reason?: string) => {
    set((state) => {
      const existingResults = state.results[reportKey] || {};
      const existing = existingResults[studyId];
      if (existing) {
        const newReportResults = { 
          ...existingResults, 
          [studyId]: { ...existing, classification, reason: reason || existing.reason } 
        };
        return { results: { ...state.results, [reportKey]: newReportResults } };
      }
      return state;
    });
  },

  setEvaluationState: (reportKey: string, newState: Partial<ReportEvaluationState>) => {
    set((state) => {
      const existing = state.evaluationsByReport[reportKey];
      if (existing) {
        return { 
          evaluationsByReport: { 
            ...state.evaluationsByReport, 
            [reportKey]: { ...existing, ...newState } 
          } 
        };
      }
      return state;
    });
  },

  startEvaluation: (reportKey: string, totalStudies: number) => {
    set((state) => ({
      evaluationsByReport: {
        ...state.evaluationsByReport,
        [reportKey]: {
          isStreaming: true,
          streamMessages: [],
          currentMessage: null,
          processedStudies: 0,
          totalStudies,
          error: null,
        },
      },
      runningEvaluations: [...state.runningEvaluations, reportKey],
    }));
  },

  endEvaluation: (reportKey: string, error?: string) => {
    set((state) => {
      const existing = state.evaluationsByReport[reportKey];
      return {
        evaluationsByReport: existing ? {
          ...state.evaluationsByReport,
          [reportKey]: { ...existing, isStreaming: false, error: error || null },
        } : state.evaluationsByReport,
        runningEvaluations: state.runningEvaluations.filter(k => k !== reportKey),
      };
    });
  },

  evaluateStream: (batchHash : string, report : ReportDto, studies : StudyDto[], options, onStreamComplete) => {
    const { getReportKey, startEvaluation, addStudyResult, updateClassification, setEvaluationState, endEvaluation, streamCleanups } = get();
    const reportKey = getReportKey(batchHash, report.reportId);

    if (streamCleanups[reportKey]) {
      streamCleanups[reportKey]();
      delete streamCleanups[reportKey];
    }

    startEvaluation(reportKey, studies.length);


    const reportDto = report;

    const cleanup = evaluateStudiesStream(
      {
        report: reportDto,
        studies: studies,
        model: options.model || null,
        include_pdf: options.includePdf ?? null,
        prompt_overrides: options.promptOverrides || null,
      },
      {
        onEvent: (event: StreamEvent) => {
          const currentState = get().evaluationsByReport[reportKey];
          setEvaluationState(reportKey, {
            currentMessage: event.message || null,
            streamMessages: [...(currentState?.streamMessages || []), event],
          });

          if (
            (
              event.node === "classify_initial" ||
              event.node === "classify_unsure" ||
              event.node === "classify_likely_review"
            ) &&
            event.details?.study_id &&
            event.details?.decision
          ) {
            const studyId = typeof event.details.study_id === "string"
              ? parseInt(event.details.study_id)
              : event.details.study_id;
            const reason = event.details.reason || "No reason provided";
            const decision = event.details.decision as AIClassification;

            if (event.node === "classify_likely_review") {
              if (decision === "match") {
                const existingResult = get().results[reportKey]?.[studyId];
                if (existingResult) {
                  updateClassification(reportKey, studyId, "match", reason);
                } else {
                  addStudyResult(reportKey, studyId, "match", reason);
                }
              } else {
                const existingResult = get().results[reportKey]?.[studyId];
                if (existingResult) {
                  const stableClassification =
                    existingResult.classification === "very_likely"
                      ? "very_likely"
                      : "likely_match";
                  updateClassification(reportKey, studyId, stableClassification, reason);
                } else {
                  addStudyResult(reportKey, studyId, "likely_match", reason);
                }
              }
            } else {
              addStudyResult(reportKey, studyId, decision, reason);
            }
          }

          if (event.node === "select_very_likely" && event.details?.very_likely_study_ids) {
            event.details.very_likely_study_ids.forEach((id: string | number) => {
              const studyId = typeof id === "string" ? parseInt(id) : id;
              updateClassification(reportKey, studyId, "very_likely", event.details?.reason);
            });
          }

          if (event.node === "compare_very_likely" && event.details?.match_study_id) {
            const studyId = typeof event.details.match_study_id === "string"
              ? parseInt(event.details.match_study_id)
              : event.details.match_study_id;
            updateClassification(reportKey, studyId, "match", event.details.reason);
          }
        },
        onComplete: () => {
          endEvaluation(reportKey);
          const cleanups = get().streamCleanups;
          delete cleanups[reportKey];
          set({ streamCleanups: { ...cleanups } });
          onStreamComplete?.();
        },
        onError: (error: Error) => {
          endEvaluation(reportKey, error.message);
          const cleanups = get().streamCleanups;
          delete cleanups[reportKey];
          set({ streamCleanups: { ...cleanups } });
        },
      }
    );

    set((state) => ({ streamCleanups: { ...state.streamCleanups, [reportKey]: cleanup } }));
    return cleanup;
  },

  cancelStream: (batchHash?: string, reportId?: number) => {
    const { getReportKey, streamCleanups, endEvaluation } = get();
    if (batchHash !== undefined && reportId !== undefined) {
      const reportKey = getReportKey(batchHash, reportId);
      if (streamCleanups[reportKey]) {
        streamCleanups[reportKey]();
        const newCleanups = { ...streamCleanups };
        delete newCleanups[reportKey];
        set({ streamCleanups: newCleanups });
        endEvaluation(reportKey);
      }
    } else {
      Object.values(streamCleanups).forEach((cleanup) => cleanup());
      set({ streamCleanups: {}, evaluationsByReport: {}, runningEvaluations: [] });
    }
  },

  clearResults: (batchHash?: string, reportId?: number) => {
    const { getReportKey } = get();
    if (batchHash !== undefined && reportId !== undefined) {
      const reportKey = getReportKey(batchHash, reportId);
      set((state) => {
        const newResults = { ...state.results };
        delete newResults[reportKey];
        return { results: newResults };
      });
    } else {
      set({ results: {} });
    }
  },
}));
