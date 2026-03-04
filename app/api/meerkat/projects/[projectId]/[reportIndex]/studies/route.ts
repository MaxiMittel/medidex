import { NextRequest, NextResponse } from "next/server";
import { assignStudiesToReport, removeStudiesFromReport } from "@/lib/api/projectApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; reportIndex: string }> }
) {
  const { projectId, reportIndex } = await params;

  if (!projectId || typeof reportIndex === "undefined") {
    return NextResponse.json(
      { error: "Missing project id or report index." },
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
    await assignStudiesToReport(projectId, Number(reportIndex), studyIds, {
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
  { params }: { params: Promise<{ projectId: string; reportIndex: string }> }
) {
  const { projectId, reportIndex } = await params;

  if (!projectId || typeof reportIndex === "undefined") {
    return NextResponse.json(
      { error: "Missing project id or report index." },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    await removeStudiesFromReport(projectId, Number(reportIndex), { headers });

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
