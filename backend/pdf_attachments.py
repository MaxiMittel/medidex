from __future__ import annotations

from config import logger
from meerkat_client import fetch_report_pdf, fetch_reports_for_study
from pdf_utils import (
    encode_pdf_to_base64,
    get_cached_report_file_id,
    upload_pdf_to_openai_cached,
)
from schemas import StudyDto


def build_study_report_attachments(
    studies: list[StudyDto],
) -> dict[str, list[dict]]:
    """Fetch and prepare PDF attachments for each study's associated reports."""
    study_report_pdfs: dict[str, list[dict]] = {}
    study_reports: dict[str, list[dict]] = {}
    report_titles: dict[int, str | None] = {}

    # Phase 1: collect reports per study (no PDF work yet)
    for study in studies:
        study_id = str(study.CRGStudyID)
        reports = fetch_reports_for_study(study.CRGStudyID)
        normalized: list[dict] = []
        for report_item in reports:
            report_id = report_item.get("CRGReportID") or report_item.get("CRGReportId")
            if report_id is None:
                continue
            report_id = int(report_id)
            title = report_item.get("Title") or report_item.get("title")
            report_titles[report_id] = title
            normalized.append(
                {
                    "study_id": study_id,
                    "report_id": report_id,
                    "title": title,
                }
            )
        study_reports[study_id] = normalized

    # Phase 2: fetch all PDFs first (skip if cached)
    pdf_bytes_by_report: dict[int, bytes] = {}
    for reports in study_reports.values():
        for report in reports:
            report_id = report["report_id"]
            if get_cached_report_file_id(report_id):
                continue
            if report_id in pdf_bytes_by_report:
                continue
            pdf_bytes = fetch_report_pdf(report_id)
            if not pdf_bytes:
                logger.warning(
                    "build_study_report_attachments: missing PDF report_id=%s",
                    report_id,
                )
                continue
            pdf_bytes_by_report[report_id] = pdf_bytes

    # Phase 3: upload all fetched PDFs (or fallback to base64)
    upload_results: dict[int, dict] = {}
    for report_id, pdf_bytes in pdf_bytes_by_report.items():
        try:
            pdf_base64 = encode_pdf_to_base64(pdf_bytes)
        except Exception as exc:
            logger.warning(
                "build_study_report_attachments: encode failed report_id=%s error=%s",
                report_id,
                exc,
            )
            continue
        file_id = upload_pdf_to_openai_cached(
            report_id,
            pdf_base64,
            filename=f"report_{report_id}.pdf",
        )
        if file_id:
            upload_results[report_id] = {
                "file_id": file_id,
                "base64": None,
            }
        else:
            logger.warning(
                "build_study_report_attachments: PDF upload failed, using inline base64 report_id=%s",
                report_id,
            )
            upload_results[report_id] = {
                "file_id": None,
                "base64": pdf_base64,
            }

    # Phase 4: build attachments per study
    for study_id, reports in study_reports.items():
        attachments: list[dict] = []
        for report in reports:
            report_id = report["report_id"]
            title = report_titles.get(report_id)
            cached_file_id = get_cached_report_file_id(report_id)
            if cached_file_id:
                attachments.append(
                    {
                        "study_id": study_id,
                        "report_id": report_id,
                        "title": title,
                        "file_id": cached_file_id,
                        "base64": None,
                    }
                )
                continue
            upload_info = upload_results.get(report_id)
            if not upload_info:
                continue
            attachments.append(
                {
                    "study_id": study_id,
                    "report_id": report_id,
                    "title": title,
                    "file_id": upload_info.get("file_id"),
                    "base64": upload_info.get("base64"),
                }
            )
        study_report_pdfs[study_id] = attachments

    return study_report_pdfs
