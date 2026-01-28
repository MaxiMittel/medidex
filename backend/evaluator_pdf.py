"""PDF-based evaluator functions."""
from __future__ import annotations

from config import logger
from evaluation_graph_pdf import GRAPH_PDF
from pdf_utils import upload_pdf_to_openai
from schemas import EvaluateResponse, EvalStatePdf, ReportPdfDto, StudyDto


def build_initial_state_pdf(
    report: ReportPdfDto,
    studies: list[StudyDto],
    evaluation_prompt: str | None,
) -> EvalStatePdf:
    """Build initial state for PDF-based evaluation.
    
    Uploads PDF to OpenAI once and stores file_id for reuse across all study comparisons.
    """
    # Upload PDF to OpenAI and get file ID (optimization to avoid re-uploading)
    pdf_file_id = upload_pdf_to_openai(
        report.PDFContent,
        filename=f"report_{report.CRGReportID}.pdf"
    )
    if pdf_file_id:
        logger.info("build_initial_state_pdf: uploaded PDF file_id=%s", pdf_file_id)
    else:
        logger.warning("build_initial_state_pdf: PDF upload failed, will use inline base64")
    
    return {
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
        "evaluation_summary": None,
        "pdf_file_id": pdf_file_id,
    }


def run_evaluation_pdf(
    report: ReportPdfDto,
    studies: list[StudyDto],
    evaluation_prompt: str | None,
) -> EvaluateResponse:
    """Run PDF-based evaluation through the full multi-pass graph."""
    logger.info("run_evaluation_pdf: report=%s studies=%s", report.CRGReportID, len(studies))
    initial_state = build_initial_state_pdf(report, studies, evaluation_prompt)

    final_state = GRAPH_PDF.invoke(initial_state)
    logger.info(
        "run_evaluation_pdf: done match=%s not_matches=%s unsure=%s likely_matches=%s",
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
        evaluation_has_match=(
            final_state.get("evaluation_summary", {}) or {}
        ).get("has_match"),
        evaluation_summary=(
            final_state.get("evaluation_summary", {}) or {}
        ).get("summary"),
        total_reviewed=(
            len(final_state["not_matches"])
            + len(final_state["unsure"])
            + len(final_state["likely_matches"])
            + len(final_state["very_likely"])
            + (1 if final_state["match"] else 0)
        ),
    )
