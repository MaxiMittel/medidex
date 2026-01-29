"use client";

import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RelevanceStudy } from "@/types/reports";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  FileText,
  Search,
  Users,
  Calendar,
  Link2,
  X,
  Sparkles,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { StudyOverview } from "./study-overview";
import { StudyDetails } from "./study-details";
import { AddStudyDialog } from "./add-study-dialog";
import { AIMatchSettingsDialog } from "./ai-match-settings-dialog";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";
import { LoadMoreStudiesButton } from "./load-more-studies-button";
import { sendReportEvent } from "@/lib/api/reportEventsApi";
import { useGenAIEvaluation } from "@/hooks/use-genai-evaluation";
import type { AIModel } from "@/hooks/use-genai-evaluation";
import type { PromptOverrides } from "@/types/apiDTOs";
import { StudyAIBadge } from "./study-ai-badge";
import { StudyAIReasonDialog } from "./study-ai-reason-dialog";
import { Separator } from "../../../../components/ui/separator";

interface StudyRelevanceTableProps {
  studies: RelevanceStudy[];
  loading?: boolean;
  onLinkedChange?: (studyId: number, linked: boolean) => void;
  onStudySelect?: (studyId: number | null) => void;
  // Add current report context
  currentBatchHash?: string;
  currentReportIndex?: number;
  currentReportCRGId?: number;
  // For event tracking
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
  const {
    studyDetails,
    studyDetailsLoading,
    fetchStudyDetails,
    assignStudyToReport,
    unassignStudyFromReport,
    fetchSimilarStudiesForReport,
    fetchAssignedStudiesForReport,
    reportsByBatch,
  } = useBatchReportsStore();
  const [linkedStudies, setLinkedStudies] = useState<Set<number>>(
    new Set(studies.filter((s) => s.Linked).map((s) => s.CRGStudyID))
  );
  const [openStudies, setOpenStudies] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudy, setSelectedStudy] = useState<RelevanceStudy | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [downloadingPdfs, setDownloadingPdfs] = useState<Set<number>>(
    new Set()
  );
  const [downloadingSingle, setDownloadingSingle] = useState<Set<number>>(
    new Set()
  );

  // AI Evaluation state
  const { evaluate, getStudyResult, loading: aiLoading } = useGenAIEvaluation();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedAIStudy, setSelectedAIStudy] = useState<{
    studyId: number;
    studyName: string;
  } | null>(null);

  useEffect(() => {
    setLinkedStudies(
      new Set(studies.filter((s) => s.Linked).map((s) => s.CRGStudyID))
    );
  }, [studies]);

  // Reset evaluation state when report changes
  useEffect(() => {
    setAiDialogOpen(false);
  }, [currentBatchHash, currentReportIndex]);

  // Filter and sort studies
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

  const handleAIEvaluation = async (options: {
    model?: AIModel;
    temperature?: number;
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
      toast.info(`Evaluating ${filteredStudies.length} studies with AI...`);
      await evaluate(
        currentBatchHash,
        currentReportIndex,
        currentReport,
        filteredStudies,
        options
      );
      toast.success("AI evaluation complete!");
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

    // Call the callback if provided (for backward compatibility)
    onLinkedChange?.(studyId, checked);

    // If we have report context, persist to backend
    if (currentBatchHash && currentReportIndex !== undefined) {
      try {
        if (checked) {
          await assignStudyToReport(
            currentBatchHash,
            currentReportIndex,
            studyId
          );
          toast.success(`Study assigned to report`);

          // Send "end" event when a study is assigned (checkbox checked)
          if (currentReportCRGId) {
            const lastInteraction = getLastInteraction?.() ?? null;
            void sendReportEvent(currentReportCRGId, "end", lastInteraction);
          }
        } else {
          await unassignStudyFromReport(
            currentBatchHash,
            currentReportIndex,
            studyId
          );
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
          )
        ]);
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

  const handleBulkToggle = async (selectAll: boolean) => {
    if (!currentBatchHash || currentReportIndex === undefined) {
      // Fallback to local state only
      if (selectAll) {
        const allIds = new Set(filteredStudies.map((s) => s.CRGStudyID));
        setLinkedStudies(allIds);
      } else {
        setLinkedStudies(new Set());
      }
      return;
    }

    const studiesToProcess = filteredStudies.filter((study) => {
      const isCurrentlyLinked = linkedStudies.has(study.CRGStudyID);
      return selectAll ? !isCurrentlyLinked : isCurrentlyLinked;
    });

    if (studiesToProcess.length === 0) {
      return;
    }

    // Optimistically update UI
    if (selectAll) {
      const allIds = new Set(filteredStudies.map((s) => s.CRGStudyID));
      setLinkedStudies(allIds);
    } else {
      setLinkedStudies(new Set());
    }

    // Process assignments/unassignments
    try {
      const promises = studiesToProcess.map((study) =>
        selectAll
          ? assignStudyToReport(
            currentBatchHash,
            currentReportIndex,
            study.CRGStudyID
          )
          : unassignStudyFromReport(
            currentBatchHash,
            currentReportIndex,
            study.CRGStudyID
          )
      );

      await Promise.all(promises);
      toast.success(
        selectAll
          ? `${studiesToProcess.length} studies assigned`
          : `${studiesToProcess.length} studies unassigned`
      );

      // Send "end" event when studies are bulk assigned
      if (selectAll && currentReportCRGId) {
        const lastInteraction = getLastInteraction?.() ?? null;
        void sendReportEvent(currentReportCRGId, "end", lastInteraction);
      }

      const updatedAssigned = selectAll
        ? filteredStudies.map((s) => s.CRGStudyID)
        : filteredStudies
          .filter((s) => !linkedStudies.has(s.CRGStudyID))
          .map((s) => s.CRGStudyID);

      await Promise.all(
        [
          fetchSimilarStudiesForReport(
            currentBatchHash,
            currentReportIndex,
            updatedAssigned,
            true
          ),
          fetchAssignedStudiesForReport(
            currentBatchHash,
            currentReportIndex,
            currentReportCRGId,
            true
          )
        ]
      )

    } catch (error) {
      // Revert on error
      setLinkedStudies(
        new Set(studies.filter((s) => s.Linked).map((s) => s.CRGStudyID))
      );
      toast.error(
        `Failed to ${selectAll ? "assign" : "unassign"} studies: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleAccordionChange = (value: string[]) => {
    setOpenStudies(new Set(value));
  };

  const allFilteredLinked = filteredStudies.every((s) =>
    linkedStudies.has(s.CRGStudyID)
  );

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
    setSelectedStudy(study);
    setIsSheetOpen(true);
    onStudySelect?.(study.CRGStudyID);
    // Fetch detailed study information
    void fetchStudyDetails(study.CRGStudyID);
  };

  // Convert RelevanceStudy to study format for StudyOverview
  const getStudyForSheet = (study: RelevanceStudy) => {
    const numberParticipants = study.NumberParticipants;
    const formattedParticipants =
      numberParticipants === null || numberParticipants === undefined
        ? "-"
        : typeof numberParticipants === "number"
          ? numberParticipants.toString()
          : numberParticipants;

    // Get additional details from studyDetails if available
    const details = studyDetails[study.CRGStudyID];

    return {
      ShortName: study.ShortName,
      StatusofStudy: study.StatusofStudy || "Unknown",
      CENTRALSubmissionStatus: study.CENTRALSubmissionStatus || "Unknown",
      TrialistContactDetails: study.TrialistContactDetails || "",
      NumberParticipants: formattedParticipants,
      Countries: study.Countries || "",
      Duration: study.Duration || "",
      Comparison: study.Comparison || "",
      ISRCTN: study.ISRCTN || "",
      Notes: study.Notes || "",
      UDef4: study.UDef4 || "",
      DateEntered: details?.studyInfo.DateEntered || study.DateEntered,
      DateEdited: details?.studyInfo.DateEdited || study.DateEdited,
      TrialRegistrationID: details?.studyInfo.TrialRegistrationID || undefined,
      CENTRALStudyID: details?.studyInfo.CENTRALStudyID,
      CRGStudyID: study.CRGStudyID,
    };
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
        // Add delay between downloads to avoid browser throttling
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

  const handleDownloadSingleReportPdf = async (
    report: any,
    studyShortName: string
  ) => {
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AIMatchSettingsDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onEvaluate={handleAIEvaluation}
        isRunning={aiLoading}
        disableRun={filteredStudies.length === 0}
      />

      {/* Header - Sticky */}
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Relevant Studies</h2>
            <Badge variant="secondary" className="text-xs font-normal">
              {filteredStudies.length}
              {searchQuery && ` of ${studies.length}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {currentBatchHash !== undefined &&
              currentReportIndex !== undefined && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-2"
                    onClick={() => setAiDialogOpen(true)}
                    disabled={aiLoading || filteredStudies.length === 0}
                  >
                    {aiLoading ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    AI Match
                  </Button>
                  <AddStudyDialog
                    currentBatchHash={currentBatchHash}
                    currentReportIndex={currentReportIndex}
                    currentReportCRGId={currentReportCRGId}
                  />
                </>
              )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, comparison, or participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
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
            {/* Studies list */}
            <Accordion
              type="multiple"
              className="w-full space-y-2"
              onValueChange={handleAccordionChange}
            >
              {filteredStudies.map((study) => {
                const isLinked = linkedStudies.has(study.CRGStudyID);
                const relevancePercentage = (study.Relevance * 100).toFixed(1);
                const studyValue = `study-${study.CRGStudyID}`;
                const isOpen = openStudies.has(studyValue);
                const reportCount = study.reports.length;

                return (
                  <AccordionItem
                    key={study.CRGStudyID}
                    value={studyValue}
                    className="border-none"
                  >
                    <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden group">
                      <div className="p-4 mb-2 bg-card hover:bg-muted/50 rounded-lg relative w-full transition-all duration-200 border border-border/60 hover:border-border group-hover:shadow-sm">
                        {/* Left indicator bar with relevance color */}
                        <div
                          className={`${getRelevanceColor(
                            study.Relevance
                          )} rounded-l-lg h-full w-1 absolute left-0 top-0 bottom-0 transition-all`}
                        ></div>

                        <div className="flex flex-col gap-3 pl-4">
                          {/* Top row: Checkbox, Short Name, and Details button */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Checkbox - smaller */}
                              <div
                                className="flex items-center shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Checkbox
                                          checked={isLinked}
                                          onCheckedChange={(checked) =>
                                            handleLinkedChange(
                                              study.CRGStudyID,
                                              checked as boolean
                                            )
                                          }
                                          className="data-[state=checked]:bg-primary h-4 w-4"
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {isLinked ? "Unlink study" : "Link study"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>

                              {/* ShortName */}
                              <div className="flex-1 min-w-0">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <h3 className="text-base font-semibold truncate">
                                        {study.ShortName}
                                      </h3>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{study.ShortName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>

                            {/* Details button - more prominent */}
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 px-3 text-sm font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStudyClick(study);
                                }}
                              >
                                Details
                              </Button>
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Relevance */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                              Relevance
                            </span>
                            <Badge
                              variant="secondary"
                              className={`font-semibold text-xs px-2 py-0.5 ${getRelevanceBadgeStyle(study.Relevance)}`}
                            >
                              {relevancePercentage}%
                            </Badge>
                            {/* AI Classification Badge */}
                            {currentBatchHash !== undefined &&
                              currentReportIndex !== undefined &&
                              (() => {
                                const aiResult = getStudyResult(
                                  currentBatchHash,
                                  currentReportIndex,
                                  study.CRGStudyID
                                );
                                return aiResult ? (
                                  <StudyAIBadge
                                    classification={aiResult.classification}
                                    onClick={() =>
                                      handleAIBadgeClick(
                                        study.CRGStudyID,
                                        study.ShortName
                                      )
                                    }
                                  />
                                ) : null;
                              })()}
                          </div>

                          {/* Bottom row: Participants, Duration, Comparison */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                            {/* NumberParticipants */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className="p-0.5 rounded bg-blue-50 dark:bg-blue-950/30">
                                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span>
                                {typeof study.NumberParticipants === "number"
                                  ? study.NumberParticipants.toLocaleString()
                                  : study.NumberParticipants || "-"} participants
                              </span>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className={`p-0.5 rounded ${study.Duration ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted"}`}>
                                <Calendar className={`h-3 w-3 ${study.Duration ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`} />
                              </div>
                              <span className={study.Duration ? "" : "text-muted-foreground/50"}>
                                {study.Duration || "No duration"}
                              </span>
                            </div>

                            {/* Comparison */}
                            {study.Comparison && (
                              <div className="flex items-center gap-1.5 text-muted-foreground flex-1 min-w-0">
                                <div className="p-0.5 rounded bg-violet-50 dark:bg-violet-950/30 shrink-0">
                                  <CheckCircle2 className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate">
                                        {study.Comparison}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{study.Comparison}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    {/* Expanded content - Reports table */}
                    <AccordionContent className="pt-0 pb-3 px-5">
                      <div className="mt-2 border border-border/60 rounded-lg overflow-hidden bg-card">
                        <div className="bg-muted/40 px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded bg-slate-100 dark:bg-slate-800/50">
                              <FileText className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <span className="text-sm font-medium">
                              Associated Reports
                            </span>
                            <Badge variant="secondary" className="text-xs font-normal h-5">
                              {reportCount}
                            </Badge>
                          </div>
                          {reportCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAllReportPdfs(study)}
                              disabled={downloadingPdfs.has(study.CRGStudyID)}
                              className="h-7 px-2 text-xs flex items-center gap-1"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {downloadingPdfs.has(study.CRGStudyID)
                                ? "Downloading..."
                                : "Download All"}
                            </Button>
                          )}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-12"></TableHead>
                              <TableHead className="font-medium">
                                CENTRAL ID
                              </TableHead>
                              <TableHead className="font-medium">
                                CRG ID
                              </TableHead>
                              <TableHead className="font-medium">
                                Title
                              </TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {study.reports.length > 0 ? (
                              study.reports.map((report, idx) => (
                                <TableRow
                                  key={report.CRGReportID || idx}
                                  className="hover:bg-muted/50 transition-colors"
                                >
                                  <TableCell>
                                    {report.CENTRALReportID && (
                                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {report.CENTRALReportID || (
                                      <span className="text-muted-foreground/50">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {report.CRGReportID}
                                  </TableCell>
                                  <TableCell className="max-w-md">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="truncate text-sm">
                                            {report.Title}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-md">
                                          <p className="text-sm">
                                            {report.Title}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDownloadSingleReportPdf(
                                          report,
                                          study.ShortName
                                        )
                                      }
                                      disabled={downloadingSingle.has(
                                        report.CRGReportID
                                      )}
                                      className="h-6 w-6 p-0 flex items-center justify-center"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                  <p className="text-sm">
                                    No reports available
                                  </p>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Load More Button */}
            <LoadMoreStudiesButton
              currentBatchHash={currentBatchHash}
              currentReportIndex={currentReportIndex}
              currentStudiesCount={studies.length}
            />
          </div>
        )}
      </div>

      {/* Sheet for Study Details */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            onStudySelect?.(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto pb-8"
        >
          {selectedStudy && (
            <>
              <SheetHeader className="border-b border-border/60">
                <SheetTitle>{selectedStudy.ShortName}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <StudyOverview study={getStudyForSheet(selectedStudy)} />

                <Separator />

                {/* Study Details Section */}
                {studyDetails[selectedStudy.CRGStudyID] ? (
                  <StudyDetails
                    interventions={
                      studyDetails[selectedStudy.CRGStudyID].interventions
                    }
                    conditions={
                      studyDetails[selectedStudy.CRGStudyID].conditions
                    }
                    outcomes={studyDetails[selectedStudy.CRGStudyID].outcomes}
                    design={studyDetails[selectedStudy.CRGStudyID].design}
                    persons={studyDetails[selectedStudy.CRGStudyID].persons}
                    loading={false}
                  />
                ) : (
                  <StudyDetails
                    interventions={[]}
                    conditions={[]}
                    outcomes={[]}
                    design={[]}
                    persons={[]}
                    loading={
                      studyDetailsLoading[selectedStudy.CRGStudyID] ?? false
                    }
                  />
                )}

                <Separator />

                {/* Reports Section with Download */}
                <div className="space-y-4 px-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-muted">
                        <FileText className="h-4 w-4" />
                      </div>
                      Reports
                      <Badge variant="secondary" className="text-xs font-normal">
                        {selectedStudy.reports.length}
                      </Badge>
                    </h3>
                    {selectedStudy.reports.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadAllReportPdfs(selectedStudy)
                        }
                        disabled={downloadingPdfs.has(selectedStudy.CRGStudyID)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingPdfs.has(selectedStudy.CRGStudyID)
                          ? "Downloading..."
                          : "Download All PDFs"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selectedStudy.reports.length > 0 ? (
                      selectedStudy.reports.map((report, idx) => (
                        <div
                          key={report.CRGReportID || idx}
                          className="p-3.5 rounded-md border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug">
                                {report.Title}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                {report.CENTRALReportID && (
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                    CENTRAL: {report.CENTRALReportID}
                                  </code>
                                )}
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                  CRG: {report.CRGReportID}
                                </code>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadSingleReportPdf(
                                  report,
                                  selectedStudy.ShortName
                                )
                              }
                              disabled={downloadingSingle.has(
                                report.CRGReportID
                              )}
                              className="h-8 w-8 p-0 flex items-center justify-center shrink-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">No reports available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* AI Reason Dialog */}
      {selectedAIStudy && currentBatchHash !== undefined && currentReportIndex !== undefined && (
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
    </div>
  );
}
