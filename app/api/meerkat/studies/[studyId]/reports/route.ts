import { NextRequest, NextResponse } from "next/server";
import { getReportsByStudyId } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import type { StudyReportSummary } from "@/types/reports";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  const { studyId } = await params;

  if (!studyId) {
    return NextResponse.json(
      { error: "Missing study id." },
      { status: 400 }
    );
  }

  const id = Number(studyId);
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid study id." },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    const reports = await getReportsByStudyId(id, undefined, { headers });

    const summaries: StudyReportSummary[] = reports.map((report) => ({
      reportId: report.reportId,
      title: report.title,
    }));

    return NextResponse.json(summaries);
  } catch (error) {
    console.error(`Unexpected error while fetching reports for study ${studyId}:`, error);
    return NextResponse.json(
      { error: "Unexpected error while fetching study reports." },
      { status: 500 }
    );
  }
}
