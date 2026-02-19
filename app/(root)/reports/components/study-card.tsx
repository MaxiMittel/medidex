"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RelevanceStudy } from "@/types/reports";
import {
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
  Users,
  Calendar,
  Download,
  CheckCircle2,
} from "lucide-react";
import { StudyAIBadge } from "./study-ai-badge";
import { getRelevanceColor, getRelevanceBadgeStyle } from "./relevance-utils";
import type { StudyAIResult } from "@/hooks/use-genai-evaluation-store";

interface StudyCardProps {
  study: RelevanceStudy;
  isLinked: boolean;
  isOpen: boolean;
  onLinkedChange: (studyId: number, checked: boolean) => void;
  onStudyClick: (study: RelevanceStudy) => void;
  studyResult?: StudyAIResult;
  onAIBadgeClick: (studyId: number, studyName: string) => void;
  isDownloadingAllPdfs: boolean;
  downloadingSingle: Set<number>;
  onDownloadAllPdfs: (study: RelevanceStudy) => void;
  onDownloadSinglePdf: (report: any, studyShortName: string) => void;
}

export function StudyCard({
  study,
  isLinked,
  isOpen,
  onLinkedChange,
  onStudyClick,
  studyResult,
  onAIBadgeClick,
  isDownloadingAllPdfs,
  downloadingSingle,
  onDownloadAllPdfs,
  onDownloadSinglePdf,
}: StudyCardProps) {
  const relevancePercentage = (study.Relevance * 100).toFixed(1);
  const studyValue = `study-${study.CRGStudyID}`;
  const reportCount = study.reports.length;

  return (
    <AccordionItem value={studyValue} className="border-none">
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
                {/* Checkbox */}
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
                              onLinkedChange(
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

              {/* Details button */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 px-3 text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStudyClick(study);
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
              {studyResult && (
                <StudyAIBadge
                  classification={studyResult.classification}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAIBadgeClick(study.CRGStudyID, study.ShortName);
                  }}
                />
              )}
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
                    : study.NumberParticipants || "-"}{" "}
                  participants
                </span>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <div
                  className={`p-0.5 rounded ${study.Duration ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted"}`}
                >
                  <Calendar
                    className={`h-3 w-3 ${study.Duration ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`}
                  />
                </div>
                <span
                  className={
                    study.Duration ? "" : "text-muted-foreground/50"
                  }
                >
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
                        <span className="truncate">{study.Comparison}</span>
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
              <span className="text-sm font-medium">Associated Reports</span>
              <Badge
                variant="secondary"
                className="text-xs font-normal h-5"
              >
                {reportCount}
              </Badge>
            </div>
            {reportCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownloadAllPdfs(study)}
                disabled={isDownloadingAllPdfs}
                className="h-7 px-2 text-xs flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                {isDownloadingAllPdfs ? "Downloading..." : "Download All"}
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-medium">CRG ID</TableHead>
                <TableHead className="font-medium">Title</TableHead>
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
                            <p className="text-sm">{report.Title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onDownloadSinglePdf(report, study.ShortName)
                        }
                        disabled={downloadingSingle.has(report.CRGReportID)}
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
                    <p className="text-sm">No reports available</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
