from __future__ import annotations

import json

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import logger
from evaluator import build_initial_state, run_evaluation
from evaluator_pdf import build_initial_state_pdf, run_evaluation_pdf
from evaluation_graph import GRAPH
from evaluation_graph_pdf import GRAPH_PDF
from mock_data import MOCK_REPORT, MOCK_STUDIES
from mock_data_pdf import MOCK_PDF_REPORT, MOCK_STUDIES_PDF
from schemas import EvaluateRequest, EvaluateResponse, ReportPdfDto, StudyDto
from streaming import summarize_stream_event

app = FastAPI(title="Medidex AI Demo")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    logger.info(
        "evaluate: studies=%s model=%s temperature=%s",
        len(req.studies),
        req.model,
        req.temperature,
    )
    prompt_overrides = req.prompt_overrides.model_dump() if req.prompt_overrides else None
    return run_evaluation(
        req.report,
        req.studies,
        prompt_overrides,
        req.model,
        req.temperature,
    )


@app.post("/evaluate/stream")
def evaluate_stream(req: EvaluateRequest) -> StreamingResponse:
    logger.info(
        "evaluate_stream: studies=%s model=%s temperature=%s",
        len(req.studies),
        req.model,
        req.temperature,
    )
    prompt_overrides = req.prompt_overrides.model_dump() if req.prompt_overrides else None
    initial_state = build_initial_state(
        req.report,
        req.studies,
        prompt_overrides,
        req.model,
        req.temperature,
    )

    def event_stream():
        for event in GRAPH.stream(initial_state, stream_mode="updates"):
            summary = summarize_stream_event(event)
            if summary is None:
                continue
            payload = jsonable_encoder(summary)
            yield f"data: {json.dumps(payload, ensure_ascii=True)}\n\n"
        yield "data: {\"event\":\"complete\"}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/evaluate/stream/mock")
def evaluate_stream_mock() -> StreamingResponse:
    logger.info("evaluate_stream_mock")
    initial_state = build_initial_state(
        MOCK_REPORT,
        MOCK_STUDIES,
        None,
        None,
        None,
    )

    def event_stream():
        for event in GRAPH.stream(initial_state, stream_mode="updates"):
            summary = summarize_stream_event(event)
            payload = jsonable_encoder(summary)
            yield f"data: {json.dumps(payload, ensure_ascii=True)}\n\n"
        yield "data: {\"event\":\"complete\"}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/evaluate/mock", response_model=EvaluateResponse)
def evaluate_mock() -> EvaluateResponse:
    logger.info("evaluate_mock")
    return run_evaluation(
        MOCK_REPORT,
        MOCK_STUDIES,
        None,
        None,
        None,
    )

# PDF Evaluation Endpoints


class EvaluatePdfRequest(BaseModel):
    """Request body for PDF evaluation."""
    report: ReportPdfDto
    studies: list[StudyDto]
    evaluation_prompt: str | None = None


@app.post("/evaluate/pdf", response_model=EvaluateResponse)
def evaluate_pdf(req: EvaluatePdfRequest) -> EvaluateResponse:
    logger.info("evaluate_pdf: studies=%s has_prompt=%s", len(req.studies), bool(req.evaluation_prompt))
    return run_evaluation_pdf(req.report, req.studies, req.evaluation_prompt)


@app.post("/evaluate/pdf/stream")
def evaluate_pdf_stream(req: EvaluatePdfRequest) -> StreamingResponse:
    logger.info("evaluate_pdf_stream: studies=%s has_prompt=%s", len(req.studies), bool(req.evaluation_prompt))
    initial_state = build_initial_state_pdf(req.report, req.studies, req.evaluation_prompt)

    def event_stream():
        for event in GRAPH_PDF.stream(initial_state, stream_mode="updates"):
            summary = summarize_stream_event(event)
            payload = jsonable_encoder(summary)
            yield f"data: {json.dumps(payload, ensure_ascii=True)}\n\n"
        yield "data: {\"event\":\"complete\"}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/evaluate/pdf/mock", response_model=EvaluateResponse)
def evaluate_pdf_mock(evaluation_prompt: str | None = None) -> EvaluateResponse:
    logger.info("evaluate_pdf_mock: has_prompt=%s", bool(evaluation_prompt))
    return run_evaluation_pdf(MOCK_PDF_REPORT, MOCK_STUDIES_PDF, evaluation_prompt)


@app.get("/evaluate/pdf/stream/mock")
def evaluate_pdf_stream_mock(evaluation_prompt: str | None = None) -> StreamingResponse:
    logger.info("evaluate_pdf_stream_mock: has_prompt=%s", bool(evaluation_prompt))
    initial_state = build_initial_state_pdf(MOCK_PDF_REPORT, MOCK_STUDIES_PDF, evaluation_prompt)

    def event_stream():
        for event in GRAPH_PDF.stream(initial_state, stream_mode="updates"):
            summary = summarize_stream_event(event)
            payload = jsonable_encoder(summary)
            yield f"data: {json.dumps(payload, ensure_ascii=True)}\n\n"
        yield "data: {\"event\":\"complete\"}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
