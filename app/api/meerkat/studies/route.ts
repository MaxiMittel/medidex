import { NextRequest, NextResponse } from "next/server";
import { createStudy, type CreateStudyPayload } from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

export async function PUT(request: NextRequest) {
  let body: Partial<CreateStudyPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const requiredFields: Array<keyof CreateStudyPayload> = [
    "short_name",
    "status_of_study",
    "central_submission_status",
    "comparison",
    "countries",
    "duration",
    "number_of_participants",
  ];

  const missing = requiredFields.filter((field) => {
    const value = body?.[field];
    if (field === "countries") {
      return !Array.isArray(value) || value.length === 0;
    }
    if (field === "number_of_participants") {
      return typeof value !== "number" || Number.isNaN(value);
    }
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const payload: CreateStudyPayload = {
    short_name: body.short_name!.trim(),
    status_of_study: body.status_of_study!.trim(),
    central_submission_status: body.central_submission_status!.trim(),
    comparison: body.comparison!.trim(),
    duration: body.duration!.trim(),
    countries: Array.isArray(body.countries)
      ? body.countries
          .map((country) => (typeof country === "string" ? country.trim() : ""))
          .filter(Boolean)
      : [],
    number_of_participants: Number(body.number_of_participants),
  };

  if (payload.countries.length === 0) {
    return NextResponse.json(
      { error: "countries must contain at least one entry." },
      { status: 400 }
    );
  }

  try {
    const headers = await getMeerkatHeaders();
    const createdStudy = await createStudy(payload, { headers });

    return NextResponse.json(createdStudy, { status: 200 });
  } catch (error) {
    console.error("Unexpected error while creating study:", error);
    return NextResponse.json(
      { error: "Unexpected error while creating study." },
      { status: 500 }
    );
  }
}
