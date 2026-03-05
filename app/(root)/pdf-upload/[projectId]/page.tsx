import axios from "axios";
import { notFound } from "next/navigation";
import { adminGuard } from "@/guards/role.guard";
import { ReportColumnClient } from "../report-column-client";
import type { ReportDetailDto } from "@/types/apiDTOs";
import { getProjectReports as fetchProjectReports } from "@/lib/api/projectApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

interface PdfUploadPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

async function loadProjectReports(projectId: string): Promise<ReportDetailDto[]> {
  const headers = await getMeerkatHeaders();

  try {
    const reports = await fetchProjectReports(projectId, false, { headers });
    return reports ?? [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }

    throw new Error("Failed to load project reports.");
  }
}

export default async function PdfUploadPage({ params }: PdfUploadPageProps) {
  await adminGuard();

  const resolvedParams = await params;
  const projectId = resolvedParams?.projectId;

  if (!projectId) {
    notFound();
  }

  const reports = await loadProjectReports(projectId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="border-b border-border/70 bg-card/40 px-4 py-5 md:px-8">
        <div className="space-y-2">
          <p className="text-xs uppercase font-semibold tracking-wide text-muted-foreground">
            PDF Upload
          </p>
          <div>
            <h1 className="text-2xl font-semibold">Project {projectId}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a report to manage its PDF status before continuing the review pipeline.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 bg-background">
        <ReportColumnClient projectId={projectId} reports={reports}>
          <PdfUploadPlaceholder />
        </ReportColumnClient>
      </div>
    </div>
  );
}

function PdfUploadPlaceholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-3">
      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-semibold text-foreground">Select a report</h2>
        <p className="text-sm text-muted-foreground">
          Choose a report from the list to view its metadata, attach PDFs, or confirm that uploads are complete.
        </p>
      </div>
    </div>
  );
}
