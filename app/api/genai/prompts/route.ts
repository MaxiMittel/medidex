import { NextResponse } from "next/server";

const baseUrl = process.env.GENAI_API_URL;

export async function GET() {
  if (!baseUrl) {
    return NextResponse.json(
      { detail: "GENAI_API_URL is not configured" },
      { status: 500 }
    );
  }

  console.log("Fetch reports");

  const resp = await fetch(`${baseUrl}/prompts`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!resp.ok) {
    const detail = await resp.text();
    return NextResponse.json({ detail }, { status: resp.status });
  }

  const data = await resp.json();
  return NextResponse.json(data);
}