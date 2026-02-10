import type { RelevanceStudy } from "@/types/reports";

export function getRelevanceColor(relevance: number): string {
  if (relevance >= 0.9) return "bg-emerald-500";
  if (relevance >= 0.7) return "bg-blue-500";
  if (relevance >= 0.5) return "bg-amber-500";
  return "bg-orange-500";
}

export function getRelevanceBadgeStyle(relevance: number): string {
  if (relevance >= 0.9)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
  if (relevance >= 0.7)
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400";
  if (relevance >= 0.5)
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
  return "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400";
}

/**
 * Convert a RelevanceStudy to the format expected by StudyOverview.
 */
export function getStudyForSheet(
  study: RelevanceStudy,
  details?: {
    studyInfo: {
      DateEntered?: string | null;
      DateEdited?: string | null;
      TrialRegistrationID?: string | null;
      CENTRALStudyID?: number | null;
    };
  }
) {
  const numberParticipants = study.NumberParticipants;
  const formattedParticipants =
    numberParticipants === null || numberParticipants === undefined
      ? "-"
      : typeof numberParticipants === "number"
        ? numberParticipants.toString()
        : numberParticipants;

  return {
    ShortName: study.ShortName,
    StatusofStudy: study.StatusofStudy || "Unknown",
    CENTRALSubmissionStatus: study.CENTRALSubmissionStatus || "Unknown",
    TrialistContactDetails: study.TrialistContactDetails || "",
    NumberParticipants: formattedParticipants,
    Countries: study.Countries || "",
    Duration: study.Duration || "",
    Comparison: study.Comparison || "",
    ISRCTN: study.ISRCTN || "",
    Notes: study.Notes || "",
    UDef4: study.UDef4 || "",
    DateEntered: details?.studyInfo.DateEntered || study.DateEntered,
    DateEdited: details?.studyInfo.DateEdited || study.DateEdited,
    TrialRegistrationID: details?.studyInfo.TrialRegistrationID || undefined,
    CENTRALStudyID: details?.studyInfo.CENTRALStudyID ?? undefined,
    CRGStudyID: study.CRGStudyID,
  };
}
