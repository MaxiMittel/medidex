import { NextResponse } from "next/server";
import {
  getStudies,
  getInterventionsForStudy,
  getConditionsForStudy,
  getOutcomesForStudy,
  getDesignForStudy,
} from "@/lib/api/studiesApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

interface Params {
  params: {
    studyId: string;
  };
}

export async function GET(_: Request, context: Params) {
  const { studyId } = await context.params;

  if (!studyId) {
    return NextResponse.json(
      { error: "Missing study id." },
      { status: 400 }
    );
  }

  try {
    const headers = getMeerkatHeaders();
    const id = Number(studyId);

    const [studyInfoArray, interventions, conditions, outcomes, design] =
      await Promise.all([
        getStudies([id], { headers }),
        getInterventionsForStudy(id, { headers }),
        getConditionsForStudy(id, { headers }),
        getOutcomesForStudy(id, { headers }),
        getDesignForStudy(id, { headers }),
      ]);

    const studyInfo = studyInfoArray[0];

    if (!studyInfo) {
      return NextResponse.json(
        { error: `Study ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      studyInfo,
      interventions,
      conditions,
      outcomes,
      design,
    });
  } catch (error) {
    console.error(
      "Unexpected error while fetching study details:",
      error
    );
    return NextResponse.json(
      { error: "Unexpected error while fetching study details." },
      { status: 500 }
    );
  }
}
