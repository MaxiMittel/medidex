"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CheckCircle2, Sparkles, ArrowRight, Upload } from "lucide-react";
import Link from "next/link";
import type { BatchDto } from "@/types/apiDTOs";

interface BatchListProps {
  batches: BatchDto[];
}

export function BatchList({ batches }: BatchListProps) {
  const router = useRouter();
  const { selectBatch, setBatches } = useBatchReportsStore();

  // Hydrate the store with server-fetched batches
  useEffect(() => {
    if (batches.length > 0) {
      setBatches(batches);
    }
  }, [batches, setBatches]);

  const handleBatchClick = (batchHash: string) => {
    selectBatch(batchHash);
    router.push(`/reports?batch=${batchHash}`);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return formatDate(dateString);
    } catch {
      return formatDate(dateString);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-muted-foreground/20 bg-muted/30">
        <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-5 rounded-full">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No batches yet</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Upload your first batch to start analyzing reports and discovering study connections.
        </p>
        <Button asChild>
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Your First Batch
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch, index) => {
        const progress =
          batch.number_reports > 0
            ? Math.round((batch.assigned / batch.number_reports) * 100)
            : 0;
        const isFullyAssigned = progress === 100 && batch.number_reports > 0;

        return (
          <button
            key={batch.batch_hash}
            onClick={() => handleBatchClick(batch.batch_hash)}
            className="group relative text-left bg-card border p-5 transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Progress indicator bar at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted overflow-hidden">
              <div
                className="h-full bg-primary/60 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {batch.batch_description}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {getRelativeTime(batch.created_at)}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="gap-1 text-xs">
                <FileText className="w-3 h-3" />
                {batch.number_reports} report{batch.number_reports !== 1 ? "s" : ""}
              </Badge>
              {batch.embedded > 0 && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Sparkles className="w-3 h-3" />
                  {batch.embedded} preprocessed
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
              {isFullyAssigned ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded-full flex items-center justify-center">
                  {progress > 0 && (
                    <div className="w-2 h-2 bg-primary/50 rounded-full" />
                  )}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {batch.assigned} / {batch.number_reports} assigned
                {isFullyAssigned && (
                  <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    · Complete
                  </span>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

