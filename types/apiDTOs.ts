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

export interface ReportDetailDto {
  report: ReportDto;
  assignedStudies: number[];
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

export interface SimilarStudyResponseDto {
  relevance: number;
  study: StudyDto;
}

export interface GetSimilarStudiesParams {
  aspect?: string;
  cutoff?: string;
  k?: number;
  return_details?: boolean;
}

export interface StudyDto {
  studyId: number;
  shortName: string;
  countries: string[];
  numberParticipants: string | null;
  duration: string | null;
  comparison: string | null
  trialId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDto {
  reportId: number;
  year: number;
  title: string;
  abstract: string | null;
  trialId: string | null;
  authors: string[];
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
  likely_review_prompt?: string | null;
  unsure_review_prompt?: string | null;
  summary_prompt?: string | null;
  pdf_prompt?: string | null;
}

export interface DefaultPrompts {
  background_prompt: string;
  initial_eval_prompt: string;
  likely_group_prompt: string;
  likely_compare_prompt: string;
  likely_review_prompt: string;
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
  evaluation_has_match?: boolean | null;
  evaluation_summary?: string | null;
  evaluation_new_study?: NewStudySuggestion | null;
}

export interface NewStudySuggestion {
  short_name: string;
  status_of_study: string;
  countries: string;
  duration: string;
  number_of_participants: string;
  comparison: string;
}

export type StreamEventNode =
  | "prepare_report_pdf"
  | "load_next_initial"
  | "classify_initial"
  | "select_very_likely"
  | "compare_very_likely"
  | "prepare_likely_review"
  | "load_next_likely"
  | "classify_likely_review"
  | "prepare_unsure_review"
  | "load_next_unsure"
  | "classify_unsure"
  | "match_not_found_end"
  | "summarize_evaluation"
  | "suggest_new_study";

export type StreamEventType = "node" | "complete" | "error" | "unknown";

export interface StreamEventDetails {
  study_id?: string | number;
  short_name?: string;
  decision?: "match" | "likely_match" | "unsure" | "not_match";
  reason?: string;
  idx?: number;
  very_likely_study_ids?: Array<string | number>;
  very_likely_names?: string[];
  match_study_id?: string;
  count?: number;
  has_match?: boolean;
  summary?: string;
  new_study?: NewStudySuggestion | null;
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
