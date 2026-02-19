import { NextResponse } from "next/server";

const baseUrl = process.env.GENAI_API_URL;

export async function POST(request: Request) {
  console.log("POST evaluate");
  if (!baseUrl) {
    return NextResponse.json(
      { detail: "GENAI_API_URL is not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  console.log(body);
  const resp = await fetch(`${baseUrl}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  console.log(resp);

  if (!resp.ok) {
    const detail = await resp.text();
    return NextResponse.json({ detail }, { status: resp.status });
  }

  const data = await resp.json();
  return NextResponse.json(data);
}