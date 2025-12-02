import { NextRequest, NextResponse } from "next/server";
import { getReportData } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function GET(
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
    const report = await getReportData(
      batchHash,
      Number(reportIndex),
      {
        headers,
      }
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error(
      "Unexpected error while fetching Meerkat report:",
      error
    );
    return NextResponse.json(
      { error: "Unexpected error while fetching report." },
      { status: 500 }
    );
  }
}
