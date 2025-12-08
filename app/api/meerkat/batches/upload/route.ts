import { NextRequest, NextResponse } from "next/server";
import { uploadBatch } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file in upload request." },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    const batchHash = await uploadBatch(file, { headers });
    return NextResponse.json({ batchHash });
  } catch (error) {
    console.error("Unexpected error while uploading batch:", error);
    return NextResponse.json(
      { error: "Unexpected error while uploading batch." },
      { status: 500 }
    );
  }
}
