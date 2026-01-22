from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Literal, TypedDict

from fastapi import FastAPI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel
from dotenv import load_dotenv

Decision = Literal["match", "not_match", "unsure", "likely_match"]

ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(ENV_PATH)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("medidex.ai")


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


class EvaluateRequest(BaseModel):
    report: ReportDto
    studies: list[StudyDto]
    evaluation_prompt: str | None = None


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
    evaluation_prompt: str | None
    match: dict | None
    not_matches: list[dict]
    unsure: list[dict]
    likely_matches: list[dict]
    very_likely: list[dict]
    rejected_likely: list[dict]

DEFAULT_EVAL_PROMPT = (
    "You are a clinical research assistant. Determine whether the study is relevant to "
    "the report's intent. Use the doctor's instructions as primary guidance. This is "
    "the first pass: respond ONLY with one of not_match, unsure, or likely_match. "
    "Never respond match in this pass. Respond ONLY as json with keys: decision "
    "(not_match|unsure|likely_match) and reason (short string)."
)

DEFAULT_LIKELY_GROUP_PROMPT = (
    "You are reviewing studies previously marked as likely_match. Select up to two "
    "studies to mark as very_likely for a final comparison. If none are strong, "
    "return an empty list. Respond ONLY as json with keys: very_likely_ids (array of "
    "study_id strings) and reason (short string)."
)

DEFAULT_LIKELY_COMPARE_PROMPT = (
    "You are comparing the very_likely studies to decide if any is a definitive match. "
    "Choose at most one match if you are highly confident; otherwise respond unsure. "
    "Respond ONLY as json with keys: decision (match|unsure), study_id (required if "
    "match), and reason (short string)."
)

DEFAULT_UNSURE_REVIEW_PROMPT = (
    "You are reviewing unsure studies. Use the rejected likely_match list as historical "
    "context. Only choose match if you are highly confident; otherwise respond unsure or "
    "not_match. Respond ONLY as json with keys: decision (match|unsure|not_match) and "
    "reason (short string)."
)

MODEL = ChatOpenAI(
    model="gpt-4o",
    temperature=0.1,
    model_kwargs={"response_format": {"type": "json_object"}},
)

MOCK_REPORT = ReportDto(
    CENTRALReportID=None,
    CRGReportID=1001,
    Title="Vitamin D and bone density in older adults",
    Notes=None,
    ReportNumber=1,
    OriginalTitle=None,
    Authors="A. Smith; B. Lee",
    Journal="Journal of Bone Health",
    Year=2022,
    Volume="15",
    Issue="4",
    Pages="123-130",
    Language="English",
    Abstract="We evaluate bone density outcomes after vitamin D supplementation in older adults.",
    CENTRALSubmissionStatus="Submitted",
    CopyStatus="Original",
    DatetoCENTRAL="2023-01-10",
    Dateentered="2023-01-09",
    DateEdited="2023-02-01",
    Editors=None,
    Publisher="MedPress",
    City="Boston",
    DupString="none",
    TypeofReportID=1,
    PublicationTypeID=1,
    Edition=None,
    Medium="Print",
    StudyDesign="Randomized controlled trial",
    DOI="10.1234/example.doi",
    UDef3=None,
    ISBN=None,
    UDef5=None,
    PMID="12345678",
    TrialRegistrationID="NCT01234567",
    UDef9=None,
    UDef10=None,
    UDef8=None,
    PDFLinks=None,
)

MOCK_STUDIES = [
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="180",
        TrialistContactDetails=None,
        Countries="US",
        CENTRALSubmissionStatus="Submitted",
        Duration="9 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2003,
        DateEntered="2022-06-20",
        Comparison="Vitamin D plus calcium vs placebo",
        CENTRALStudyID=5003,
        DateToCENTRAL="2022-07-15",
        ISRCTN="ISRCTN99887766",
        ShortName="Vitamin D and calcium in older adults",
        DateEdited="2022-08-01",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT09876543",
    ),
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="150",
        TrialistContactDetails=None,
        Countries="UK",
        CENTRALSubmissionStatus="Submitted",
        Duration="6 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2002,
        DateEntered="2021-09-10",
        Comparison="High fiber vs standard diet",
        CENTRALStudyID=5002,
        DateToCENTRAL="2021-10-01",
        ISRCTN="ISRCTN87654321",
        ShortName="Dietary fiber and microbiome",
        DateEdited="2021-11-02",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT07654321",
    ),
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="200",
        TrialistContactDetails=None,
        Countries="US; Canada",
        CENTRALSubmissionStatus="Submitted",
        Duration="12 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2001,
        DateEntered="2022-12-01",
        Comparison="Vitamin D vs placebo",
        CENTRALStudyID=5001,
        DateToCENTRAL="2023-01-05",
        ISRCTN="ISRCTN12345678",
        ShortName="Vitamin D bone density trial",
        DateEdited="2023-01-15",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT01234567",
    ),
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="220",
        TrialistContactDetails=None,
        Countries="Canada",
        CENTRALSubmissionStatus="Submitted",
        Duration="10 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2004,
        DateEntered="2021-03-12",
        Comparison="Resistance training vs usual care",
        CENTRALStudyID=5004,
        DateToCENTRAL="2021-04-02",
        ISRCTN="ISRCTN44556677",
        ShortName="Resistance training for fall prevention",
        DateEdited="2021-04-20",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT05554444",
    ),
]


def build_user_payload(report: ReportDto, study: StudyDto) -> str:
    report_payload = report.model_dump()
    study_payload = study.model_dump()
    return json.dumps(
        {"report": report_payload, "study": study_payload},
        ensure_ascii=True,
        separators=(",", ":"),
    )


def get_study_by_id(studies: list[StudyDto], study_id: str) -> StudyDto | None:
    for study in studies:
        if str(study.CRGStudyID) == study_id:
            return study
    return None


def get_bucket_entry(bucket: list[dict], study_id: str) -> dict | None:
    for item in bucket:
        if str(item.get("study_id")) == study_id:
            return item
    return None


def upsert_bucket(bucket: list[dict], entry: dict) -> list[dict]:
    study_id = str(entry.get("study_id"))
    updated: list[dict] = []
    replaced = False
    for item in bucket:
        if str(item.get("study_id")) == study_id:
            updated.append(entry)
            replaced = True
        else:
            updated.append(item)
    if not replaced:
        updated.append(entry)
    return updated


def remove_from_bucket(bucket: list[dict], study_id: str) -> list[dict]:
    return [item for item in bucket if str(item.get("study_id")) != study_id]


def parse_initial_response(text: str) -> tuple[Decision, str]:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return "unsure", f"Non-JSON response: {text[:300]}"

    decision = payload.get("decision")
    reason = payload.get("reason")
    if decision not in {"not_match", "unsure", "likely_match"}:
        return "unsure", f"Invalid decision: {decision!r}"
    if not isinstance(reason, str) or not reason.strip():
        return "unsure", "Missing reason in model response."
    return decision, reason.strip()


def parse_likely_group_response(text: str, candidate_ids: set[str]) -> tuple[list[str], str]:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return [], f"Non-JSON response: {text[:300]}"

    raw_ids = payload.get("very_likely_ids", [])
    reason = payload.get("reason")
    if not isinstance(raw_ids, list):
        return [], "Invalid very_likely_ids in model response."
    if not isinstance(reason, str) or not reason.strip():
        return [], "Missing reason in model response."

    selected: list[str] = []
    for item in raw_ids:
        if not isinstance(item, str):
            continue
        study_id = item.strip()
        if not study_id or study_id not in candidate_ids:
            continue
        if study_id not in selected:
            selected.append(study_id)

    return selected[:2], reason.strip()


def parse_unsure_review_response(text: str) -> tuple[Decision, str]:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return "unsure", f"Non-JSON response: {text[:300]}"

    decision = payload.get("decision")
    reason = payload.get("reason")
    if decision not in {"match", "unsure", "not_match"}:
        return "unsure", f"Invalid decision: {decision!r}"
    if not isinstance(reason, str) or not reason.strip():
        return "unsure", "Missing reason in model response."
    return decision, reason.strip()


def parse_likely_compare_response(text: str, candidate_ids: set[str]) -> tuple[Decision, str, str | None]:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return "unsure", f"Non-JSON response: {text[:300]}", None

    decision = payload.get("decision")
    reason = payload.get("reason")
    study_id = payload.get("study_id")
    if decision not in {"match", "unsure"}:
        return "unsure", f"Invalid decision: {decision!r}", None
    if not isinstance(reason, str) or not reason.strip():
        return "unsure", "Missing reason in model response.", None
    if decision == "match":
        if not isinstance(study_id, str) or not study_id.strip():
            return "unsure", "Missing study_id for match decision.", None
        if study_id not in candidate_ids:
            return "unsure", f"study_id not in candidates: {study_id!r}", None
    return decision, reason.strip(), study_id


def build_likely_group_payload(
    report: ReportDto,
    candidates: list[dict],
    studies: list[StudyDto],
) -> str:
    by_id = {str(study.CRGStudyID): study for study in studies}
    payload_candidates: list[dict] = []
    for item in candidates:
        study_id = str(item.get("study_id", ""))
        study = by_id.get(study_id)
        if study is None:
            continue
        payload_candidates.append(
            {
                "study_id": study_id,
                "study": study.model_dump(),
                "prior_reason": item.get("reason"),
            }
        )
    return json.dumps(
        {"report": report.model_dump(), "candidates": payload_candidates},
        ensure_ascii=True,
        separators=(",", ":"),
    )


def build_likely_compare_payload(
    report: ReportDto,
    candidates: list[dict],
    studies: list[StudyDto],
) -> str:
    by_id = {str(study.CRGStudyID): study for study in studies}
    payload_candidates: list[dict] = []
    for item in candidates:
        study_id = str(item.get("study_id", ""))
        study = by_id.get(study_id)
        if study is None:
            continue
        payload_candidates.append(
            {
                "study_id": study_id,
                "study": study.model_dump(),
                "prior_reason": item.get("prior_reason"),
                "group_reason": item.get("group_reason"),
            }
        )
    return json.dumps(
        {"report": report.model_dump(), "candidates": payload_candidates},
        ensure_ascii=True,
        separators=(",", ":"),
    )


def build_unsure_review_payload(
    report: ReportDto,
    rejected_likely: list[dict],
    current_study: StudyDto,
    prior_reason: str | None,
    studies: list[StudyDto],
) -> str:
    by_id = {str(study.CRGStudyID): study for study in studies}
    rejected_payload: list[dict] = []
    for item in rejected_likely:
        study_id = str(item.get("study_id", ""))
        study = by_id.get(study_id)
        if study is None:
            continue
        rejected_payload.append(
            {
                "study": study.model_dump(),
                "initial_reason": item.get("initial_reason"),
                "review_reason": item.get("review_reason"),
            }
        )
    return json.dumps(
        {
            "report": report.model_dump(),
            "rejected_likely": rejected_payload,
            "current": {
                "study": current_study.model_dump(),
                "prior_reason": prior_reason,
            },
        },
        ensure_ascii=True,
        separators=(",", ":"),
    )


def load_next_initial(state: EvalState) -> dict:
    idx = state["idx"]
    logger.info("load_next_initial: idx=%s total=%s", idx, len(state["studies"]))
    if idx >= len(state["studies"]):
        logger.info("load_next_initial: no_more_studies")
        return {"current": None}

    current = state["studies"][idx]
    logger.info(
        "load_next_initial: study_id=%s short_name=%s",
        current.CRGStudyID,
        current.ShortName,
    )
    return {
        "current": current,
        "decision": None,
        "reason": None,
    }


def route_after_initial_load(state: EvalState) -> str:
    next_step = "no_more_initial" if state.get("current") is None else "has_study"
    logger.info("route_after_initial_load: next=%s", next_step)
    return next_step


def classify_initial(state: EvalState) -> dict:
    current = state["current"]
    if current is None:
        logger.info("classify_initial: no_current_study")
        return {"decision": "unsure", "reason": "No study loaded."}

    logger.info("classify_initial: study_id=%s", current.CRGStudyID)
    user_payload = build_user_payload(state["report"], current)
    evaluation_prompt = state.get("evaluation_prompt")
    prompt = DEFAULT_EVAL_PROMPT
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        if evaluation_prompt:
            messages.append(
                SystemMessage(
                    content=(
                        "Doctor instructions (follow as primary guidance): "
                        f"{evaluation_prompt}"
                    )
                )
            )
        messages.append(HumanMessage(content=user_payload))
        response = MODEL.invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        decision, reason = parse_initial_response(text)
        logger.info("classify_initial: decision=%s", decision)
    except Exception as exc:
        decision, reason = "unsure", f"LLM call failed: {exc.__class__.__name__}"
        logger.info("classify_initial: error=%s", exc.__class__.__name__)
        logger.info("classify_initial: reason=%s", str(exc))
    idx = state["idx"]

    study_id = str(current.CRGStudyID) if current else f"index-{idx}"
    result = {"study_id": study_id, "decision": decision, "reason": reason}

    not_matches = list(state["not_matches"])
    unsure = list(state["unsure"])
    likely_matches = list(state["likely_matches"])

    if decision == "not_match":
        not_matches.append(result)
    elif decision == "likely_match":
        likely_matches.append(result)
    else:
        unsure.append(result)

    return {
        "decision": decision,
        "reason": reason,
        "not_matches": not_matches,
        "unsure": unsure,
        "likely_matches": likely_matches,
        "idx": idx + 1,
    }


def prepare_likely_review(state: EvalState) -> dict:
    count = len(state.get("likely_matches", []))
    logger.info("prepare_likely_review: count=%s", count)
    return {
        "current": None,
        "decision": None,
        "reason": None,
        "very_likely": [],
    }


def select_very_likely(state: EvalState) -> dict:
    candidates = list(state.get("likely_matches", []))
    if not candidates:
        logger.info("select_very_likely: no_candidates")
        return {
            "decision": "unsure",
            "reason": "No likely matches to review.",
            "likely_matches": [],
            "very_likely": [],
        }

    candidate_ids = {str(item.get("study_id")) for item in candidates if item.get("study_id")}
    payload = build_likely_group_payload(state["report"], candidates, state["studies"])
    evaluation_prompt = state.get("evaluation_prompt")
    prompt = DEFAULT_LIKELY_GROUP_PROMPT
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        if evaluation_prompt:
            messages.append(
                SystemMessage(
                    content=(
                        "Doctor instructions (follow as primary guidance): "
                        f"{evaluation_prompt}"
                    )
                )
            )
        messages.append(HumanMessage(content=payload))
        response = MODEL.invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        selected_ids, reason = parse_likely_group_response(text, candidate_ids)
        logger.info("select_very_likely: selected=%s", selected_ids)
    except Exception as exc:
        selected_ids, reason = [], f"LLM call failed: {exc.__class__.__name__}"
        logger.info("select_very_likely: error=%s", exc.__class__.__name__)
        logger.info("select_very_likely: reason=%s", str(exc))

    selected_set = set(selected_ids)
    likely_matches: list[dict] = []
    very_likely: list[dict] = []
    unsure = list(state["unsure"])
    rejected_likely = list(state.get("rejected_likely", []))

    for item in candidates:
        study_id = str(item.get("study_id"))
        prior_reason = item.get("reason")
        if study_id in selected_set:
            likely_matches.append(
                {"study_id": study_id, "decision": "likely_match", "reason": reason}
            )
            very_likely.append(
                {
                    "study_id": study_id,
                    "prior_reason": prior_reason,
                    "group_reason": reason,
                }
            )
        else:
            unsure = upsert_bucket(
                unsure,
                {
                    "study_id": study_id,
                    "decision": "unsure",
                    "reason": f"Not selected as very_likely: {reason}",
                },
            )
            rejected_likely.append(
                {
                    "study_id": study_id,
                    "initial_reason": prior_reason,
                    "review_reason": reason,
                }
            )

    return {
        "decision": "unsure",
        "reason": reason,
        "likely_matches": likely_matches,
        "very_likely": very_likely,
        "unsure": unsure,
        "rejected_likely": rejected_likely,
    }


def route_after_very_likely_selection(state: EvalState) -> str:
    next_step = "has_very_likely" if state.get("very_likely") else "no_very_likely"
    logger.info("route_after_very_likely_selection: next=%s", next_step)
    return next_step


def compare_very_likely(state: EvalState) -> dict:
    candidates = list(state.get("very_likely", []))
    if not candidates:
        logger.info("compare_very_likely: no_candidates")
        return {
            "decision": "unsure",
            "reason": "No very_likely candidates to compare.",
            "very_likely": [],
        }

    candidate_ids = {str(item.get("study_id")) for item in candidates if item.get("study_id")}
    payload = build_likely_compare_payload(state["report"], candidates, state["studies"])
    evaluation_prompt = state.get("evaluation_prompt")
    prompt = DEFAULT_LIKELY_COMPARE_PROMPT
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        if evaluation_prompt:
            messages.append(
                SystemMessage(
                    content=(
                        "Doctor instructions (follow as primary guidance): "
                        f"{evaluation_prompt}"
                    )
                )
            )
        messages.append(HumanMessage(content=payload))
        response = MODEL.invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        decision, reason, study_id = parse_likely_compare_response(text, candidate_ids)
        logger.info("compare_very_likely: decision=%s", decision)
    except Exception as exc:
        decision, reason, study_id = "unsure", f"LLM call failed: {exc.__class__.__name__}", None
        logger.info("compare_very_likely: error=%s", exc.__class__.__name__)
        logger.info("compare_very_likely: reason=%s", str(exc))

    match = state["match"]
    likely_matches = list(state.get("likely_matches", []))
    unsure = list(state["unsure"])
    rejected_likely = list(state.get("rejected_likely", []))

    if decision == "match" and study_id:
        if match is None:
            match = {"study_id": study_id, "decision": "match", "reason": reason}
        remaining_very_likely = [
            item for item in candidates if str(item.get("study_id")) != study_id
        ]
        for item in candidates:
            cid = str(item.get("study_id"))
            likely_matches = remove_from_bucket(likely_matches, cid)
        return {
            "decision": decision,
            "reason": reason,
            "match": match,
            "likely_matches": likely_matches,
            "very_likely": remaining_very_likely,
        }

    for item in candidates:
        cid = str(item.get("study_id"))
        prior_reason = item.get("prior_reason")
        likely_matches = remove_from_bucket(likely_matches, cid)
        unsure = upsert_bucket(
            unsure,
            {
                "study_id": cid,
                "decision": "unsure",
                "reason": f"Very likely but no definitive match: {reason}",
            },
        )
        rejected_likely.append(
            {
                "study_id": cid,
                "initial_reason": prior_reason,
                "review_reason": reason,
            }
        )

    return {
        "decision": decision,
        "reason": reason,
        "match": match,
        "likely_matches": likely_matches,
        "unsure": unsure,
        "rejected_likely": rejected_likely,
    }


def route_after_very_likely_compare(state: EvalState) -> str:
    next_step = "match_found" if state.get("match") is not None else "no_match_after_compare"
    logger.info("route_after_very_likely_compare: next=%s", next_step)
    return next_step


def prepare_unsure_review(state: EvalState) -> dict:
    queue = [str(item.get("study_id")) for item in state.get("unsure", []) if item.get("study_id")]
    logger.info("prepare_unsure_review: count=%s", len(queue))
    return {
        "unsure_queue": queue,
        "unsure_idx": 0,
        "current": None,
        "decision": None,
        "reason": None,
    }


def load_next_unsure(state: EvalState) -> dict:
    idx = state["unsure_idx"]
    queue = state.get("unsure_queue", [])
    logger.info("load_next_unsure: idx=%s total=%s", idx, len(queue))
    while idx < len(queue):
        study_id = queue[idx]
        current = get_study_by_id(state["studies"], study_id)
        if current is not None:
            logger.info(
                "load_next_unsure: study_id=%s short_name=%s",
                current.CRGStudyID,
                current.ShortName,
            )
            return {
                "current": current,
                "decision": None,
                "reason": None,
                "unsure_idx": idx,
            }
        logger.info("load_next_unsure: missing_study_id=%s", study_id)
        idx += 1

    logger.info("load_next_unsure: no_more_unsure")
    return {"current": None, "unsure_idx": idx}


def route_after_unsure_load(state: EvalState) -> str:
    if state.get("match") is not None:
        next_step = "match_found"
    elif state.get("current") is None:
        next_step = "match_not_found"
    else:
        next_step = "has_unsure"
    logger.info("route_after_unsure_load: next=%s", next_step)
    return next_step


def classify_unsure(state: EvalState) -> dict:
    current = state["current"]
    if current is None:
        logger.info("classify_unsure: no_current_study")
        return {"decision": "unsure", "reason": "No study loaded."}

    study_id = str(current.CRGStudyID)
    prior_entry = get_bucket_entry(state.get("unsure", []), study_id)
    prior_reason = prior_entry.get("reason") if prior_entry else None

    logger.info("classify_unsure: study_id=%s", study_id)
    payload = build_unsure_review_payload(
        state["report"],
        state.get("rejected_likely", []),
        current,
        prior_reason,
        state["studies"],
    )
    evaluation_prompt = state.get("evaluation_prompt")
    prompt = DEFAULT_UNSURE_REVIEW_PROMPT
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        if evaluation_prompt:
            messages.append(
                SystemMessage(
                    content=(
                        "Doctor instructions (follow as primary guidance): "
                        f"{evaluation_prompt}"
                    )
                )
            )
        messages.append(HumanMessage(content=payload))
        response = MODEL.invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        decision, reason = parse_unsure_review_response(text)
        logger.info("classify_unsure: decision=%s", decision)
    except Exception as exc:
        decision, reason = "unsure", f"LLM call failed: {exc.__class__.__name__}"
        logger.info("classify_unsure: error=%s", exc.__class__.__name__)
        logger.info("classify_unsure: reason=%s", str(exc))

    match = state["match"]
    not_matches = list(state["not_matches"])
    unsure = list(state["unsure"])

    if decision == "match":
        if match is None:
            match = {"study_id": study_id, "decision": "match", "reason": reason}
        unsure = remove_from_bucket(unsure, study_id)
    elif decision == "not_match":
        unsure = remove_from_bucket(unsure, study_id)
        not_matches = upsert_bucket(
            not_matches,
            {"study_id": study_id, "decision": "not_match", "reason": reason},
        )
    else:
        unsure = upsert_bucket(
            unsure,
            {"study_id": study_id, "decision": "unsure", "reason": reason},
        )

    return {
        "decision": decision,
        "reason": reason,
        "match": match,
        "not_matches": not_matches,
        "unsure": unsure,
        "unsure_idx": state["unsure_idx"] + 1,
    }


def match_not_found_end(state: EvalState) -> dict:
    logger.info("match_not_found_end: no_match")
    return {}


def build_graph():
    logger.info("build_graph: init")
    graph = StateGraph(EvalState)
    graph.add_node("load_next_initial", load_next_initial)
    graph.add_node("classify_initial", classify_initial)
    graph.add_node("prepare_likely_review", prepare_likely_review)
    graph.add_node("select_very_likely", select_very_likely)
    graph.add_node("compare_very_likely", compare_very_likely)
    graph.add_node("prepare_unsure_review", prepare_unsure_review)
    graph.add_node("load_next_unsure", load_next_unsure)
    graph.add_node("classify_unsure", classify_unsure)
    graph.add_node("match_not_found_end", match_not_found_end)

    graph.set_entry_point("load_next_initial")
    graph.add_conditional_edges(
        "load_next_initial",
        route_after_initial_load,
        {"has_study": "classify_initial", "no_more_initial": "prepare_likely_review"},
    )
    graph.add_edge("classify_initial", "load_next_initial")

    graph.add_edge("prepare_likely_review", "select_very_likely")
    graph.add_conditional_edges(
        "select_very_likely",
        route_after_very_likely_selection,
        {"has_very_likely": "compare_very_likely", "no_very_likely": "prepare_unsure_review"},
    )
    graph.add_conditional_edges(
        "compare_very_likely",
        route_after_very_likely_compare,
        {"match_found": END, "no_match_after_compare": "prepare_unsure_review"},
    )

    graph.add_edge("prepare_unsure_review", "load_next_unsure")
    graph.add_conditional_edges(
        "load_next_unsure",
        route_after_unsure_load,
        {"has_unsure": "classify_unsure", "match_not_found": "match_not_found_end", "match_found": END},
    )
    graph.add_edge("classify_unsure", "load_next_unsure")
    graph.add_edge("match_not_found_end", END)
    return graph.compile()


GRAPH = build_graph()

app = FastAPI(title="Medidex AI Demo")


def run_evaluation(
    report: ReportDto,
    studies: list[StudyDto],
    evaluation_prompt: str | None,
) -> EvaluateResponse:
    logger.info("run_evaluation: reports=%s studies=%s", report.CRGReportID, len(studies))
    initial_state: EvalState = {
        "report": report,
        "studies": studies,
        "idx": 0,
        "unsure_idx": 0,
        "unsure_queue": [],
        "current": None,
        "decision": None,
        "reason": None,
        "evaluation_prompt": evaluation_prompt,
        "match": None,
        "not_matches": [],
        "unsure": [],
        "likely_matches": [],
        "very_likely": [],
        "rejected_likely": [],
    }

    final_state = GRAPH.invoke(initial_state)
    logger.info(
        "run_evaluation: done match=%s not_matches=%s unsure=%s likely_matches=%s",
        "yes" if final_state["match"] else "no",
        len(final_state["not_matches"]),
        len(final_state["unsure"]),
        len(final_state["likely_matches"]),
    )
    return EvaluateResponse(
        match=final_state["match"],
        not_matches=final_state["not_matches"],
        unsure=final_state["unsure"],
        likely_matches=final_state["likely_matches"],
        very_likely=final_state["very_likely"],
        total_reviewed=(
            len(final_state["not_matches"])
            + len(final_state["unsure"])
            + len(final_state["likely_matches"])
            + len(final_state["very_likely"])
            + (1 if final_state["match"] else 0)
        ),
    )


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    logger.info("evaluate: studies=%s has_prompt=%s", len(req.studies), bool(req.evaluation_prompt))
    return run_evaluation(req.report, req.studies, req.evaluation_prompt)


@app.get("/evaluate/mock", response_model=EvaluateResponse)
def evaluate_mock(evaluation_prompt: str | None = None) -> EvaluateResponse:
    logger.info("evaluate_mock: has_prompt=%s", bool(evaluation_prompt))
    return run_evaluation(MOCK_REPORT, MOCK_STUDIES, evaluation_prompt)
