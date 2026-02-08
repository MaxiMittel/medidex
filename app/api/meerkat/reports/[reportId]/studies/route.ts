import { NextRequest, NextResponse } from "next/server";
import { getStudiesForReport, getReportsByStudyId } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import type { StudyReportSummary } from "@/types/reports";
import type { StudyDto } from "@/types/apiDTOs";

export interface AssignedStudyWithReports extends StudyDto {
  reports: StudyReportSummary[];
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
            CENTRALReportID: report.CENTRALReportID ?? null,
            CRGReportID: report.CRGReportID,
            Title: report.Title,
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
