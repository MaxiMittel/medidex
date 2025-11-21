"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  Users,
  Link2,
  ChevronDown,
  Search,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Report {
  reportIndex: number;
  batchHash: string;
  assignedStudyIds: number[];
  CENTRALReportID?: number | null;
  CRGReportID: number;
  Title: string;
  Abstract?: string;
  Year?: number;
  DatetoCENTRAL?: string;
  Dateentered?: string;
  NumberParticipants?: string | number;
  Assigned?: boolean;
  AssignedTo?: string;
}

interface StudyAbstract {
  BACKGROUND?: string;
  METHODS?: string;
  RESULTS?: string;
  CONCLUSIONS?: string;
}

interface ReportsListProps {
  reports: Report[];
  studyTitle?: string;
  studyAuthors?: string;
  studyAbstract?: StudyAbstract;
  selectedReportIndex?: number;
  onReportSelect?: (report: Report) => void;
  loadingMore?: boolean;
  totalReports?: number;
}

export function ReportsList({
  reports,
  selectedReportIndex,
  onReportSelect,
  loadingMore = false,
  totalReports,
}: ReportsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");
  const [expandedReports, setExpandedReports] = useState<Set<number>>(
    new Set()
  );

  const filteredReports = reports.filter((report) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        report.Title.toLowerCase().includes(query) ||
        report.Abstract?.toLowerCase().includes(query) ||
        report.CRGReportID.toString().includes(query) ||
        report.CENTRALReportID?.toString().includes(query);
      if (!matchesSearch) return false;
    }

    // Assignment filter
    if (assignmentFilter === "assigned") {
      return report.Assigned === true;
    }
    if (assignmentFilter === "unassigned") {
      return !report.Assigned;
    }

    return true;
  });

  const toggleReport = (reportId: number) => {
    setExpandedReports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b shrink-0">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Reports</h2>
        <span className="text-sm text-muted-foreground">
          ({filteredReports.length}
          {searchQuery && ` of ${reports.length}`}
          {loadingMore && totalReports && ` / ${totalReports} total`})
        </span>
        {loadingMore && (
          <span className="text-xs text-blue-600 animate-pulse">
            Loading more...
          </span>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-4 shrink-0 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Assignment Filter */}
        <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="space-y-3 pr-4">
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
              const displayDate = report.Year
                ? report.Year.toString()
                : report.DatetoCENTRAL
                ? new Date(report.DatetoCENTRAL).getFullYear().toString()
                : report.Dateentered
                ? new Date(report.Dateentered).getFullYear().toString()
                : null;

              const participantCount = report.NumberParticipants
                ? typeof report.NumberParticipants === "number"
                  ? report.NumberParticipants.toLocaleString()
                  : report.NumberParticipants
                : null;

              const isExpanded = expandedReports.has(report.CRGReportID);
              const isSelected = report.reportIndex === selectedReportIndex;
              const hasAbstract = report.Abstract && report.Abstract.length > 0;

              return (
                <div
                  key={report.CRGReportID || report.CENTRALReportID || idx}
                  className={`rounded-lg border bg-card hover:border-primary/20 transition-all overflow-hidden ${
                    isSelected ? "border-primary" : ""
                  }`}
                  onClick={() => onReportSelect?.(report)}
                >
                  {/* Report Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold leading-snug mb-2.5 text-foreground">
                          {report.Title}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-2">
                          {displayDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>{displayDate}</span>
                            </div>
                          )}
                          {participantCount && (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 shrink-0" />
                              <span>{participantCount}</span>
                            </div>
                          )}
                          {report.CRGReportID && (
                            <span className="font-mono text-xs">
                              CRG: {report.CRGReportID}
                            </span>
                          )}
                          {report.CENTRALReportID && (
                            <span className="font-mono text-xs">
                              CENTRAL: {report.CENTRALReportID}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        {report.Assigned && (
                          <Badge
                            variant="default"
                            className="text-xs flex items-center gap-1.5 px-2 py-1 shrink-0"
                          >
                            <Link2 className="h-3 w-3" />
                            {report.AssignedTo || "Assigned"}
                          </Badge>
                        )}
                        {hasAbstract && (
                          <button
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleReport(report.CRGReportID);
                            }}
                            aria-label={
                              isExpanded ? "Hide abstract" : "Show abstract"
                            }
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 shrink-0 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Abstract Preview */}
                    {hasAbstract && !isExpanded && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-2">
                        {report.Abstract}
                      </p>
                    )}
                  </div>

                  {/* Expanded Abstract */}
                  {isExpanded && hasAbstract && (
                    <div className="px-4 pb-4 border-t bg-muted/30">
                      <p className="text-xs text-muted-foreground leading-relaxed pt-3 whitespace-pre-wrap">
                        {report.Abstract}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
