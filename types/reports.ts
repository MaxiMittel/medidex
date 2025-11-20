export interface StudyReportSummary {
  CENTRALReportID: number | null;
  CRGReportID: number;
  Title: string;
}

export interface RelevanceStudy {
  Linked: boolean;
  CRGStudyID: number;
  Relevance: number;
  ShortName: string;
  NumberParticipants: string | number | null;
  Duration: string | null;
  Comparison: string | null;
  Countries?: string;
  StatusofStudy?: string;
  DateEntered?: string;
  DateEdited?: string;
  TrialistContactDetails?: string;
  CENTRALSubmissionStatus?: string;
  ISRCTN?: string;
  Notes?: string;
  UDef4?: string;
  reports: StudyReportSummary[];
}
