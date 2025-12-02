import { NextRequest, NextResponse } from "next/server";
import { assignStudiesToReport, removeStudiesFromReport } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function PUT(
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
    const headers = getMeerkatHeaders();
    await assignStudiesToReport(batchHash, Number(reportIndex), studyIds, {
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
  { params }: { params: Promise<{ batchHash: string; reportIndex: string }> }
) {
  const { batchHash, reportIndex } = await params;

  if (!batchHash || typeof reportIndex === "undefined") {
    return NextResponse.json(
      { error: "Missing batch hash or report index." },
      { status: 400 }
    );
  }

  try {
    const headers = getMeerkatHeaders();
    await removeStudiesFromReport(batchHash, Number(reportIndex), { headers });

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
