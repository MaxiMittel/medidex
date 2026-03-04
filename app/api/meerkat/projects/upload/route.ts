import { NextRequest, NextResponse } from "next/server";
import { createProject } from "@/lib/api/projectApi";
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
    const projectId = await createProject(file, { headers });
    return NextResponse.json({ projectId });
  } catch (error) {
    console.error("Unexpected error while creating project:", error);
    return NextResponse.json(
      { error: "Unexpected error while creating project." },
      { status: 500 }
    );
  }
}
