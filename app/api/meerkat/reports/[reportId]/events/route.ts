import { NextRequest, NextResponse } from "next/server";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export interface ReportEventPayload {
  timestamp: string;
  type: "start" | "end";
  last_interaction: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  if (!reportId) {
    return NextResponse.json(
      { error: "Missing report id." },
      { status: 400 }
    );
  }

  let body: ReportEventPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.timestamp) {
    return NextResponse.json(
      { error: "Missing required field: timestamp" },
      { status: 400 }
    );
  }

  if (!body.type || !["start", "end"].includes(body.type)) {
    return NextResponse.json(
      { error: "Missing or invalid required field: type (must be 'start' or 'end')" },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    
    // Forward the event to the Meerkat API
    const meerkatApiUrl = process.env.MEERKAT_API_URL;
    const response = await fetch(
      `${meerkatApiUrl}/api/reports/${reportId}/events`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp: body.timestamp,
          type: body.type,
          last_interaction: body.last_interaction,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Meerkat API error for report ${reportId} event:`,
        errorText
      );
      return NextResponse.json(
        { error: "Failed to record event in Meerkat API." },
        { status: response.status }
      );
    }

    // Return success - the backend handles everything else
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      `Unexpected error while recording event for report ${reportId}:`,
      error
    );
    return NextResponse.json(
      { error: "Unexpected error while recording event." },
      { status: 500 }
    );
  }
}
