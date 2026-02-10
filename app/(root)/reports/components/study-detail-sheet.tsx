"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RelevanceStudy } from "@/types/reports";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileText, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { StudyOverview } from "./study-overview";
import { StudyDetails } from "./study-details";
import { getStudyForSheet } from "./relevance-utils";
import type { useBatchReportsStore } from "@/hooks/use-batch-reports-store";

type StudyDetailsMap = ReturnType<typeof useBatchReportsStore.getState>["studyDetails"];
type StudyDetailsLoadingMap = ReturnType<typeof useBatchReportsStore.getState>["studyDetailsLoading"];

interface StudyDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudy: RelevanceStudy | null;
  studyDetails: StudyDetailsMap;
  studyDetailsLoading: StudyDetailsLoadingMap;
  onStudyDeselect: () => void;
  downloadingPdfs: Set<number>;
  downloadingSingle: Set<number>;
  onDownloadAllPdfs: (study: RelevanceStudy) => void;
  onDownloadSinglePdf: (report: any, studyShortName: string) => void;
}

export function StudyDetailSheet({
  isOpen,
  onOpenChange,
  selectedStudy,
  studyDetails,
  studyDetailsLoading,
  onStudyDeselect,
  downloadingPdfs,
  downloadingSingle,
  onDownloadAllPdfs,
  onDownloadSinglePdf,
}: StudyDetailSheetProps) {
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          onStudyDeselect();
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
              <StudyOverview
                study={getStudyForSheet(
                  selectedStudy,
                  studyDetails[selectedStudy.CRGStudyID]
                    ? {
                      studyInfo:
                        studyDetails[selectedStudy.CRGStudyID].studyInfo,
                    }
                    : undefined
                )}
              />

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
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {selectedStudy.reports.length}
                    </Badge>
                  </h3>
                  {selectedStudy.reports.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadAllPdfs(selectedStudy)}
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
                              onDownloadSinglePdf(
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
  );
}
