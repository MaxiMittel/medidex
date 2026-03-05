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
import type { ProjectDetailsDto } from "@/types/apiDTOs";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";

export interface ProjectManagementRef {
  reload: () => void;
}

export const ProjectManagement = forwardRef<ProjectManagementRef>((_, ref) => {
  const [projects, setProjects] = useState<ProjectDetailsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/meerkat/projects", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to load projects via proxy route."
        );
      }
      const projectList = (await response.json()) as ProjectDetailsDto[];
      setProjects(projectList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  // Expose reload function via ref
  useImperativeHandle(ref, () => ({
    reload: loadProjects,
  }));

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    try {
      const response = await fetch(`/api/meerkat/projects/${projectId}`, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(
          errorMessage || "Failed to delete project via proxy route."
        );
      }
      // Remove from local state
      setProjects((prev) => prev.filter((b) => b.projectId !== projectId));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingId(null);
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

  const getProgressPercentage = (project: ProjectDetailsDto) => {
    if (project.numberReportsTotal === 0) return 0;
    return Math.round((project.numberReportsReadyForReview / project.numberReportsTotal) * 100);
  };

  const isProcessing = (project: ProjectDetailsDto) => {
    return project.numberReportsReadyForReview < project.numberReportsTotal;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Management</CardTitle>
            <CardDescription>
              View and manage your projects
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadProjects}
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

        {loading && projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No projects found. Create a new project to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const progress = getProgressPercentage(project);
              const processing = isProcessing(project);

              return (
                <div
                  key={project.projectId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">
                          {project.name || "Untitled Project"}
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
                          <span>{project.numberReportsTotal} reports</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(project.createdAt)}</span>
                        </div>
                        <div className="text-xs">
                          Project Id:{" "}
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            {project.projectId}
                          </code>
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={deletingId === project.projectId}
                        >
                          {deletingId === project.projectId ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this project? This
                            will permanently delete the project and all its
                            associated reports, including calculated embedding
                            vectors. This action cannot be undone.
                            <br />
                            <br />
                            <strong>Project:</strong>{" "}
                            {project.name || "Untitled Project"}
                            <br />
                            <strong>Reports:</strong> {project.numberReportsTotal}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(project.projectId)}
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
                        {project.numberReportsPreProcessed} / {project.numberReportsTotal} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Ready: {project.numberReportsReadyForReview}</span>
                      <span>Processed: {project.numberReportsPreProcessed}</span>
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
