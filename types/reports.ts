import { StudyDto } from "./apiDTOs";

export interface StudyReportSummary {
  reportId: number;
  title: string;
}

export interface RelevanceStudy {
  isLinked: boolean;
  relevance: number;
  study: StudyDto;
}
