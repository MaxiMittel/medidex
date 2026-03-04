import { NextResponse } from "next/server";
import { getProjects } from "@/lib/api/projectApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function GET() {
  try {
    const headers = await getMeerkatHeaders();
    const projects = await getProjects({
      headers,
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Unexpected error while fetching Meerkat projects:", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching projects." },
      { status: 500 }
    );
  }
}
