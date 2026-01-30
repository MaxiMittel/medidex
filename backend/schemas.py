from __future__ import annotations

from typing import Any, Literal, TypedDict

from pydantic import BaseModel, Field

Decision = Literal["match", "not_match", "unsure", "likely_match"]
ModelName = Literal["gpt-5.2", "gpt-5", "gpt-5-mini", "gpt-4.1"]


class ReportDto(BaseModel):
    CENTRALReportID: int | None
    CRGReportID: int
    Title: str
    Notes: str | None
    ReportNumber: int
    OriginalTitle: str | None
    Authors: str | None
    Journal: str | None
    Year: int | None
    Volume: str | None
    Issue: str | None
    Pages: str | None
    Language: str | None
    Abstract: str | None
    CENTRALSubmissionStatus: str | None
    CopyStatus: str | None
    DatetoCENTRAL: str | None
    Dateentered: str | None
    DateEdited: str | None
    Editors: str | None
    Publisher: str | None
    City: str | None
    DupString: str
    TypeofReportID: int | None
    PublicationTypeID: int
    Edition: str | None
    Medium: str | None
    StudyDesign: str | None
    DOI: str | None
    UDef3: str | None
    ISBN: str | None
    UDef5: str | None
    PMID: str | None
    TrialRegistrationID: str | None
    UDef9: str | None
    UDef10: str | None
    UDef8: str | None
    PDFLinks: str | None


class StudyDto(BaseModel):
    StatusofStudy: str | None
    NumberParticipants: str | None
    TrialistContactDetails: str | None
    Countries: str | None
    CENTRALSubmissionStatus: str | None
    Duration: str | None
    Notes: str | None
    UDef4: str | None
    CRGStudyID: int
    DateEntered: str | None
    Comparison: str | None
    CENTRALStudyID: int
    DateToCENTRAL: str | None
    ISRCTN: str | None
    ShortName: str
    DateEdited: str | None
    UDef6: str | None
    Search_Tagged: bool
    TrialRegistrationID: str | None


class PromptOverrides(BaseModel):
    initial_eval_prompt: str | None = None
    likely_group_prompt: str | None = None
    likely_compare_prompt: str | None = None
    unsure_review_prompt: str | None = None
    summary_prompt: str | None = None


class EvaluateRequest(BaseModel):
    report: ReportDto
    studies: list[StudyDto]
    model: ModelName | None = None
    temperature: float | None = Field(default=None, ge=0, le=2)
    prompt_overrides: PromptOverrides | None = None


class StudyDecision(BaseModel):
    study_id: str
    decision: Decision
    reason: str


class VeryLikelyDecision(BaseModel):
    study_id: str
    prior_reason: str | None
    group_reason: str | None


class EvaluateResponse(BaseModel):
    match: StudyDecision | None
    not_matches: list[StudyDecision]
    unsure: list[StudyDecision]
    likely_matches: list[StudyDecision]
    very_likely: list[VeryLikelyDecision]
    evaluation_has_match: bool | None = None
    evaluation_summary: str | None = None
    total_reviewed: int


class EvalState(TypedDict):
    report: ReportDto
    studies: list[StudyDto]
    idx: int
    unsure_idx: int
    unsure_queue: list[str]
    current: StudyDto | None
    decision: Decision | None
    reason: str | None
    prompt_overrides: dict[str, str | None] | None
    llm: Any | None
    match: dict | None
    not_matches: list[dict]
    unsure: list[dict]
    likely_matches: list[dict]
    very_likely: list[dict]
    rejected_likely: list[dict]
    evaluation_summary: dict | None
