"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AddStudyDialog } from "./add-study-dialog";

interface StudyRelevanceHeaderProps {
  filteredCount: number;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentBatchHash?: string;
  currentReportIndex?: number;
  currentReportCRGId?: number;
  isRunning: boolean;
  canStartEvaluation: boolean;
  filteredStudiesEmpty: boolean;
  onAiDialogOpen: () => void;
  hasEvaluated: boolean;
  hasStreamMessages: boolean;
  onHistoryDialogOpen: () => void;
  shouldHighlightSuggestion: boolean;
  suggestionKey: string | null;
  onSuggestionDismiss: () => void;
}

export function StudyRelevanceHeader({
  filteredCount,
  totalCount,
  searchQuery,
  onSearchChange,
  currentBatchHash,
  currentReportIndex,
  currentReportCRGId,
  isRunning,
  canStartEvaluation,
  filteredStudiesEmpty,
  onAiDialogOpen,
  hasEvaluated,
  hasStreamMessages,
  onHistoryDialogOpen,
  shouldHighlightSuggestion,
  suggestionKey,
  onSuggestionDismiss,
}: StudyRelevanceHeaderProps) {
  return (
    <div className="shrink-0 space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Relevant Studies</h2>
          <Badge variant="secondary" className="text-xs font-normal">
            {filteredCount}
            {searchQuery && ` of ${totalCount}`}
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
                  onClick={onAiDialogOpen}
                  disabled={isRunning || filteredStudiesEmpty}
                >
                  {isRunning ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  AI Match
                </Button>
                {hasEvaluated && hasStreamMessages && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-2"
                    onClick={onHistoryDialogOpen}
                  >
                    Show Step History
                  </Button>
                )}
                <AddStudyDialog
                  currentBatchHash={currentBatchHash}
                  currentReportIndex={currentReportIndex}
                  currentReportCRGId={currentReportCRGId}
                  highlight={shouldHighlightSuggestion}
                  onStudySaved={() => {
                    if (suggestionKey) {
                      onSuggestionDismiss();
                    }
                  }}
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
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
