"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  FileText,
  Calendar,
  Users,
  Download,
  Loader2,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportAssignedStudiesBadges } from "@/components/ui/study-view/report-assigned-studies-badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useGenAIEvaluationStore } from "@/hooks/use-genai-evaluation-store";
import { useReportStore } from "@/hooks/use-report-store";
import { ReportDetailDto, ReportDto, StudyDto } from "../../../types/apiDTOs";

interface ReportListProps {
  reports: ReportDetailDto[];
  baseUrl: string;
}

const getAssignmentKey = (reportId: number, studyId: number) => `${reportId}-${studyId}`;

const toTimestamp = (value: Date | string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const isNewStudyAssignment = (
  studyCreatedAt: Date | string | number | null | undefined,
  reportCreatedAt: Date | string | number | null | undefined
) => {
  const studyTimestamp = toTimestamp(studyCreatedAt);
  const reportTimestamp = toTimestamp(reportCreatedAt);
  return studyTimestamp !== null && reportTimestamp !== null && studyTimestamp > reportTimestamp;
};

export function ReportList({
  reports,
  baseUrl,
}: ReportListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<
    "all" | "assigned" | "unassigned" | "newStudy"
  >("all");
  const [downloadingPdf, setDownloadingPdf] = useState<Set<number>>(new Set());
   const params = useParams();
  const projectId =
    typeof params.projectId === "string"
      ? params.projectId
      : undefined;

  const reportIdParam =
    typeof params.reportId === "string"
      ? params.reportId
      : Array.isArray(params.reportId)
      ? params.reportId[0]
      : undefined;

  const selectedReportId = useMemo(() => {
    if (!reportIdParam) {
      return null;
    }
    const parsed = Number.parseInt(reportIdParam, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [reportIdParam]);

  const selectedCardRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (selectedReportId !== null && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedReportId]);

  const setReports = useReportStore((state) => state.setReports);

  useEffect(() => {
    setReports(reports);
  }, [reports, setReports]);

  const storeResults = useGenAIEvaluationStore((state) => state.results);
  const runningEvaluations = useGenAIEvaluationStore((state) => state.runningEvaluations);
  const storedReports = useReportStore((state) => state.reports);

  const reportsWithStoredAssignments = useMemo(
    () =>
      reports.map((report) => ({
        ...report,
        assignedStudies:
          storedReports[report.report.reportId]?.assignedStudies ?? report.assignedStudies,
      })),
    [reports, storedReports]
  );

  const filteredReports = reportsWithStoredAssignments.filter((report) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        report.report.title.toLowerCase().includes(query) ||
        report.report.abstract?.toLowerCase().includes(query) ||
        report.report.reportId.toString().includes(query);
      if (!matchesSearch) return false;
    }

    // Assignment filter
    if (assignmentFilter === "assigned") {
      return report.assignedStudies.length > 0;
    }
    if (assignmentFilter === "unassigned") {
      return report.assignedStudies.length == 0;
    }
    if (assignmentFilter === "newStudy") {
      return report.assignedStudies.some((study) =>
        isNewStudyAssignment(study.createdAt, report.report.createdAt)
      );
    }

    return true;
  });

  const handleDownloadPdf = async (reportId: number, title: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDownloadingPdf((prev) => new Set(prev).add(reportId));

    try {
      const response = await fetch(`/api/meerkat/reports/${reportId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Report_${reportId}_${title.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded report ${reportId}`);
    } catch (error) {
      toast.error(
        `Failed to download report ${reportId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDownloadingPdf((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  return (
    <div className="h-full flex flex-col pt-5">
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Reports</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredReports.length})
            {searchQuery && ` of ${reports.length}`}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
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

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Filter:
              </span>
              <div className="flex gap-1">
                <Button
                  variant={assignmentFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setAssignmentFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={assignmentFilter === "assigned" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setAssignmentFilter("assigned")}
                >
                  Assigned
                </Button>
                <Button
                  variant={
                    assignmentFilter === "unassigned" ? "default" : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setAssignmentFilter("unassigned")}
                >
                  Unassigned
                </Button>
                <Button
                  variant={assignmentFilter === "newStudy" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setAssignmentFilter("newStudy")}
                >
                  New
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0" viewportClassName="px-4 overflow-visible">
        <div className="space-y-3 pb-4">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No reports found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search query</p>
              )}
            </div>
          ) : (
            filteredReports.map((report, idx) => {
              const displayDate = report.report.year
                ? report.report.year.toString()
                : null;

              const hasAbstract = report.report.abstract && report.report.abstract.length > 0;
              const isSelected = selectedReportId === report.report.reportId;
              const isExpanded = isSelected && hasAbstract;
              const reportKey = `${report.report.reportId}`;
              const isRunningEvaluation = runningEvaluations.includes(reportKey);
              const reportResults = storeResults[reportKey];
              const resultCount = reportResults ? Object.keys(reportResults).length : 0;
              const reportHref = `/${baseUrl}/${projectId}/${report.report.reportId}?k=10`;

              // If projectId is not available, render as non-link
              if (!reportHref) {
                return null;
              }

              return (
                <Link
                    key={report.report.reportId || idx}
                    href={reportHref}
                    scroll={true}
                    ref={isSelected ? selectedCardRef : undefined}
                    tabIndex={0}
                    aria-selected={isSelected}
                    className={`block relative rounded-lg border bg-card hover:border-primary/20 transition-all first:mt-3 scroll-mt-4 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 ${
                      isSelected
                        ? "border-primary bg-primary/5 outline outline-2 outline-primary/40"
                        : ""
                    }`}
                  >
                  {/* Report Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold leading-snug mb-2.5 text-foreground">
                          {isRunningEvaluation ? (
                            <Spinner className="mr-1 inline h-3 w-3 text-primary" />
                          ) : resultCount > 0 ? (
                            <Sparkles className="mr-1 inline h-3 w-3" />
                          ) : null}
                          {report.report.title}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-2">
                          {displayDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>{displayDate}</span>
                            </div>
                          )}
                          {report.report.authors && report.report.authors.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 shrink-0" />
                              <span className={isExpanded ? "" : "truncate max-w-[200px]"}>
                                {report.report.authors.join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        {isSelected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => handleDownloadPdf(report.report.reportId, report.report.title, e)}
                            disabled={downloadingPdf.has(report.report.reportId)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Abstract Preview */}
                    {hasAbstract && !isExpanded && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-2">
                        {report.report.abstract}
                      </p>
                    )}

                    {report.assignedStudies.length > 0 && (
                      <ReportAssignedStudiesBadges
                        report={report}
                        reportCreatedAt={report.report.createdAt}
                      />
                    )}
                  </div>

                  {/* Expanded Abstract */}
                  {isExpanded && hasAbstract && (
                    <div className="px-4 pb-4 border-t bg-muted/30">
                      <p className="text-xs text-muted-foreground leading-relaxed pt-3 whitespace-pre-wrap">
                        {report.report.abstract}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </ScrollArea>
      
    </div>
  );
}
