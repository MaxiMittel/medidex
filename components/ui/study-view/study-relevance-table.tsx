"use client";

import { useState, useMemo, useEffect, useCallback} from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RelevanceStudy } from "@/types/reports";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Search,
  Users,
  Calendar,
  X,
  Sparkles,
  CheckCircle2,
  Plus,
  Link,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AddStudyDialog } from "./add-study-dialog";
import { AIMatchSettingsDialog } from "./ai-match-settings-dialog";
import { LoadMoreStudiesButton } from "./load-more-studies-button";
import { sendReportEvent } from "@/lib/api/reportEventsApi";
import { useGenAIEvaluationStore } from "@/hooks/use-genai-evaluation-store";
import type { AIModel } from "@/hooks/use-genai-evaluation-store";
import type { NewStudySuggestion, PromptOverrides, StudyDto, StudyCreateDto } from "@/types/apiDTOs";
import { StudyAIBadge } from "./study-ai-badge";
import { StudyAIReasonDialog } from "./study-ai-reason-dialog";
import { AiEvaluationProgress } from "./ai-evaluation-progress";
import { AiEvaluationHistoryDialog } from "./ai-evaluation-history-dialog";
import { useReportStore } from "@/hooks/use-report-store";
import { useDetailsSheet } from "@/app/context/details-sheet-context";

interface StudyRelevanceTableProps {
  studies: RelevanceStudy[];
  currentBatchHash?: string;
  currentReportId?: number;
}

const formatParticipantCount = (value?: string | null) => {
  if (!value) return "-";
  const numericValue = Number(value.replace(/,/g, ""));
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }
  return value;
};

export function StudyRelevanceTable({
  studies,
  currentBatchHash,
  currentReportId,
}: StudyRelevanceTableProps) {
  
  const [resolvedStudies, setResolvedStudies] = useState<RelevanceStudy[]>(() => [...studies]);
  const [searchQuery, setSearchQuery] = useState("");

  const getReport = useReportStore((state) => state.getReport);
  const addAssignedStudies = useReportStore((state) => state.addAssignedStudy);
  const removeAssignedStudies = useReportStore((state) => state.removeAssignedStudy);
  const currentReport = useReportStore((state) =>
    currentReportId !== undefined ? state.reports[currentReportId] : undefined
  );

  const {openWithStudyItem } = useDetailsSheet()

  const results = useGenAIEvaluationStore((state) => state.results);
  const evaluationsByReport = useGenAIEvaluationStore((state) => state.evaluationsByReport);
  const runningEvaluations = useGenAIEvaluationStore((state) => state.runningEvaluations);
  const evaluateStream = useGenAIEvaluationStore((state) => state.evaluateStream);
  const canStartEvaluation = useGenAIEvaluationStore((state) => state.canStartEvaluation);
  const getRunningEvaluationsCount = useGenAIEvaluationStore((state) => state.getRunningEvaluationsCount);
  const getStudyResult = useGenAIEvaluationStore((state) => state.getStudyResult);
  const dismissSuggestion = useGenAIEvaluationStore((state) => state.dismissSuggestion);

  const reportKey = currentBatchHash ? `${currentBatchHash}-${currentReportId}` : "";
  const evalState = reportKey ? evaluationsByReport[reportKey] || null : null;
  const isRunning = reportKey ? runningEvaluations.includes(reportKey) : false;
  const studyResults = reportKey ? results[reportKey] : undefined;

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedAIStudy, setSelectedAIStudy] = useState<{
    studyId: number;
    studyName: string;
  } | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  //const wasAddStudyDialogOpen = useRef(false);
  const [progressCollapsedByReport, setProgressCollapsedByReport] = useState<Record<string, boolean>>({});

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
  const newStudySuggestion: NewStudySuggestion | undefined =
    suggestionEvent?.details?.new_study ? suggestionEvent.details.new_study : undefined;

  

  const suggestionKey = newStudySuggestion
    ? `${reportKey}:${JSON.stringify(newStudySuggestion)}`
    : null;

  const markStudyLinkedState = useCallback((studyId: number, linked: boolean) => {
    setResolvedStudies((prev) =>
      prev.map((entry) =>
        entry.study.studyId === studyId ? { ...entry, isLinked: linked } : entry
      )
    );
  }, []);

  const handleLinkedChange = useCallback(
    async (study: StudyDto, checked: boolean) => {
      if (currentReportId === undefined) {
        return;
      }

      if (checked) {
        try {
          await addAssignedStudies(currentReportId, study);
          markStudyLinkedState(study.studyId, true);
          toast.success("Report assigned to study");
        } catch (error) {
          toast.error(
            `Failed to link study: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          throw error;
        }
      } else {
        try {
          await removeAssignedStudies(currentReportId, study.studyId);
          markStudyLinkedState(study.studyId, false);
          toast.success("Report unassigned from study");
        } catch (error) {
          toast.error(
            `Failed to unlink study: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          throw error;
        }
      }
    },
    [
      currentReportId,
      addAssignedStudies,
      removeAssignedStudies,
      markStudyLinkedState,
    ]
  );

  const handleSaveNewStudy = useCallback(
    async (payload: StudyCreateDto) => {
      if (currentReportId === undefined) {
        throw new Error("Select a report before adding a new study.");
      }

      const response = await fetch(`/api/meerkat/reports/${currentReportId}/studies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let responseBody: unknown = null;
      const contentType = response.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          responseBody = await response.json();
        } catch (error) {
          console.error("Failed to parse new study response payload", error);
        }
      }

      if (!response.ok) {
        const errorMessage =
          responseBody &&
          typeof responseBody === "object" &&
          responseBody !== null &&
          "error" in responseBody &&
          typeof (responseBody as { error?: string }).error === "string"
            ? (responseBody as { error: string }).error
            : "Failed to create study.";
        throw new Error(errorMessage);
      }

      const createdStudy =
        responseBody && typeof responseBody === "object"
          ? (responseBody as StudyDto)
          : null;

      if (!createdStudy || typeof createdStudy.studyId !== "number") {
        throw new Error("Invalid study response payload.");
      }

      await handleLinkedChange(createdStudy, true);

      if (suggestionKey) {
        dismissSuggestion(suggestionKey);
      }
    },
    [currentReportId, suggestionKey, dismissSuggestion, handleLinkedChange]
  );

  useEffect(() => {
    const assignedStudyIds = new Set(
      (currentReport?.assignedStudies ?? []).map((assigned) => assigned.studyId)
    );
    setResolvedStudies(
      studies.map((study) => ({
        ...study,
        isLinked: study.isLinked || assignedStudyIds.has(study.study.studyId),
      }))
    );
  }, [studies, currentReport?.assignedStudies]);

  // Reset evaluation state when report changes
  useEffect(() => {
    setAiDialogOpen(false);
  }, [currentBatchHash, currentReportId]);

  // Filter and sort studies
  const filteredStudies = useMemo(() => {
    let filtered = [...resolvedStudies];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (study) =>
          study.study.shortName.toLowerCase().includes(query) ||
          study.study.studyId.toString().includes(query) ||
          (study.study.comparison || "").toLowerCase().includes(query) ||
          (study.study.numberParticipants ?? "").toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      return b.relevance - a.relevance;
    });
  }, [resolvedStudies, searchQuery]);

  
  const handleAIEvaluation = async (options: {
    model?: AIModel;
    includePdf?: boolean;
    promptOverrides?: PromptOverrides;
  }) => {
    if (!currentBatchHash || currentReportId === undefined) {
      toast.error("Missing batch or report context");
      return false;
    }

    const currentReport = getReport(currentReportId);
    if (!currentReport) {
      toast.error("Report not found");
      return false;
    }

    try {
      const runningCount = getRunningEvaluationsCount();
      toast.info(`Evaluating ${filteredStudies.length} studies with AI (${runningCount + 1}/4 running)...`);
      setHasEvaluated(true);
      evaluateStream(
        currentBatchHash,
        currentReport.report,
        filteredStudies.map((study) => study.study),
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

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.9) return "bg-emerald-500";
    if (relevance >= 0.7) return "bg-blue-500";
    if (relevance >= 0.5) return "bg-amber-500";
    return "bg-orange-500";
  };

  const getRelevanceBadgeStyle = (relevance: number) => {
    if (relevance >= 0.9) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
    if (relevance >= 0.7) return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400";
    if (relevance >= 0.5) return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
    return "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400";
  };


  const handleStudyClick = (study: RelevanceStudy) => {
    openWithStudyItem(study.study)
  };

  return (
    <div className="h-full flex flex-col pt-5">
      <AIMatchSettingsDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onEvaluate={handleAIEvaluation}
        isRunning={isRunning}
        disableRun={filteredStudies.length === 0 || !canStartEvaluation()}
        runningCount={getRunningEvaluationsCount()}
      />

      {/* Header - Sticky */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Relevant Studies</h2>
            <Badge variant="secondary" className="text-xs font-normal">
              {filteredStudies.length}
              {searchQuery && ` of ${studies.length}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-2"
                    onClick={() => setAiDialogOpen(true)}
                    disabled={isRunning || filteredStudies.length === 0}
                  >
                    {isRunning ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    AI Match
                  </Button>
                  {hasEvaluated && evalState?.streamMessages && evalState.streamMessages.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-2"
                      onClick={() => setHistoryDialogOpen(true)}
                    >
                      Show Step History
                    </Button>
                  )}
                  <AddStudyDialog
                    currentReportId={currentReportId}
                    suggestedValues={newStudySuggestion}
                    onSaveStudy={handleSaveNewStudy}
                  />
                </>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, comparison, or participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AiEvaluationProgress
        message={
          evalState?.isStreaming
            ? (evalState?.currentMessage ||
               (evalState?.streamMessages && evalState.streamMessages.length > 0
                 ? evalState.streamMessages[evalState.streamMessages.length - 1]?.message
                 : null) ||
               null)
            : (summaryEvent?.message ||
               evalState?.currentMessage ||
               (evalState?.streamMessages && evalState.streamMessages.length > 0
                 ? evalState.streamMessages[evalState.streamMessages.length - 1]?.message
                 : null) ||
               null)
        }
        isStreaming={evalState?.isStreaming ?? false}
        hasSummary={Boolean(summaryEvent?.message)}
        collapsed={progressCollapsedByReport[reportKey] ?? false}
        onCollapsedChange={(collapsed) => {
          setProgressCollapsedByReport(prev => ({ ...prev, [reportKey]: collapsed }));
        }}
      />

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <div className="pt-3 pb-4">
          {filteredStudies.length === 0 ? (
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
              {/* Studies list */}
              {filteredStudies.map((study) => {
                const isLinked = study.isLinked;
                const relevancePercentage = (study.relevance * 100).toFixed(1);

                return (
                      <div
                        key={study.study.studyId}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${study.study.shortName}`}
                        onClick={() => handleStudyClick(study)}
                        className="p-4 mb-2 bg-card hover:bg-muted/50 rounded-lg relative w-full max-w-full overflow-hidden transition-all duration-200 border border-border/60 hover:border-border group-hover:shadow-sm flex items-center gap-4"
                      >
                        {/* Left indicator bar with relevance color */}
                        <div
                          className={`${getRelevanceColor(
                            study.relevance
                          )} rounded-l-lg h-full w-1 absolute left-0 top-0 bottom-0 transition-all`}
                        ></div>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="h-full flex items-center justify-center"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-pressed={isLinked}
                                  aria-label={isLinked ? "Study linked" : "Link study"}
                                  disabled={isLinked}
                                  onClick={() => {
                                    if (!isLinked) {
                                      void handleLinkedChange(study.study, true);
                                    }
                                  }}
                                  className={`p-1 rounded-full transition-colors ${
                                    isLinked
                                      ? "text-primary/70 cursor-default"
                                      : "text-muted-foreground/60 hover:text-primary"
                                  }`}
                                >
                                  {isLinked ? (
                                    <Link className="h-6 w-6" />
                                  ) : (
                                    <Plus className="h-6 w-6" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isLinked ? "Already linked" : "Link study"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Top row: Checkbox, Short Name, and details indicator */}
                          <div className="flex items-start gap-3">
                            
                            
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <h3 className="text-base font-semibold truncate max-w-full">
                                      {study.study.shortName}
                                    </h3>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{study.study.shortName}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                <Badge
                                  variant="secondary"
                                  className={`font-semibold text-xs px-2 py-0.5 ${getRelevanceBadgeStyle(study.relevance)}`}
                                >
                                  Relevance {relevancePercentage}%
                                </Badge>
                                {studyResults?.[study.study.studyId] && (
                                  <StudyAIBadge
                                    classification={studyResults[study.study.studyId].classification}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAIBadgeClick(
                                        study.study.studyId,
                                        study.study.shortName
                                      );
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom row: Participants, Duration, Comparison */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs w-full">
                            {/* NumberParticipants */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className="p-0.5 rounded bg-blue-50 dark:bg-blue-950/30">
                                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span>{formatParticipantCount(study.study.numberParticipants)} participants</span>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className={`p-0.5 rounded ${study.study.duration ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted"}`}>
                                <Calendar className={`h-3 w-3 ${study.study.duration ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`} />
                              </div>
                              <span className={study.study.duration ? "" : "text-muted-foreground/50"}>
                                {study.study.duration || "No duration"}
                              </span>
                            </div>

                            {/* Comparison */}
                            {study.study.comparison && (
                              <div className="flex items-center gap-1.5 text-muted-foreground flex-1 min-w-0 basis-0 max-w-full overflow-hidden">
                                <div className="p-0.5 rounded bg-violet-50 dark:bg-violet-950/30 shrink-0">
                                  <CheckCircle2 className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate block w-full max-w-full">
                                        {study.study.comparison}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{study.study.comparison}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                );
              })}

            {/* Load More Button */}
            <LoadMoreStudiesButton/>
          </div>
        )}
      </div>
    </div>

      {/* AI Reason Dialog */}
      {selectedAIStudy && currentBatchHash !== undefined && currentReportId !== undefined && (
        <StudyAIReasonDialog
          open={reasonDialogOpen}
          onOpenChange={setReasonDialogOpen}
          studyName={selectedAIStudy.studyName}
          classification={
            getStudyResult(
              currentBatchHash,
              currentReportId,
              selectedAIStudy.studyId
            )?.classification || "unsure"
          }
          reason={
            getStudyResult(
              currentBatchHash,
              currentReportId,
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
