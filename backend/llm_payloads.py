from __future__ import annotations

import json

from schemas import ReportDto, ReportPdfDto, StudyDto


def build_user_payload(report: ReportDto, study: StudyDto) -> str:
    """Serialize a single report + study for first-pass evaluation."""
    report_payload = report.model_dump()
    study_payload = study.model_dump()
    return json.dumps(
        {"report": report_payload, "study": study_payload},
        ensure_ascii=True,
        separators=(",", ":"),
    )


def build_likely_group_payload(
    report: ReportDto,
    candidates: list[dict],
    studies: list[StudyDto],
) -> str:
    """Serialize likely-match candidates for very-likely selection.

    Each candidate includes the original study + the initial reason.
    """
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
    """Serialize very-likely candidates for final comparison.

    Each candidate includes prior and group-level reasons for context.
    """
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
    """Serialize the unsure review context.

    Includes rejected likely-match history plus the current study and its prior reason.
    """
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


def build_summary_payload(
    report: ReportDto,
    studies: list[StudyDto],
    match: dict | None,
    not_matches: list[dict],
    unsure: list[dict],
    likely_matches: list[dict],
    very_likely: list[dict],
) -> str:
    """Serialize the full evaluation state for final summarization."""
    by_id = {str(study.CRGStudyID): study for study in studies}

    def attach_study(item: dict) -> dict:
        study_id = str(item.get("study_id", ""))
        study = by_id.get(study_id)
        return {
            "study_id": study_id,
            "study": study.model_dump() if study else None,
            "decision": item.get("decision"),
            "reason": item.get("reason"),
        }

    payload = {
        "report": report.model_dump(),
        "match": attach_study(match) if match else None,
        "not_matches": [attach_study(item) for item in not_matches],
        "unsure": [attach_study(item) for item in unsure],
        "likely_matches": [attach_study(item) for item in likely_matches],
        "very_likely": very_likely,
    }
    return json.dumps(payload, ensure_ascii=True, separators=(",", ":"))


def build_user_payload_pdf(
    report_pdf: ReportPdfDto, 
    study: StudyDto, 
    pdf_file_id: str | None = None
) -> list[dict]:
    """Build content blocks for PDF report + study evaluation (OpenAI format).
    
    Uses OpenAI file reference if pdf_file_id is provided (optimization),
    otherwise falls back to inline base64 encoding.
    
    Args:
        report_pdf: PDF report data with base64 content
        study: Study to compare against
        pdf_file_id: Optional OpenAI file ID for the uploaded PDF
    """
    # Use file reference if available (efficient), otherwise inline base64
    if pdf_file_id:
        pdf_block = {
            "type": "file",
            "file_id": pdf_file_id
        }
    else:
        pdf_block = {
            "type": "file",
            "base64": report_pdf.PDFContent,
            "mime_type": "application/pdf",
            "filename": f"report_{report_pdf.CRGReportID}.pdf"
        }
    
    return [
        pdf_block,
        {
            "type": "text",
            "text": json.dumps({
                "report_metadata": {
                    "CRGReportID": report_pdf.CRGReportID,
                    "CENTRALReportID": report_pdf.CENTRALReportID,
                    "Title": report_pdf.Title,
                    "Year": report_pdf.Year,
                    "Authors": report_pdf.Authors,
                    "City": report_pdf.City
                },
                "study": study.model_dump()
            })
        }
    ]

