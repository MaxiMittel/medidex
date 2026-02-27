export interface StudyReportSummary {
  reportId: number;
  title: string;
}

export interface Study{
  shortName: string;
  studyId: number;
  countries: string[];
  numberParticipants: string | null;
  duration: string | null;
  comparison: string | null;
  trialId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelevanceStudy {
  isLinked: boolean;
  relevance: number;
  study: Study;
  reports: StudyReportSummary[];
}
