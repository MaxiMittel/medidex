import { NextRequest, NextResponse } from "next/server";
import { getStudiesForReport, getReportsByStudyId } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import type { StudyReportSummary } from "@/types/reports";
import type { StudyDto } from "@/types/apiDTOs";
import { assignStudiesToReportByReportId, removeStudiesFromReportByReportId } from "@/lib/api/batchApi";

export interface AssignedStudyWithReports extends StudyDto {
  reports: StudyReportSummary[];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  if (typeof reportId === "undefined") {
    return NextResponse.json(
      { error: "Missing batch hash or report index." },
      { status: 400 }
    );
  }

  let studyIds: number[] = [];
  try {
    const body = await request.json();
    studyIds = Array.isArray(body?.study_ids)
      ? body.study_ids.map((id: unknown) => Number(id)).filter(Boolean)
      : [];
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (studyIds.length === 0) {
    return NextResponse.json(
      { error: "study_ids must be a non-empty array." },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    await assignStudiesToReportByReportId(Number(reportId), studyIds, {
      headers,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Unexpected error while assigning studies to report:",
      error
    );
    return NextResponse.json(
      { error: "Unexpected error while assigning studies to report." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const {reportId } = await params;

  if (typeof reportId === "undefined") {
    return NextResponse.json(
      { error: "Missing batch hash or report index." },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    await removeStudiesFromReportByReportId(Number(reportId), { headers });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Unexpected error while removing studies from report:",
      error
    );
    return NextResponse.json(
      { error: "Unexpected error while removing studies from report." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  if (!reportId) {
    return NextResponse.json(
      { error: "Missing report id." },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");

  try {
    const headers = await getMeerkatHeaders();
    const studies = await getStudiesForReport(Number(reportId), {
      date_from: date_from || undefined,
      date_to: date_to || undefined,
    }, { headers });

    // Enrich each study with its associated reports
    const enriched: AssignedStudyWithReports[] = await Promise.all(
      studies.map(async (study) => {
        let relatedReports: StudyReportSummary[] = [];
        try {
          const reports = await getReportsByStudyId(study.CRGStudyID, undefined, {
            headers,
          });
          relatedReports = reports.map((report) => ({
            reportId: report.reportId,
            title: report.title,
          }));
        } catch (error) {
          console.error(
            `Failed fetching reports for study ${study.CRGStudyID}`,
            error
          );
        }

        return {
          ...study,
          reports: relatedReports,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error(
      `Unexpected error while fetching studies for report ${reportId}:`,
      error
    );
    return NextResponse.json(
      { error: "Unexpected error while fetching studies for report." },
      { status: 500 }
    );
  }
}
