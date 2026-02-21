import { NextRequest, NextResponse } from "next/server";

const meerkatApiUrl = process.env.MEERKAT_API_URL;

const DEFAULT_SOURCES = "meerkat";
const DEFAULT_K = "10";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  if (!name) {
    return NextResponse.json(
      { error: "Intervention name is required" },
      { status: 400 }
    );
  }

  const targetUrl = new URL(
    `${meerkatApiUrl}/interventions/${encodeURIComponent(name)}/similar_tags`
  );

  const { searchParams } = request.nextUrl;
  targetUrl.searchParams.set(
    "sources",
    searchParams.get("sources") ?? DEFAULT_SOURCES
  );
  targetUrl.searchParams.set("k", searchParams.get("k") ?? DEFAULT_K);

  try {
    const externalResponse = await fetch(targetUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const payload = await externalResponse.json();

    if (!externalResponse.ok) {
      return NextResponse.json(
        { error: payload?.detail ?? "Failed to fetch similar tags" },
        {
          status: externalResponse.status,
        }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error while calling similar_tags",
      },
      { status: 502 }
    );
  }
}