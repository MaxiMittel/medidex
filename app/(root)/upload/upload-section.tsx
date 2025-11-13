"use client";

import * as React from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface UploadFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
}

export function UploadSection() {
  const [files, setFiles] = React.useState<UploadFile[]>([
    // Placeholder data for design evaluation
    {
      id: "1",
      name: "cardiac_studies_2024.ris",
      size: 2456789,
      progress: 100,
      status: "completed",
    },
    {
      id: "2",
      name: "oncology_research.ris",
      size: 1234567,
      progress: 65,
      status: "processing",
    },
    {
      id: "3",
      name: "neurological_trials.ris",
      size: 3456789,
      progress: 30,
      status: "uploading",
    },
  ]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      // Handle file upload logic here
      console.log("Selected files:", selectedFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((file) => file.id !== id));
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
      case "processing":
        return "bg-blue-500";
      case "uploading":
        return "bg-orange-500";
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
      case "processing":
        return "Processing";
      case "uploading":
        return "Uploading";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-900 dark:border-gray-600 dark:hover:border-gray-500"
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
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Upload Queue</h3>
          {files.map((file) => (
            <div key={file.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <FileText className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={getStatusColor(file.status)}>
                    {getStatusLabel(file.status)}
                  </Badge>
                  {file.status !== "processing" &&
                    file.status !== "uploading" && (
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
              {(file.status === "uploading" ||
                file.status === "processing") && (
                <div className="space-y-1">
                  <Progress value={file.progress} className="h-2" />
                  <p className="text-xs text-gray-500 text-right">
                    {file.progress}%
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
