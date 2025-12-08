import { NextRequest, NextResponse } from "next/server";
import { getStudiesForReport } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

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
    const headers = getMeerkatHeaders();
    const studies = await getStudiesForReport(Number(reportId), {
      date_from: date_from || undefined,
      date_to: date_to || undefined,
    }, { headers });

    return NextResponse.json(studies);
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
