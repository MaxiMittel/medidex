import { useState, useCallback, useRef } from "react";
import { evaluateStudies } from "@/lib/api/genaiApi";
import { evaluateStudiesStream } from "@/lib/api/genaiStreamApi";
import type { EvaluateResponse, PromptOverrides, StudyDecision, StreamEvent } from "@/types/apiDTOs";

export type AIClassification = "match" | "likely_match" | "unsure" | "not_match" | "very_likely";
export type AIModel = "gpt-5.2" | "gpt-5" | "gpt-5-mini" | "gpt-4.1";

export interface StudyAIResult {
  studyId: number;
  classification: AIClassification;
  reason: string;
}

interface EvaluationState {
  results: Map<string, Map<number, StudyAIResult>>;
  loading: boolean;
  error: string | null;
  isStreaming: boolean;
  streamMessages: StreamEvent[];
  currentMessage: string | null;
  processedStudies: number;
  totalStudies: number;
}

interface EvaluationOptions {
  model?: AIModel;
  temperature?: number;
  promptOverrides?: PromptOverrides;
}

export const useGenAIEvaluation = () => {
  const [state, setState] = useState<EvaluationState>({
    results: new Map(),
    loading: false,
    error: null,
    isStreaming: false,
    streamMessages: [],
    currentMessage: null,
    processedStudies: 0,
    totalStudies: 0,
  });

  const streamCleanupRef = useRef<(() => void) | null>(null);

  const getReportKey = (batchHash: string, reportIndex: number) => 
    `${batchHash}-${reportIndex}`;

  const evaluate = useCallback(
    async (
      batchHash: string,
      reportIndex: number,
      report: any, // ReportDetailDto
      studies: any[], // RelevanceStudy[]
      options: EvaluationOptions = {}
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Transform studies to backend format
        const studiesDto = studies.map((study) => ({
          CRGStudyID: study.CRGStudyID,
          ShortName: study.ShortName || "",
          StatusofStudy: study.StatusofStudy || null,
          NumberParticipants: study.NumberParticipants?.toString() || null,
          Duration: study.Duration || null,
          Comparison: study.Comparison || null,
          Countries: study.Countries || null,
          Notes: study.Notes || null,
          TrialistContactDetails: study.TrialistContactDetails || null,
          CENTRALSubmissionStatus: study.CENTRALSubmissionStatus || null,
          UDef4: study.UDef4 || null,
          DateEntered: study.DateEntered || null,
          DateEdited: study.DateEdited || null,
          CENTRALStudyID: 0, // Default value, not available in RelevanceStudy
          DateToCENTRAL: null,
          ISRCTN: study.ISRCTN || null,
          UDef6: null,
          Search_Tagged: false,
          TrialRegistrationID: study.TrialRegistrationID || null,
        }));

        // Transform report to backend format
        const reportDto = {
          CENTRALReportID: null,
          CRGReportID: report.crgreportid,
          Title: report.title,
          Notes: null,
          ReportNumber: reportIndex + 1,
          OriginalTitle: null,
          Authors: report.authors.join("; "),
          Journal: null,
          Year: report.year || null,
          Volume: null,
          Issue: null,
          Pages: null,
          Language: null,
          Abstract: report.abstract || null,
          CENTRALSubmissionStatus: null,
          CopyStatus: null,
          DatetoCENTRAL: null,
          Dateentered: null,
          DateEdited: null,
          Editors: null,
          Publisher: null,
          City: null,
          DupString: "none",
          TypeofReportID: null,
          PublicationTypeID: 1,
          Edition: null,
          Medium: null,
          StudyDesign: null,
          DOI: null,
          UDef3: null,
          ISBN: null,
          UDef5: null,
          PMID: null,
          TrialRegistrationID: report.trial_id || null,
          UDef9: null,
          UDef10: null,
          UDef8: null,
          PDFLinks: null,
        };

        const response = await evaluateStudies({
          report: reportDto,
          studies: studiesDto,
          model: options.model || null,
          temperature: options.temperature ?? null,
          prompt_overrides: options.promptOverrides || null,
        });

        // Transform response to study results
        const studyResults = new Map<number, StudyAIResult>();

        const addResults = (decisions: StudyDecision[], classification: AIClassification) => {
          decisions.forEach((decision) => {
            const studyId = parseInt(decision.study_id);
            studyResults.set(studyId, {
              studyId,
              classification,
              reason: decision.reason,
            });
          });
        };

        if (response.match) {
          const studyId = parseInt(response.match.study_id);
          studyResults.set(studyId, {
            studyId,
            classification: "match",
            reason: response.match.reason,
          });
        }

        addResults(response.likely_matches, "likely_match");
        addResults(response.unsure, "unsure");
        addResults(response.not_matches, "not_match");

        // Add very_likely if present
        response.very_likely?.forEach((vl) => {
          const studyId = parseInt(vl.study_id);
          studyResults.set(studyId, {
            studyId,
            classification: "very_likely",
            reason: vl.group_reason || vl.prior_reason || "Marked as very likely candidate",
          });
        });

        const reportKey = getReportKey(batchHash, reportIndex);
        setState((prev) => ({
          ...prev,
          results: new Map(prev.results).set(reportKey, studyResults),
          loading: false,
          error: null,
        }));

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to evaluate studies";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  const evaluateStream = useCallback(
    (
      batchHash: string,
      reportIndex: number,
      report: any,
      studies: any[],
      options: {
        model?: AIModel;
        temperature?: number;
        promptOverrides?: PromptOverrides;
      },
      onStreamComplete?: () => void
    ) => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        isStreaming: true,
        error: null,
        streamMessages: [],
        currentMessage: null,
        processedStudies: 0,
        totalStudies: studies.length,
      }));

      const reportKey = getReportKey(batchHash, reportIndex);
      const studyResults = new Map<number, StudyAIResult>();
      let processedCount = 0;

      const studiesDto = studies.map((study) => ({
        CRGStudyID: study.CRGStudyID,
        ShortName: study.ShortName || "",
        StatusofStudy: study.StatusofStudy || null,
        NumberParticipants: study.NumberParticipants?.toString() || null,
        Duration: study.Duration || null,
        Comparison: study.Comparison || null,
        Countries: study.Countries || null,
        Notes: study.Notes || null,
        TrialistContactDetails: study.TrialistContactDetails || null,
        CENTRALSubmissionStatus: study.CENTRALSubmissionStatus || null,
        UDef4: study.UDef4 || null,
        DateEntered: study.DateEntered || null,
        DateEdited: study.DateEdited || null,
        CENTRALStudyID: 0,
        DateToCENTRAL: null,
        ISRCTN: study.ISRCTN || null,
        UDef6: null,
        Search_Tagged: false,
        TrialRegistrationID: study.TrialRegistrationID || null,
      }));

      const reportDto = {
        CENTRALReportID: null,
        CRGReportID: report.crgreportid,
        Title: report.title,
        Notes: null,
        ReportNumber: reportIndex + 1,
        OriginalTitle: null,
        Authors: report.authors.join("; "),
        Journal: null,
        Year: report.year || null,
        Volume: null,
        Issue: null,
        Pages: null,
        Language: null,
        Abstract: report.abstract || null,
        CENTRALSubmissionStatus: null,
        CopyStatus: null,
        DatetoCENTRAL: null,
        Dateentered: null,
        DateEdited: null,
        Editors: null,
        Publisher: null,
        City: null,
        DupString: "none",
        TypeofReportID: null,
        PublicationTypeID: 1,
        Edition: null,
        Medium: null,
        StudyDesign: null,
        DOI: null,
        UDef3: null,
        ISBN: null,
        UDef5: null,
        PMID: null,
        TrialRegistrationID: report.trial_id || null,
        UDef9: null,
        UDef10: null,
        UDef8: null,
        PDFLinks: null,
      };

      const cleanup = evaluateStudiesStream(
        {
          report: reportDto,
          studies: studiesDto,
          model: options.model || null,
          temperature: options.temperature ?? null,
          prompt_overrides: options.promptOverrides || null,
        },
        {
          onEvent: (event: StreamEvent) => {
            setState((prev) => ({
              ...prev,
              currentMessage: event.message || null,
              streamMessages: [...prev.streamMessages, event],
            }));

            if (
              (event.node === "classify_initial" || event.node === "classify_unsure") &&
              event.details?.study_id &&
              event.details?.decision
            ) {
              const studyId = typeof event.details.study_id === "string" 
                ? parseInt(event.details.study_id) 
                : event.details.study_id;
              
              const classification = event.details.decision as AIClassification;
              const reason = event.details.reason || "No reason provided";

              studyResults.set(studyId, {
                studyId,
                classification,
                reason,
              });

              setState((prev) => {
                const newResults = new Map(prev.results);
                const newStudyResults = new Map(studyResults);
                newResults.set(reportKey, newStudyResults);
                return {
                  ...prev,
                  results: newResults,
                };
              });
            }

            if (event.node === "select_very_likely" && event.details?.very_likely_ids) {
              event.details.very_likely_ids.forEach((id) => {
                const studyId = typeof id === "string" ? parseInt(id) : id;
                const existing = studyResults.get(studyId);
                if (existing) {
                  studyResults.set(studyId, {
                    ...existing,
                    classification: "very_likely",
                  });
                }
              });

              setState((prev) => {
                const newResults = new Map(prev.results);
                const newStudyResults = new Map(studyResults);
                newResults.set(reportKey, newStudyResults);
                return {
                  ...prev,
                  results: newResults,
                };
              });
            }

            if (event.node === "compare_very_likely" && event.details?.match_study_id) {
              const studyId = typeof event.details.match_study_id === "string"
                ? parseInt(event.details.match_study_id)
                : event.details.match_study_id;
              
              const existing = studyResults.get(studyId);
              if (existing) {
                studyResults.set(studyId, {
                  ...existing,
                  classification: "match",
                  reason: event.details.reason || existing.reason,
                });
              }

              setState((prev) => {
                const newResults = new Map(prev.results);
                const newStudyResults = new Map(studyResults);
                newResults.set(reportKey, newStudyResults);
                return {
                  ...prev,
                  results: newResults,
                };
              });
            }
          },
          onComplete: () => {
            setState((prev) => ({
              ...prev,
              loading: false,
              isStreaming: false,
              currentMessage: null,
            }));
            streamCleanupRef.current = null;
            onStreamComplete?.();
          },
          onError: (error: Error) => {
            setState((prev) => ({
              ...prev,
              loading: false,
              isStreaming: false,
              currentMessage: null,
              error: error.message,
            }));
            streamCleanupRef.current = null;
          },
        }
      );

      streamCleanupRef.current = cleanup;
      return cleanup;
    },
    []
  );

  const cancelStream = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
      setState((prev) => ({
        ...prev,
        loading: false,
        isStreaming: false,
        currentMessage: null,
      }));
    }
  }, []);

  const getStudyResult = useCallback(
    (batchHash: string, reportIndex: number, studyId: number): StudyAIResult | null => {
      const reportKey = getReportKey(batchHash, reportIndex);
      const reportResults = state.results.get(reportKey);
      return reportResults?.get(studyId) || null;
    },
    [state.results]
  );

  const clearResults = useCallback((batchHash?: string, reportIndex?: number) => {
    if (batchHash !== undefined && reportIndex !== undefined) {
      const reportKey = getReportKey(batchHash, reportIndex);
      setState((prev) => {
        const newResults = new Map(prev.results);
        newResults.delete(reportKey);
        return { ...prev, results: newResults };
      });
    } else {
      setState((prev) => ({ ...prev, results: new Map() }));
    }
  }, []);

  return {
    evaluate,
    evaluateStream,
    cancelStream,
    getStudyResult,
    clearResults,
    loading: state.loading,
    error: state.error,
    isStreaming: state.isStreaming,
    streamMessages: state.streamMessages,
    currentMessage: state.currentMessage,
  };
};
