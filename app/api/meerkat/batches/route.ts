import { NextResponse } from "next/server";
import { login } from "@/lib/api/authApi";
import apiClient from "@/lib/api/apiClient";
import { getBatches, getReportData } from "@/lib/api/batchApi";
import type { ReportDetailDto } from "@/types/apiDTOs";

export async function GET() {
  const username = process.env.MEERKAT_USERNAME;
  const password = process.env.MEERKAT_PASSWORD;

  if (!username || !password) {
    return NextResponse.json(
      { error: "MEERKAT credentials are not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const token = await login(username, password);
    apiClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token.access_token}`;

    const batches = await getBatches();
    const reportsByBatch: Record<string, ReportDetailDto[]> = {};

    for (const batch of batches) {
      if (!batch.number_reports || batch.number_reports <= 0) {
        reportsByBatch[batch.batch_hash] = [];
        continue;
      }

      const reportPromises = Array.from(
        { length: batch.number_reports },
        (_, reportIndex) => getReportData(batch.batch_hash, reportIndex)
      );

      reportsByBatch[batch.batch_hash] = await Promise.all(reportPromises);
    }

    return NextResponse.json({ batches, reportsByBatch });
  } catch (error) {
    console.error("Failed to fetch Meerkat data:", error);
    return NextResponse.json(
      { error: "Unable to fetch Meerkat batches." },
      { status: 500 }
    );
  }
}
