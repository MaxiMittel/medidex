import { NextRequest, NextResponse } from "next/server";
import { deleteBatchByHash } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function DELETE(
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
    const headers = getMeerkatHeaders();
    await deleteBatchByHash(batchHash, { headers });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error while deleting batch:", error);
    return NextResponse.json(
      { error: "Unexpected error while deleting batch." },
      { status: 500 }
    );
  }
}
