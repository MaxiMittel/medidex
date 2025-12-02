import { NextResponse } from "next/server";
import { getBatches } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function GET() {
  try {
    const headers = getMeerkatHeaders();
    const batches = await getBatches({
      headers,
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error("Unexpected error while fetching Meerkat batches:", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching batches." },
      { status: 500 }
    );
  }
}
