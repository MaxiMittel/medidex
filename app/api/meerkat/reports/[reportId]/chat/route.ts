import { NextRequest, NextResponse } from "next/server";
import { getReportChat } from "@/lib/api/reportApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  if (!reportId) {
    return NextResponse.json({ error: "Missing report id." }, { status: 400 });
  }

  const id = Number(reportId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid report id." }, { status: 400 });
  }

  try {
    const headers = await getMeerkatHeaders();
    const chat = await getReportChat(id, { headers });

    return NextResponse.json(chat);
  } catch (error) {
    console.error(`Unexpected error while fetching chat for report ${reportId}:`, error);
    return NextResponse.json(
      { error: "Unexpected error while fetching report chat." },
      { status: 500 }
    );
  }
}
