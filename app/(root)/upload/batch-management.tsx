"use client";

import * as React from "react";
import {
  Trash2,
  RefreshCw,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteBatchByHash, getBatches } from "@/lib/api/batchApi";
import { login } from "@/lib/api/authApi";
import apiClient from "@/lib/api/apiClient";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";
import type { BatchDto } from "@/types/apiDTOs";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";

export interface BatchManagementRef {
  reload: () => void;
}

export const BatchManagement = forwardRef<BatchManagementRef>((_, ref) => {
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingHash, setDeletingHash] = useState<string | null>(null);
  const { fetchBatches: refreshStoreBatches } = useBatchReportsStore();

  const ensureAuthenticated = async () => {
    const username = process.env.NEXT_PUBLIC_MEERKAT_USERNAME;
    const password = process.env.NEXT_PUBLIC_MEERKAT_PASSWORD;

    if (!username || !password) {
      throw new Error("Meerkat credentials are not configured.");
    }

    const token = await login(username, password);
    apiClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token.access_token}`;
  };

  const loadBatches = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAuthenticated();
      const batchList = await getBatches();
      setBatches(batchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  // Expose reload function via ref
  useImperativeHandle(ref, () => ({
    reload: loadBatches,
  }));

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const handleDelete = async (batchHash: string) => {
    setDeletingHash(batchHash);
    try {
      await ensureAuthenticated();
      await deleteBatchByHash(batchHash);
      // Remove from local state
      setBatches((prev) => prev.filter((b) => b.batch_hash !== batchHash));
      // Refresh store batches
      await refreshStoreBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete batch");
    } finally {
      setDeletingHash(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getProgressPercentage = (batch: BatchDto) => {
    if (batch.number_reports === 0) return 0;
    return Math.round((batch.embedded / batch.number_reports) * 100);
  };

  const isProcessing = (batch: BatchDto) => {
    return batch.embedded < batch.number_reports;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Batch Management</CardTitle>
            <CardDescription>
              View and manage your uploaded batches
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadBatches}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Loading batches...
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No batches found. Upload a batch to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => {
              const progress = getProgressPercentage(batch);
              const processing = isProcessing(batch);

              return (
                <div
                  key={batch.batch_hash}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">
                          {batch.batch_description || "Untitled Batch"}
                        </h3>
                        {processing ? (
                          <Badge variant="outline" className="bg-blue-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Processing
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{batch.number_reports} reports</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(batch.created_at)}</span>
                        </div>
                        <div className="text-xs">
                          Hash:{" "}
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            {batch.batch_hash}
                          </code>
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={deletingHash === batch.batch_hash}
                        >
                          {deletingHash === batch.batch_hash ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Batch</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this batch? This
                            will permanently delete the batch and all its
                            associated reports, including calculated embedding
                            vectors. This action cannot be undone.
                            <br />
                            <br />
                            <strong>Batch:</strong>{" "}
                            {batch.batch_description || "Untitled Batch"}
                            <br />
                            <strong>Reports:</strong> {batch.number_reports}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(batch.batch_hash)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Embedding Progress
                      </span>
                      <span className="font-medium">
                        {batch.embedded} / {batch.number_reports} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Assigned: {batch.assigned}</span>
                      <span>Embedded: {batch.embedded}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
