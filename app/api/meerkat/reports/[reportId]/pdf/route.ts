import { NextRequest, NextResponse } from "next/server";
import { getReportPdf } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  if (!reportId) {
    return NextResponse.json({ error: "Missing report id." }, { status: 400 });
  }

  try {
    const headers = await getMeerkatHeaders("application/pdf");
    const pdfBuffer = await getReportPdf(Number(reportId), {
      headers,
      responseType: "arraybuffer",
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("Unexpected error while fetching report PDF:", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching report PDF." },
      { status: 500 }
    );
  }
}
