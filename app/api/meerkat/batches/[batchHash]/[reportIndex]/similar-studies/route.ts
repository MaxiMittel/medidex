import { NextRequest, NextResponse } from "next/server";
import { getSimilarStudies } from "@/lib/api/batchApi";
import { getReportsByStudyId } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import type { RelevanceStudy, StudyReportSummary } from "@/types/reports";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchHash: string; reportIndex: string }> }
) {
  const { batchHash, reportIndex } = await params;
  if (!batchHash || typeof reportIndex === "undefined") {
    return NextResponse.json(
      { error: "Missing batch hash or report index." },
      { status: 400 }
    );
  }

  // Parse assignedStudyIds from query (?assignedStudyIds=1,2,3)
  const url = new URL(request.url);
  const assignedIdsParam = url.searchParams.get("assignedStudyIds");
  const assignedStudyIds =
    assignedIdsParam?.split(",").map((id) => Number(id)).filter(Boolean) ?? [];

  try {
    const headers = getMeerkatHeaders();
    const similar = await getSimilarStudies(
      batchHash,
      Number(reportIndex),
      { return_details: true },
      { headers }
    );

    const studies: RelevanceStudy[] = await Promise.all(
      similar.CRGStudyID.map(async (studyId, idx) => {
        let relatedReports: StudyReportSummary[] = [];
        try {
          const reports = await getReportsByStudyId(studyId, undefined, {
            headers,
          });
          relatedReports = reports.map((report) => ({
            CENTRALReportID: report.CENTRALReportID ?? null,
            CRGReportID: report.CRGReportID,
            Title: report.Title,
          }));
        } catch (error) {
          console.error(
            `Failed fetching reports for study ${studyId}`,
            error
          );
        }

        return {
          Linked: assignedStudyIds.includes(studyId),
          CRGStudyID: studyId,
          Relevance: Number(similar.Relevance[idx] ?? 0),
          ShortName: similar.ShortName[idx] ?? "",
          NumberParticipants: similar.NumberParticipants[idx] ?? null,
          Duration: similar.Duration[idx] ?? null,
          Comparison: similar.Comparison[idx] ?? null,
          Countries: similar.Countries[idx] ?? "",
          StatusofStudy: similar.StatusofStudy[idx] ?? "",
          DateEntered: similar.DateEntered[idx] ?? "",
          DateEdited: similar.DateEdited[idx] ?? "",
          reports: relatedReports,
        } satisfies RelevanceStudy;
      })
    );

    return NextResponse.json(studies);
  } catch (error) {
    console.error(
      "Unexpected error while fetching similar studies:",
      error
    );
    return NextResponse.json(
      { error: "Unexpected error while fetching similar studies." },
      { status: 500 }
    );
  }
}
