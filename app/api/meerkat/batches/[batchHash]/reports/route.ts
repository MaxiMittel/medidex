import { NextRequest, NextResponse } from "next/server";
import { getBatchReports } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ batchHash: string }> }
) {
  const { batchHash } = await params;

  if (!batchHash) {
    return NextResponse.json(
      { error: "Missing batch hash." },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    const reports = await getBatchReports(batchHash, { headers });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Unexpected error while fetching batch reports:", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching batch reports." },
      { status: 500 }
    );
  }
}
