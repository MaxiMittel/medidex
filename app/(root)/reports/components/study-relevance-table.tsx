"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { RelevanceStudy } from "@/types/reports";
import { Accordion } from "@/components/ui/accordion";
import { FileText, Sparkles } from "lucide-react";
import { useBatchReportsStore, buildReportKey } from "@/hooks/use-batch-reports-store";
import { LoadMoreStudiesButton } from "./load-more-studies-button";
import { sendReportEvent } from "@/lib/api/reportEventsApi";
import { useGenAIEvaluationStore } from "@/hooks/use-genai-evaluation-store";
import type { AIModel } from "@/hooks/use-genai-evaluation-store";
import type { NewStudySuggestion, PromptOverrides } from "@/types/apiDTOs";
import { StudyAIReasonDialog } from "./study-ai-reason-dialog";
import { AiEvaluationProgress } from "./ai-evaluation-progress";
import { AiEvaluationHistoryDialog } from "./ai-evaluation-history-dialog";
import { AIMatchSettingsDialog } from "./ai-match-settings-dialog";

import { StudyRelevanceHeader } from "./study-relevance-header";
import { StudyCard } from "./study-card";
import { StudyDetailSheet } from "./study-detail-sheet";

interface StudyRelevanceTableProps {
  studies: RelevanceStudy[];
  loading?: boolean;
  onLinkedChange?: (studyId: number, linked: boolean) => void;
  onStudySelect?: (studyId: number | null) => void;
  currentBatchHash?: string;
  currentReportIndex?: number;
  currentReportCRGId?: number;
  getLastInteraction?: () => string | null;
}

export function StudyRelevanceTable({
  studies,
  loading,
  onLinkedChange,
  onStudySelect,
  currentBatchHash,
  currentReportIndex,
  currentReportCRGId,
  getLastInteraction,
}: StudyRelevanceTableProps) {
  // ── Store hooks ──────────────────────────────────────────────────────
  const {
    addStudyDialogOpen,
    studyDetails,
    studyDetailsLoading,
    fetchStudyDetails,
    assignStudyToReport,
    unassignStudyFromReport,
    fetchSimilarStudiesForReport,
    fetchAssignedStudiesForReport,
    reportsByBatch,
    setNewStudyForm,
    resetNewStudyForm,
    similarStudiesByReport,
    addUnlinkedStudyToSimilar,
  } = useBatchReportsStore();

  const results = useGenAIEvaluationStore((s) => s.results);
  const evaluationsByReport = useGenAIEvaluationStore((s) => s.evaluationsByReport);
  const runningEvaluations = useGenAIEvaluationStore((s) => s.runningEvaluations);
  const evaluateStream = useGenAIEvaluationStore((s) => s.evaluateStream);
  const canStartEvaluation = useGenAIEvaluationStore((s) => s.canStartEvaluation);
  const getRunningEvaluationsCount = useGenAIEvaluationStore((s) => s.getRunningEvaluationsCount);
  const getStudyResult = useGenAIEvaluationStore((s) => s.getStudyResult);
  const dismissedSuggestions = useGenAIEvaluationStore((s) => s.dismissedSuggestions);
  const dismissSuggestion = useGenAIEvaluationStore((s) => s.dismissSuggestion);

  // ── Local state ──────────────────────────────────────────────────────
  const [linkedStudies, setLinkedStudies] = useState<Set<number>>(
    new Set(studies.filter((s) => s.Linked).map((s) => s.CRGStudyID))
  );
  const [openStudies, setOpenStudies] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudy, setSelectedStudy] = useState<RelevanceStudy | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [downloadingPdfs, setDownloadingPdfs] = useState<Set<number>>(new Set());
  const [downloadingSingle, setDownloadingSingle] = useState<Set<number>>(new Set());

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedAIStudy, setSelectedAIStudy] = useState<{
    studyId: number;
    studyName: string;
  } | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const wasAddStudyDialogOpen = useRef(false);
  const [progressCollapsedByReport, setProgressCollapsedByReport] = useState<
    Record<string, boolean>
  >({});

  // ── Derived state ────────────────────────────────────────────────────
  const reportKey = currentBatchHash ? `${currentBatchHash}-${currentReportIndex}` : "";
  const evalState = reportKey ? evaluationsByReport[reportKey] || null : null;
  const isRunning = reportKey ? runningEvaluations.includes(reportKey) : false;
  const studyResults = reportKey ? results[reportKey] : undefined;

  const summaryEvent = useMemo(
    () =>
      evalState?.streamMessages
        ? [...evalState.streamMessages]
          .reverse()
          .find((event) => event.node === "summarize_evaluation")
        : undefined,
    [evalState?.streamMessages]
  );
  const suggestionEvent = useMemo(
    () =>
      evalState?.streamMessages
        ? [...evalState.streamMessages]
          .reverse()
          .find((event) => event.node === "suggest_new_study")
        : undefined,
    [evalState?.streamMessages]
  );
  const summaryDetails = summaryEvent?.details;
  const newStudySuggestion: NewStudySuggestion | undefined =
    suggestionEvent?.details?.new_study ? suggestionEvent.details.new_study : undefined;

  const normalizedSuggestion = useMemo(() => {
    if (!newStudySuggestion) return null;
    const safe = (value: string | undefined) => (value ?? "").trim();
    const normalizeChoice = (value: string, allowed: string[]) =>
      allowed.includes(value) ? value : "";
    const extractNumber = (value: string) => {
      const match = value.match(/\d+/);
      return match ? match[0] : "0";
    };

    return {
      short_name: safe(newStudySuggestion.short_name),
      status_of_study: normalizeChoice(safe(newStudySuggestion.status_of_study), [
        "Closed",
        "Stopped early",
        "Open/Ongoing",
        "Planned",
      ]),
      countries: safe(newStudySuggestion.countries) || "Unclear",
      central_submission_status: normalizeChoice(
        safe(newStudySuggestion.central_submission_status),
        ["Accepted", "Pending", "Rejected", "Not Cochrane"]
      ),
      duration: safe(newStudySuggestion.duration) || "Uncertain",
      number_of_participants: extractNumber(
        safe(newStudySuggestion.number_of_participants)
      ),
      comparison: safe(newStudySuggestion.comparison),
    };
  }, [newStudySuggestion]);

  const suggestionKey = normalizedSuggestion
    ? `${reportKey}:${JSON.stringify(normalizedSuggestion)}`
    : null;
  const suggestionDismissed = suggestionKey ? dismissedSuggestions.has(suggestionKey) : false;
  const shouldHighlightSuggestion = Boolean(suggestionKey) && !suggestionDismissed;

  // ── Filtered & sorted studies ────────────────────────────────────────
  const filteredStudies = useMemo(() => {
    let filtered = [...studies];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (study) =>
          study.ShortName.toLowerCase().includes(query) ||
          study.CRGStudyID.toString().includes(query) ||
          (study.Comparison || "").toLowerCase().includes(query) ||
          (study.NumberParticipants !== null &&
            study.NumberParticipants !== undefined &&
            study.NumberParticipants.toString().toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => b.Relevance - a.Relevance);
  }, [studies, searchQuery]);

  // ── Effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (addStudyDialogOpen && !wasAddStudyDialogOpen.current) {
      if (normalizedSuggestion && suggestionKey && !suggestionDismissed) {
        setNewStudyForm(normalizedSuggestion);
      }
    }

    if (!addStudyDialogOpen && wasAddStudyDialogOpen.current) {
      if (suggestionKey) {
        dismissSuggestion(suggestionKey);
      }
      resetNewStudyForm();
    }

    wasAddStudyDialogOpen.current = addStudyDialogOpen;
  }, [
    addStudyDialogOpen,
    normalizedSuggestion,
    resetNewStudyForm,
    setNewStudyForm,
    suggestionKey,
    suggestionDismissed,
    dismissSuggestion,
  ]);

  useEffect(() => {
    setLinkedStudies(
      new Set(studies.filter((s) => s.Linked).map((s) => s.CRGStudyID))
    );
  }, [studies]);

  useEffect(() => {
    setAiDialogOpen(false);
  }, [currentBatchHash, currentReportIndex]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleAIEvaluation = async (options: {
    model?: AIModel;
    includePdf?: boolean;
    promptOverrides?: PromptOverrides;
  }) => {
    if (!currentBatchHash || currentReportIndex === undefined) {
      toast.error("Missing batch or report context");
      return false;
    }

    const currentReport = reportsByBatch[currentBatchHash]?.[currentReportIndex];
    if (!currentReport) {
      toast.error("Report not found");
      return false;
    }

    try {
      const runningCount = getRunningEvaluationsCount();
      toast.info(
        `Evaluating ${filteredStudies.length} studies with AI (${runningCount + 1}/4 running)...`
      );
      setHasEvaluated(true);
      evaluateStream(
        currentBatchHash,
        currentReportIndex,
        currentReport,
        filteredStudies,
        options,
        () => {
          toast.success("AI evaluation complete!");
        }
      );

      return true;
    } catch (error) {
      toast.error(
        `AI evaluation failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  const handleAIBadgeClick = (studyId: number, studyName: string) => {
    setSelectedAIStudy({ studyId, studyName });
    setReasonDialogOpen(true);
  };

  const handleLinkedChange = async (studyId: number, checked: boolean) => {
    const updatedAssigned = new Set(linkedStudies);
    if (checked) {
      updatedAssigned.add(studyId);
    } else {
      updatedAssigned.delete(studyId);
    }

    // Optimistically update UI
    setLinkedStudies((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(studyId);
      } else {
        newSet.delete(studyId);
      }
      return newSet;
    });

    onLinkedChange?.(studyId, checked);

    if (currentBatchHash && currentReportIndex !== undefined) {
      let studyToPreserve: RelevanceStudy | undefined;
      if (!checked) {
        const key = buildReportKey(currentBatchHash, currentReportIndex);
        const currentSimilar = similarStudiesByReport[key] ?? [];
        const isInSimilar = currentSimilar.some((s) => s.CRGStudyID === studyId);
        if (!isInSimilar) {
          studyToPreserve = studies.find((s) => s.CRGStudyID === studyId);
        }
      }

      try {
        if (checked) {
          await assignStudyToReport(currentBatchHash, currentReportIndex, studyId);
          toast.success(`Study assigned to report`);

          if (currentReportCRGId) {
            const lastInteraction = getLastInteraction?.() ?? null;
            void sendReportEvent(currentReportCRGId, "end", lastInteraction);
          }
        } else {
          await unassignStudyFromReport(currentBatchHash, currentReportIndex, studyId);
          toast.success(`Study unassigned from report`);
        }

        await Promise.all([
          fetchSimilarStudiesForReport(
            currentBatchHash,
            currentReportIndex,
            Array.from(updatedAssigned),
            true
          ),
          fetchAssignedStudiesForReport(
            currentBatchHash,
            currentReportIndex,
            currentReportCRGId,
            true
          ),
        ]);

        if (studyToPreserve) {
          addUnlinkedStudyToSimilar(currentBatchHash, currentReportIndex, studyToPreserve);
        }
      } catch (error) {
        // Revert UI on error
        setLinkedStudies((prev) => {
          const newSet = new Set(prev);
          if (checked) {
            newSet.delete(studyId);
          } else {
            newSet.add(studyId);
          }
          return newSet;
        });

        toast.error(
          `Failed to ${checked ? "assign" : "unassign"} study: ${error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  };

  const handleStudyClick = (study: RelevanceStudy) => {
    setSelectedStudy(study);
    setIsSheetOpen(true);
    onStudySelect?.(study.CRGStudyID);
    void fetchStudyDetails(study.CRGStudyID);
  };

  const handleDownloadAllReportPdfs = async (study: RelevanceStudy) => {
    if (study.reports.length === 0) return;

    setDownloadingPdfs(new Set([study.CRGStudyID]));
    let successCount = 0;
    let failureCount = 0;

    try {
      for (const report of study.reports) {
        try {
          const response = await fetch(
            `/api/meerkat/reports/${report.CRGReportID}/pdf`
          );
          if (!response.ok) {
            throw new Error("Failed to download PDF");
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${study.ShortName}_Report_${report.CRGReportID}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          successCount++;
        } catch (error) {
          failureCount++;
          toast.error(
            `Failed to download report ${report.CRGReportID}: ${error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (successCount > 0) {
        toast.success(
          `Downloaded ${successCount} PDF${successCount > 1 ? "s" : ""}${failureCount > 0 ? ` (${failureCount} failed)` : ""
          }`
        );
      }
    } finally {
      setDownloadingPdfs(new Set());
    }
  };

  const handleDownloadSingleReportPdf = async (report: any, studyShortName: string) => {
    setDownloadingSingle(new Set([report.CRGReportID]));

    try {
      const response = await fetch(
        `/api/meerkat/reports/${report.CRGReportID}/pdf`
      );
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${studyShortName}_Report_${report.CRGReportID}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded report ${report.CRGReportID}`);
    } catch (error) {
      toast.error(
        `Failed to download report ${report.CRGReportID}: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDownloadingSingle((prev) => {
        const newSet = new Set(prev);
        newSet.delete(report.CRGReportID);
        return newSet;
      });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AIMatchSettingsDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onEvaluate={handleAIEvaluation}
        isRunning={isRunning}
        disableRun={filteredStudies.length === 0 || !canStartEvaluation()}
        runningCount={getRunningEvaluationsCount()}
      />

      {/* Header */}
      <StudyRelevanceHeader
        filteredCount={filteredStudies.length}
        totalCount={studies.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentBatchHash={currentBatchHash}
        currentReportIndex={currentReportIndex}
        currentReportCRGId={currentReportCRGId}
        isRunning={isRunning}
        canStartEvaluation={canStartEvaluation()}
        filteredStudiesEmpty={filteredStudies.length === 0}
        onAiDialogOpen={() => setAiDialogOpen(true)}
        hasEvaluated={hasEvaluated}
        hasStreamMessages={
          Boolean(evalState?.streamMessages && evalState.streamMessages.length > 0)
        }
        onHistoryDialogOpen={() => setHistoryDialogOpen(true)}
        shouldHighlightSuggestion={shouldHighlightSuggestion}
        suggestionKey={suggestionKey}
        onSuggestionDismiss={() => {
          if (suggestionKey) dismissSuggestion(suggestionKey);
        }}
      />

      <AiEvaluationProgress
        message={
          evalState?.isStreaming
            ? evalState?.currentMessage ||
            (evalState?.streamMessages && evalState.streamMessages.length > 0
              ? evalState.streamMessages[evalState.streamMessages.length - 1]?.message
              : null) ||
            null
            : summaryEvent?.message ||
            evalState?.currentMessage ||
            (evalState?.streamMessages && evalState.streamMessages.length > 0
              ? evalState.streamMessages[evalState.streamMessages.length - 1]?.message
              : null) ||
            null
        }
        isStreaming={evalState?.isStreaming ?? false}
        hasSummary={Boolean(summaryEvent?.message)}
        collapsed={progressCollapsedByReport[reportKey] ?? false}
        onCollapsedChange={(collapsed) => {
          setProgressCollapsedByReport((prev) => ({
            ...prev,
            [reportKey]: collapsed,
          }));
        }}
      />

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && filteredStudies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="p-3 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-medium">Loading relevant studies...</p>
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="p-3 rounded-full bg-muted mb-4">
              <FileText className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">No studies found</p>
            <p className="text-xs mt-1">
              {searchQuery
                ? "Try adjusting your search query"
                : "No relevant studies available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Accordion
              type="multiple"
              className="w-full space-y-2"
              onValueChange={(value) => setOpenStudies(new Set(value))}
            >
              {filteredStudies.map((study) => (
                <StudyCard
                  key={study.CRGStudyID}
                  study={study}
                  isLinked={linkedStudies.has(study.CRGStudyID)}
                  isOpen={openStudies.has(`study-${study.CRGStudyID}`)}
                  onLinkedChange={handleLinkedChange}
                  onStudyClick={handleStudyClick}
                  studyResult={studyResults?.[study.CRGStudyID]}
                  onAIBadgeClick={handleAIBadgeClick}
                  isDownloadingAllPdfs={downloadingPdfs.has(study.CRGStudyID)}
                  downloadingSingle={downloadingSingle}
                  onDownloadAllPdfs={handleDownloadAllReportPdfs}
                  onDownloadSinglePdf={handleDownloadSingleReportPdf}
                />
              ))}
            </Accordion>

            <LoadMoreStudiesButton
              currentBatchHash={currentBatchHash}
              currentReportIndex={currentReportIndex}
              currentStudiesCount={studies.length}
            />
          </div>
        )}
      </div>

      {/* Study Detail Sheet */}
      <StudyDetailSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        selectedStudy={selectedStudy}
        studyDetails={studyDetails}
        studyDetailsLoading={studyDetailsLoading}
        onStudyDeselect={() => onStudySelect?.(null)}
        downloadingPdfs={downloadingPdfs}
        downloadingSingle={downloadingSingle}
        onDownloadAllPdfs={handleDownloadAllReportPdfs}
        onDownloadSinglePdf={handleDownloadSingleReportPdf}
      />

      {/* AI Reason Dialog */}
      {selectedAIStudy &&
        currentBatchHash !== undefined &&
        currentReportIndex !== undefined && (
          <StudyAIReasonDialog
            open={reasonDialogOpen}
            onOpenChange={setReasonDialogOpen}
            studyName={selectedAIStudy.studyName}
            classification={
              getStudyResult(
                currentBatchHash,
                currentReportIndex,
                selectedAIStudy.studyId
              )?.classification || "unsure"
            }
            reason={
              getStudyResult(
                currentBatchHash,
                currentReportIndex,
                selectedAIStudy.studyId
              )?.reason || "No reason available"
            }
          />
        )}

      <AiEvaluationHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        streamMessages={evalState?.streamMessages || []}
      />
    </div>
  );
}
