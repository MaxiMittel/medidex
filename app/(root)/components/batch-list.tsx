"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, CheckCircle2, Clock } from "lucide-react";
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
    router.push("/reports");
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

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No batches available</h2>
        <p className="text-muted-foreground max-w-md">
          Upload a batch to get started with report analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch) => {
        const progress =
          batch.number_reports > 0
            ? Math.round((batch.assigned / batch.number_reports) * 100)
            : 0;
        const isFullyAssigned = progress === 100 && batch.number_reports > 0;

        return (
          <Card
            key={batch.batch_hash}
            onClick={() => handleBatchClick(batch.batch_hash)}
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md group"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                {batch.batch_description}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(batch.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="w-3 h-3" />
                  {batch.number_reports} report
                  {batch.number_reports !== 1 ? "s" : ""}
                </Badge>
                {batch.embedded > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {batch.embedded} embedded
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {isFullyAssigned ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded-full" />
                )}
                <span className="text-muted-foreground">
                  {batch.assigned} / {batch.number_reports} assigned
                </span>
              </div>
              <div className="h-1.5 w-16 bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

