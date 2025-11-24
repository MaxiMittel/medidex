"use client";

import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RelevanceStudy, StudyReportSummary } from "@/types/reports";
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
  CheckCircle2,
  Sparkles,
  Download,
} from "lucide-react";
import { StudyOverview } from "./study-overview";
import { StudyDetails } from "./study-details";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";
import { getReportPdf } from "@/lib/api/studiesApi";

interface StudyRelevanceTableProps {
  studies: RelevanceStudy[];
  loading?: boolean;
  onLinkedChange?: (studyId: number, linked: boolean) => void;
  onStudySelect?: (studyId: number | null) => void;
}

export function StudyRelevanceTable({
  studies,
  loading,
  onLinkedChange,
  onStudySelect,
}: StudyRelevanceTableProps) {
  const { studyDetails, studyDetailsLoading, fetchStudyDetails } =
    useBatchReportsStore();
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

  useEffect(() => {
    setLinkedStudies(
      new Set(studies.filter((s) => s.Linked).map((s) => s.CRGStudyID))
    );
  }, [studies]);

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

  const handleLinkedChange = (studyId: number, checked: boolean) => {
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
  };

  const handleBulkToggle = (selectAll: boolean) => {
    if (selectAll) {
      const allIds = new Set(filteredStudies.map((s) => s.CRGStudyID));
      setLinkedStudies(allIds);
    } else {
      setLinkedStudies(new Set());
    }
  };

  const handleAccordionChange = (value: string[]) => {
    setOpenStudies(new Set(value));
  };

  const allFilteredLinked = filteredStudies.every((s) =>
    linkedStudies.has(s.CRGStudyID)
  );

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.9) return "bg-green-500";
    if (relevance >= 0.7) return "bg-blue-500";
    if (relevance >= 0.5) return "bg-yellow-500";
    return "bg-orange-500";
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
          const blob = await getReportPdf(report.CRGReportID);
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
            `Failed to download report ${report.CRGReportID}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
        // Add delay between downloads to avoid browser throttling
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (successCount > 0) {
        toast.success(
          `Downloaded ${successCount} PDF${successCount > 1 ? "s" : ""}${
            failureCount > 0 ? ` (${failureCount} failed)` : ""
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
      const blob = await getReportPdf(report.CRGReportID);
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
        `Failed to download report ${report.CRGReportID}: ${
          error instanceof Error ? error.message : "Unknown error"
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
      {/* Header - Sticky */}
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Relevant Studies</h2>
            <Badge variant="secondary">
              {filteredStudies.length}
              {searchQuery && ` of ${studies.length}`}
            </Badge>
          </div>
          {filteredStudies.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggle(!allFilteredLinked)}
              className="text-xs"
            >
              {allFilteredLinked ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Select All
                </>
              )}
            </Button>
          )}
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
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 animate-pulse" />
            <p className="font-medium">Loading relevant studies...</p>
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No studies found</p>
            <p className="text-sm mt-1">
              {searchQuery
                ? "Try adjusting your search query"
                : "No relevant studies available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table Header - Sticky */}
            <div className="grid grid-cols-12 md:grid-cols-12 p-3 pl-6 font-medium border-b bg-muted/30 sticky top-0 z-10 gap-2 backdrop-blur-sm">
              <div className="col-span-1 text-xs text-muted-foreground">
                Linked
              </div>
              <div className="col-span-1 text-xs text-muted-foreground">ID</div>
              <div className="col-span-1 text-xs text-muted-foreground px-3">
                Relevance
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                Short Name
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                Participants
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                Duration
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                Comparison
              </div>
              <div className="col-span-1 text-xs text-muted-foreground text-right pr-2">
                Reports
              </div>
            </div>

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
                      <div className="grid grid-cols-12 md:grid-cols-12 p-3 pl-6 mb-2 bg-secondary/50 hover:bg-secondary rounded-xl relative w-full items-center transition-all duration-200 border border-transparent hover:border-primary/20 group-hover:shadow-sm gap-2">
                        {/* Left indicator bar with relevance color */}
                        <div
                          className={`${getRelevanceColor(
                            study.Relevance
                          )} rounded-full h-3/4 w-1 absolute left-2 top-1/2 -translate-y-1/2 transition-all`}
                        ></div>

                        {/* Checkbox */}
                        <div
                          className="col-span-1 flex items-center"
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
                                    className="data-[state=checked]:bg-primary"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isLinked ? "Unlink study" : "Link study"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* CRGStudyID */}
                        <div className="col-span-1 text-sm flex items-center font-mono text-muted-foreground">
                          {study.CRGStudyID}
                        </div>

                        {/* Relevance with visual indicator */}
                        <div className="col-span-1 flex items-center gap-3 px-4">
                          <div className="flex flex-col w-full">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold">
                                {relevancePercentage}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                              <div
                                className={`h-full ${getRelevanceColor(
                                  study.Relevance
                                )} transition-all duration-300`}
                                style={{
                                  width: `${study.Relevance * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ShortName */}
                        <div className="col-span-2 text-sm flex items-center font-medium">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate">
                                  {study.ShortName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{study.ShortName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* NumberParticipants */}
                        <div className="col-span-2 text-sm flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {typeof study.NumberParticipants === "number"
                              ? study.NumberParticipants.toLocaleString()
                              : study.NumberParticipants || "-"}
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="col-span-2 text-sm flex items-center gap-1.5 text-muted-foreground">
                          {study.Duration ? (
                            <>
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{study.Duration}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </div>

                        {/* Comparison */}
                        <div className="col-span-2 text-sm flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate text-muted-foreground">
                                  {study.Comparison || "-"}
                                </span>
                              </TooltipTrigger>
                              {study.Comparison && (
                                <TooltipContent className="max-w-xs">
                                  <p>{study.Comparison}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Report count, Show Details button, and chevron */}
                        <div className="col-span-1 flex items-center justify-end gap-2 pr-2">
                          {reportCount > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0 h-5 flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {reportCount}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStudyClick(study);
                            }}
                          >
                            Details
                          </Button>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </AccordionTrigger>

                    {/* Expanded content - Reports table */}
                    <AccordionContent className="pt-0 pb-4 px-6">
                      <div className="mt-3 border rounded-lg overflow-hidden bg-card">
                        <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Associated Reports ({reportCount})
                            </span>
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
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          {selectedStudy && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStudy.ShortName}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <StudyOverview study={getStudyForSheet(selectedStudy)} />

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
                    loading={false}
                  />
                ) : (
                  <StudyDetails
                    interventions={[]}
                    conditions={[]}
                    outcomes={[]}
                    design={[]}
                    loading={
                      studyDetailsLoading[selectedStudy.CRGStudyID] ?? false
                    }
                  />
                )}

                {/* Reports Section with Download */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Reports ({selectedStudy.reports.length})
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
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {report.Title}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {report.CENTRALReportID && (
                                  <span>
                                    CENTRAL ID: {report.CENTRALReportID}
                                  </span>
                                )}
                                <span>CRG ID: {report.CRGReportID}</span>
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
                              className="h-8 w-8 p-0 flex items-center justify-center"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No reports available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
