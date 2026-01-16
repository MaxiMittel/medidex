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

Decision = Literal["match", "not_match", "unsure"]

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


class EvaluateResponse(BaseModel):
    matches: list[StudyDecision]
    not_matches: list[StudyDecision]
    unsure: list[StudyDecision]
    total: int


class EvalState(TypedDict):
    report: ReportDto
    studies: list[StudyDto]
    idx: int
    current: StudyDto | None
    decision: Decision | None
    reason: str | None
    evaluation_prompt: str | None
    matches: list[dict]
    not_matches: list[dict]
    unsure: list[dict]

DEFAULT_EVAL_PROMPT = (
    "You are a clinical research assistant. Determine whether the study matches the "
    "report's intent. Use the doctor's instructions as primary guidance. Respond ONLY "
    "as JSON with keys: decision (match|not_match|unsure) and reason (short string)."
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
]


def build_user_payload(report: ReportDto, study: StudyDto) -> str:
    report_payload = report.model_dump()
    study_payload = study.model_dump()
    return json.dumps(
        {"report": report_payload, "study": study_payload},
        ensure_ascii=True,
        separators=(",", ":"),
    )


def parse_llm_response(text: str) -> tuple[Decision, str]:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return "unsure", f"Non-JSON response: {text[:300]}"

    decision = payload.get("decision")
    reason = payload.get("reason")
    if decision not in {"match", "not_match", "unsure"}:
        return "unsure", f"Invalid decision: {decision!r}"
    if not isinstance(reason, str) or not reason.strip():
        return "unsure", "Missing reason in model response."
    return decision, reason.strip()


def load_next(state: EvalState) -> dict:
    idx = state["idx"]
    logger.info("load_next: idx=%s total=%s", idx, len(state["studies"]))
    if idx >= len(state["studies"]):
        logger.info("load_next: no_more_studies")
        return {"current": None}

    current = state["studies"][idx]
    logger.info("load_next: study_id=%s short_name=%s", current.CRGStudyID, current.ShortName)
    return {
        "current": current,
        "decision": None,
        "reason": None,
    }


def route_has_study(state: EvalState) -> str:
    next_step = "end" if state.get("current") is None else "classify"
    logger.info("route_has_study: next=%s", next_step)
    return next_step


def classify(state: EvalState) -> dict:
    current = state["current"]
    if current is None:
        logger.info("classify: no_current_study")
        return {"decision": "unsure", "reason": "No study loaded."}

    logger.info("classify: study_id=%s", current.CRGStudyID)
    user_payload = build_user_payload(state["report"], current)
    prompt = state.get("evaluation_prompt") or DEFAULT_EVAL_PROMPT
    try:
        response = MODEL.invoke(
            [
                SystemMessage(content=prompt),
                HumanMessage(content=user_payload),
            ]
        )
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        decision, reason = parse_llm_response(text)
        logger.info("classify: decision=%s", decision)
    except Exception as exc:
        decision, reason = "unsure", f"LLM call failed: {exc.__class__.__name__}"
        logger.info("classify: error=%s", exc.__class__.__name__)
    idx = state["idx"]

    study_id = str(current.CRGStudyID) if current else f"index-{idx}"
    result = {"study_id": study_id, "decision": decision, "reason": reason}

    matches = list(state["matches"])
    not_matches = list(state["not_matches"])
    unsure = list(state["unsure"])

    if decision == "match":
        matches.append(result)
    elif decision == "not_match":
        not_matches.append(result)
    else:
        unsure.append(result)

    return {
        "decision": decision,
        "reason": reason,
        "matches": matches,
        "not_matches": not_matches,
        "unsure": unsure,
        "idx": idx + 1,
    }


def build_graph():
    logger.info("build_graph: init")
    graph = StateGraph(EvalState)
    graph.add_node("load_next", load_next)
    graph.add_node("classify", classify)

    graph.set_entry_point("load_next")
    graph.add_conditional_edges(
        "load_next",
        route_has_study,
        {"classify": "classify", "end": END},
    )
    graph.add_edge("classify", "load_next")
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
        "current": None,
        "decision": None,
        "reason": None,
        "evaluation_prompt": evaluation_prompt,
        "matches": [],
        "not_matches": [],
        "unsure": [],
    }

    final_state = GRAPH.invoke(initial_state)
    logger.info(
        "run_evaluation: done matches=%s not_matches=%s unsure=%s",
        len(final_state["matches"]),
        len(final_state["not_matches"]),
        len(final_state["unsure"]),
    )
    return EvaluateResponse(
        matches=final_state["matches"],
        not_matches=final_state["not_matches"],
        unsure=final_state["unsure"],
        total=len(studies),
    )


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    logger.info("evaluate: studies=%s has_prompt=%s", len(req.studies), bool(req.evaluation_prompt))
    return run_evaluation(req.report, req.studies, req.evaluation_prompt)


@app.get("/evaluate/mock", response_model=EvaluateResponse)
def evaluate_mock(evaluation_prompt: str | None = None) -> EvaluateResponse:
    logger.info("evaluate_mock: has_prompt=%s", bool(evaluation_prompt))
    return run_evaluation(MOCK_REPORT, MOCK_STUDIES, evaluation_prompt)
