import { NextResponse } from "next/server";
import { getReportPdf } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

interface Params {
  params: {
    reportId: string;
  };
}

export async function GET(_: Request, context: Params) {
  const { reportId } = await context.params;

  if (!reportId) {
    return NextResponse.json(
      { error: "Missing report id." },
      { status: 400 }
    );
  }

  try {
    const headers = getMeerkatHeaders("application/pdf");
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
