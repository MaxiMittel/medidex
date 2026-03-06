"use client";

import { useState, useCallback, useRef, useEffect, use } from "react";
import Link from "next/link";
import {
  UploadSection,
  type UploadSectionHandle,
  type UploadSectionSnapshot,
} from "@/app/(root)/upload/upload-section";
import { Button } from "@/components/ui/button";
import { ReportSourcesDto } from "@/types/apiDTOs";

import {
  Upload
} from "lucide-react";

interface PdfPageProps {
  params: Promise<{
    projectId: string;
    reportId: string;
  }>;
}

export default function PdfDetailsPage({ params }: PdfPageProps) {
  const { projectId, reportId } = use(params);

  const uploadSectionRef = useRef<UploadSectionHandle>(null);

  const [uploadSnapshot, setUploadSnapshot] =
    useState<UploadSectionSnapshot>({ hasFile: false, status: null });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [links, setLinks] = useState<ReportSourcesDto | null>(null);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLinks() {
      setLinksLoading(true);
      setLinksError(null);

      try {
        const res = await fetch(`/api/meerkat/reports/${reportId}/sources`);
        if (!res.ok) throw new Error("Failed to fetch links");

        const data = await res.json();
        setLinks(data);
      } catch (err: any) {
        setLinksError(err.message || "Error fetching links");
      } finally {
        setLinksLoading(false);
      }
    }

    fetchLinks();
  }, [reportId]);

  const buildFormData = useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("reportId", reportId);
      formData.append("file", file, file.name);
      return formData;
    },
    [projectId, reportId]
  );

  const handleUploadSuccess = useCallback(() => {
    setSuccessMessage("PDF uploaded successfully.");
  }, []);

  const canUpload = uploadSnapshot.hasFile;
  const isUploadDisabled =
    !canUpload || uploadSnapshot.status === "uploading";

  const handleUpload = useCallback(() => {
    uploadSectionRef.current?.triggerUpload();
  }, []);

  return (
    <div className="pt-4">
      <div className="px-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Upload PDF</h2>
          {linksLoading ? (
            <span className="text-muted-foreground">Loading doi...</span>
          ) : linksError ? (
            <span className="text-red-600 dark:text-red-400">{linksError}</span>
          ) : links?.doi === "undefined" ? (
            <span className="text-muted-foreground">No doi found for this report.</span>
          ) : (
            <a target="_blank" href={`https://www.doi.org/${links?.doi}`} className="truncate max-w-xs" style={{ display: 'inline-block', verticalAlign: 'middle', color: 'inherit', textDecoration: 'none' }}>{links?.doi}</a>
          )}
        </div>
      </div>

      <div className="mb-3 p-4">
        
        <h4 className="text-lg font-semibold mb-1">Fulltext Links</h4>

        {linksLoading ? (
          <div className="text-muted-foreground">Loading links...</div>
        ) : linksError ? (
          <div className="text-red-600 dark:text-red-400">{linksError}</div>
        ) : links?.links.length === 0 ? (
          <div className="text-muted-foreground">
            No links found for this report.
          </div>
        ) : (
          <div>
            {links?.links.map((link, idx) => (
              <div key={link + idx}>
                <Link
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate"
                  title={link}
                  style={{ maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: 'inherit', textDecoration: 'none', display: 'inline-block', verticalAlign: 'middle' }}
                >
                  {link}
                </Link>
              </div>
            ))}
          </div>
        )}

    <div className="pt-4">
      <UploadSection
        ref={uploadSectionRef}
        onUploadSuccess={handleUploadSuccess}
        buildFormData={buildFormData}
        disabled={false}
        emptyQueueMessage="Uploaded PDFs will appear here."
        autoStart={false}
        onStateChange={setUploadSnapshot}
        allowedFileExtension=".pdf"
      />
      </div>

      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={isUploadDisabled}
        >
          Upload PDF
        </Button>
      </div>

      {successMessage && (
        <div className="mt-2 text-green-600 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {/* PDF Preview Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">PDF Preview</h2>
        <iframe
          src={`/api/meerkat/reports/${reportId}/pdf`}
          title="PDF Preview"
          width="100%"
          height="380px"
          style={{ border: "1px solid #ccc", borderRadius: "8px" }}
        />
      </div>
    </div>
  </div>
  );
}
