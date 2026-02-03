from __future__ import annotations

import base64
import io
from typing import Optional

from openai import OpenAI

from config import logger
from llm_payloads import build_content_blocks_with_report_pdf
from meerkat_client import fetch_report_pdf
from prompts import PDF_ATTACHMENT_NOTE
from schemas import EvalState, ReportDto

_REPORT_FILE_CACHE: dict[int, str] = {}


def encode_pdf_to_base64(pdf_bytes: bytes) -> str:
    """
    Encode PDF bytes to base64 string for native LLM upload.
    
    This allows sending the PDF directly to vision-capable models
    like Claude that can "read" PDFs natively, preserving tables
    and figures.
    
    Args:
        pdf_bytes: Raw PDF file bytes
        
    Returns:
        Base64 encoded string
    """
    return base64.b64encode(bytes(pdf_bytes)).decode("utf-8")


def get_cached_report_file_id(report_id: int) -> Optional[str]:
    return _REPORT_FILE_CACHE.get(report_id)


def cache_report_file_id(report_id: int, file_id: str) -> None:
    _REPORT_FILE_CACHE[report_id] = file_id


def upload_pdf_to_openai(pdf_base64: str, filename: str = "report.pdf") -> Optional[str]:
    """
    Upload a PDF to OpenAI Files API and return the file ID.
    
    This allows referencing the file in multiple requests without
    re-uploading, significantly reducing bandwidth and cost.
    
    Args:
        pdf_base64: Base64-encoded PDF string
        filename: Name for the uploaded file
        
    Returns:
        File ID string if successful, None if upload fails
    """
    try:
        client = OpenAI()
        pdf_bytes = base64.b64decode(pdf_base64)
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_file.name = filename
        
        response = client.files.create(
            file=pdf_file,
            purpose="assistants"
        )
        return response.id
    except Exception as e:
        logger.error(f"Failed to upload PDF to OpenAI: {e}")
        return None


def upload_pdf_to_openai_cached(
    report_id: int, pdf_base64: str, filename: str = "report.pdf"
) -> Optional[str]:
    cached = get_cached_report_file_id(report_id)
    if cached:
        return cached
    file_id = upload_pdf_to_openai(pdf_base64, filename=filename)
    if file_id:
        cache_report_file_id(report_id, file_id)
    return file_id


def build_report_pdf_attachment(report: ReportDto) -> dict | None:
    """Fetch and prepare a single PDF attachment for the report being matched."""
    report_id = report.CRGReportID
    pdf_bytes = fetch_report_pdf(report_id)
    if not pdf_bytes:
        logger.warning(
            "build_report_pdf_attachment: missing PDF report_id=%s",
            report_id,
        )
        return None

    try:
        pdf_base64 = encode_pdf_to_base64(pdf_bytes)
    except Exception as exc:
        logger.warning(
            "build_report_pdf_attachment: encode failed report_id=%s error=%s",
            report_id,
            exc,
        )
        return None

    file_id = upload_pdf_to_openai_cached(
        report_id,
        pdf_base64,
        filename=f"report_{report_id}.pdf",
    )
    if file_id:
        return {
            "report_id": report_id,
            "title": report.Title,
            "file_id": file_id,
            "base64": None,
        }

    logger.warning(
        "build_report_pdf_attachment: PDF upload failed, using inline base64 report_id=%s",
        report_id,
    )
    return {
        "report_id": report_id,
        "title": report.Title,
        "file_id": None,
        "base64": pdf_base64,
    }


def get_pdf_prompt_note(state: EvalState) -> str:
    overrides = state.get("prompt_overrides") or {}
    if isinstance(overrides, dict):
        override = overrides.get("pdf_prompt")
        if isinstance(override, str) and override.strip():
            return override
    return PDF_ATTACHMENT_NOTE


def apply_pdf_prompt_note(
    prompt: str,
    include_pdf: bool,
    has_attachment: bool,
    pdf_note: str,
) -> str:
    if not include_pdf or not has_attachment:
        return prompt
    return f"{prompt} {pdf_note}"


def build_human_content(state: EvalState, payload: str):
    if not state.get("include_pdf"):
        return payload
    attachment = state.get("report_pdf_attachment")
    if not attachment:
        return payload
    return build_content_blocks_with_report_pdf(payload, attachment)
