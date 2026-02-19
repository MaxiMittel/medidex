import { NextResponse } from "next/server";

const baseUrl = process.env.GENAI_API_URL;

export async function POST(request: Request) {
  console.log("Fecth stream");
  if (!baseUrl) {
    return NextResponse.json(
      { detail: "GENAI_API_URL is not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();

  try {
    const upstreamResponse = await fetch(`${baseUrl}/evaluate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      const detail = await upstreamResponse.text();
      return NextResponse.json({ detail }, { status: upstreamResponse.status });
    }

    if (!upstreamResponse.body) {
      return NextResponse.json(
        { detail: "Upstream stream response missing body" },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstreamResponse.headers.get("Content-Type") || "text/event-stream"
    );
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to proxy stream" },
      { status: 502 }
    );
  }
}
