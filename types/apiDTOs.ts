export interface TokenDto {
  access_token: string;
  token_type: string;
}

export interface BatchDto {
  batch_hash: string;
  batch_description: string;
  number_reports: number;
  created_at: string;
  embedded: number;
  assigned: number;
}

export interface VectorDto {
  model_id: string;
  embedding: number[];
  author_embedding: number[];
  participants: number[];
  intervention: number[];
  condition: number[];
  outcome: number[];
}

export interface ReportDetailDto {
  title: string;
  abstract: string | null;
  crgreportid: number;
  authors: string[];
  trial_id: string | null;
  vectors: VectorDto;
  assigned_studies: number[];
  year: number | null;
}

export interface SimilarTagDto {
  id: string;
  keywords: string;
  distance: number;
}

export interface GetSimilarTagsParams {
  sources: string[];  
  aspect?: string;      
  k?: number;           
}

export interface SimilarStudiesResponseDto {
  CRGStudyID: number[];
  Relevance: number[];
  ShortName: string[];
  NumberParticipants: string[];
  Duration: (string | null)[];
  Comparison: (string | null)[];
  Countries: string[];
  DateEntered: string[];
  DateEdited: string[];
  StatusofStudy: string[];
}

export interface GetSimilarStudiesParams {
  aspect?: string;
  cutoff?: string;
  k?: number;
  return_details?: boolean;
}

export interface StudyDto {
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
}

export interface ReportDto {
  CENTRALReportID: number | null;
  CRGReportID: number;
  Title: string;
  Notes: string | null;
  ReportNumber: number;
  OriginalTitle: string | null;
  Authors: string | null;
  Journal: string | null;
  Year: number | null;
  Volume: string | null;
  Issue: string | null;
  Pages: string | null;
  Language: string | null;
  Abstract: string | null;
  CENTRALSubmissionStatus: string | null;
  CopyStatus: string | null;
  DatetoCENTRAL: string | null;
  Dateentered: string | null;
  DateEdited: string | null;
  Editors: string | null;
  Publisher: string | null;
  City: string | null;
  DupString: string;
  TypeofReportID: number | null;
  PublicationTypeID: number;
  Edition: string | null;
  Medium: string | null;
  StudyDesign: string | null;
  DOI: string | null;
  UDef3: string | null;
  ISBN: string | null;
  UDef5: string | null;
  PMID: string | null;
  TrialRegistrationID: string | null;
  UDef9: string | null;
  UDef10: string | null;
  UDef8: string | null;
  PDFLinks: string | null; 
}

export interface InterventionDto {
  ID: number;
  Description: string;
}

export interface ConditionDto {
  ID: number;
  Description: string;
}

export interface OutcomeDto {
  ID: number;
  Description: string;
}

export type GetPersonsResponseDto = Record<string, string[]>;

// GenAI Backend DTOs
export interface EvaluateRequest {
  report: ReportDto;
  studies: StudyDto[];
  model?: "gpt-5.2" | "gpt-5" | "gpt-5-mini" | "gpt-4.1" | null;
  include_pdf?: boolean | null;
  prompt_overrides?: PromptOverrides | null;
}

export interface PromptOverrides {
  background_prompt?: string | null;
  initial_eval_prompt?: string | null;
  likely_group_prompt?: string | null;
  likely_compare_prompt?: string | null;
  unsure_review_prompt?: string | null;
  summary_prompt?: string | null;
  pdf_prompt?: string | null;
}

export interface DefaultPrompts {
  background_prompt: string;
  initial_eval_prompt: string;
  likely_group_prompt: string;
  likely_compare_prompt: string;
  unsure_review_prompt: string;
  summary_prompt: string;
  pdf_prompt: string;
}

export interface StudyDecision {
  study_id: string;
  decision: "match" | "not_match" | "unsure" | "likely_match";
  reason: string;
}

export interface VeryLikelyDecision {
  study_id: string;
  prior_reason: string | null;
  group_reason: string | null;
}

export interface EvaluateResponse {
  match: StudyDecision | null;
  not_matches: StudyDecision[];
  unsure: StudyDecision[];
  likely_matches: StudyDecision[];
  very_likely: VeryLikelyDecision[];
  total_reviewed: number;
}

export type StreamEventNode =
  | "prepare_report_pdf"
  | "load_next_initial"
  | "classify_initial"
  | "select_very_likely"
  | "compare_very_likely"
  | "prepare_unsure_review"
  | "load_next_unsure"
  | "classify_unsure"
  | "match_not_found_end"
  | "summarize_evaluation";

export type StreamEventType = "node" | "complete" | "error" | "unknown";

export interface StreamEventDetails {
  study_id?: string | number;
  short_name?: string;
  decision?: "match" | "likely_match" | "unsure" | "not_match";
  reason?: string;
  idx?: number;
  very_likely_ids?: string[];
  match_study_id?: string;
  count?: number;
  has_match?: boolean;
  summary?: string;
}

export interface StreamEvent {
  event: StreamEventType;
  node?: StreamEventNode;
  message?: string;
  details?: StreamEventDetails;
  timestamp: number;
}

export interface StreamCallbacks {
  onEvent: (event: StreamEvent) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}
