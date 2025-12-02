"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  batchHash?: string;
}

interface UploadSectionProps {
  onUploadSuccess?: () => void;
}

export function UploadSection(props: UploadSectionProps) {
  const { onUploadSuccess } = props;
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fetchBatches } = useBatchReportsStore();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);

      // Start uploading each file
      newFiles.forEach((uploadFile) => {
        void uploadFileToServer(uploadFile);
      });
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFileToServer = async (uploadFile: UploadFile) => {
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "uploading", progress: 10 }
            : f
        )
      );

      // Simulate progress (since we don't have real upload progress from axios)
      progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (
              f.id === uploadFile.id &&
              f.status === "uploading" &&
              f.progress < 90
            ) {
              return { ...f, progress: Math.min(f.progress + 10, 90) };
            }
            return f;
          })
        );
      }, 200);

      // Upload the file
      const formData = new FormData();
      formData.append("file", uploadFile.file, uploadFile.file.name);

      const response = await fetch("/api/meerkat/batches/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Failed to upload batch via proxy route.");
      }

      const { batchHash } = (await response.json()) as { batchHash: string };

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Update to completed
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "completed", progress: 100, batchHash }
            : f
        )
      );

      // Refresh batches list
      await fetchBatches();

      // Trigger callback to reload batch management
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      // Clear progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      let errorMessage = "Failed to upload file";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Try to extract error message from various error formats
        const errorObj = error as any;
        if (errorObj.response?.data?.detail) {
          errorMessage =
            typeof errorObj.response.data.detail === "string"
              ? errorObj.response.data.detail
              : JSON.stringify(errorObj.response.data.detail);
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error",
                error: errorMessage,
              }
            : f
        )
      );
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "uploading":
        return "bg-blue-500";
      case "pending":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "uploading":
        return "Uploading";
      case "pending":
        return "Pending";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const risFiles = Array.from(droppedFiles).filter((file) =>
        file.name.toLowerCase().endsWith(".ris")
      );

      if (risFiles.length === 0) {
        return;
      }

      const newFiles: UploadFile[] = risFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);

      // Start uploading each file
      newFiles.forEach((uploadFile) => {
        void uploadFileToServer(uploadFile);
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-900 dark:border-gray-600 dark:hover:border-gray-500"
        }`}
        onClick={handleUploadClick}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            RIS files only
          </p>
        </div>
        <input
          ref={fileInputRef}
          id="dropzone-file"
          type="file"
          className="hidden"
          accept=".ris"
          multiple
          onChange={handleFileChange}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Upload Queue</h3>
          {files.map((file) => (
            <div key={file.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <FileText className="w-5 h-5 mt-0.5 shrink-0 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                    {file.batchHash && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Batch: {file.batchHash}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={getStatusColor(file.status)}>
                    {getStatusLabel(file.status)}
                  </Badge>
                  {file.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {file.status === "uploading" && (
                <div className="space-y-1">
                  <Progress value={file.progress} className="h-2" />
                  <p className="text-xs text-gray-500 text-right">
                    {file.progress}%
                  </p>
                </div>
              )}
              {file.status === "error" && file.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Upload failed</AlertTitle>
                  <AlertDescription>{file.error}</AlertDescription>
                </Alert>
              )}
              {file.status === "completed" && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Upload successful</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
