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

export interface StudyDetailData {
  studyInfo: {
    StatusofStudy: string | null;
    NumberParticipants: string | null;
    TrialistContactDetails: string | null;
    Countries: string | null;
    CENTRALSubmissionStatus: string | null;
    Duration: string | null;
    Notes: string | null;
    UDef4: string | null;
    CRGStudyID: number;
    DateEntered: string | null;
    Comparison: string | null;
    CENTRALStudyID: number;
    DateToCENTRAL: string | null;
    ISRCTN: string | null;
    ShortName: string;
    DateEdited: string | null;
    UDef6: string | null;
    Search_Tagged: boolean;
    TrialRegistrationID: string | null;
  };
  interventions: Array<{
    id: number;
    description: string;
  }>;
  conditions: Array<{
    id: number;
    description: string;
  }>;
  outcomes: Array<{
    id: number;
    description: string;
  }>;
  design: string[];
}
