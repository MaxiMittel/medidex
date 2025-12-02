import { NextResponse } from "next/server";
import { getReportData } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

interface Params {
  params: {
    batchHash: string;
    reportIndex: string;
  };
}

export async function GET(_: Request, context: Params) {
  const { batchHash, reportIndex } = await context.params;

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
