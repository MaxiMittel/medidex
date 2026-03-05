"use client";

import * as React from "react";
import { UploadSection } from "./upload-section";
import { ProjectManagement, type ProjectManagementRef } from "./project-management";
import { useRef, useCallback } from "react";

export function UploadPageClient() {
  const projectManagementRef = useRef<ProjectManagementRef>(null);

  const handleUploadSuccess = useCallback((_projectId?: string) => {
    // Trigger reload of project management
    if (projectManagementRef.current) {
      projectManagementRef.current.reload();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
        <UploadSection onUploadSuccess={handleUploadSuccess} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Existing Projects</h2>
        <ProjectManagement ref={projectManagementRef} />
      </div>
    </div>
  );
}
