"use client";

import * as React from "react";
import { UploadSection } from "./upload-section";
import { BatchManagement, type BatchManagementRef } from "./batch-management";
import { useRef, useCallback } from "react";

export function UploadPageClient() {
  const batchManagementRef = useRef<BatchManagementRef>(null);

  const handleUploadSuccess = useCallback(() => {
    // Trigger reload of batch management
    if (batchManagementRef.current) {
      batchManagementRef.current.reload();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Upload New Batch</h2>
        <UploadSection onUploadSuccess={handleUploadSuccess} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Existing Batches</h2>
        <BatchManagement ref={batchManagementRef} />
      </div>
    </div>
  );
}
