from __future__ import annotations

import json

from .schemas import Decision


def parse_initial_response(text: str) -> tuple[Decision, str]:
    """Parse the first-pass classifier response.

    Expected JSON: {"decision": "not_match|unsure|likely_match", "reason": "<text>"}.
    Returns a safe fallback ("unsure") with an explanatory reason on any validation error.
    """
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
    """Parse the very-likely selection response.

    Expected JSON: {"very_likely_ids": ["<study_id>", ...], "reason": "<text>"}.
    Filters IDs to the provided candidate set and returns at most two selections.
    """
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
    """Parse the unsure-review response.

    Expected JSON: {"decision": "match|unsure|not_match", "reason": "<text>"}.
    Returns a safe fallback ("unsure") with an explanatory reason on any validation error.
    """
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


def parse_summary_response(text: str) -> tuple[bool | None, str]:
    """Parse the summary response.

    Expected JSON: {"has_match": true|false, "summary": "<text>"}.
    Returns (None, <reason>) if the payload is invalid or incomplete.
    """
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return None, f"Non-JSON response: {text[:300]}"

    has_match = payload.get("has_match")
    summary = payload.get("summary")
    if not isinstance(has_match, bool):
        return None, "Missing or invalid has_match in model response."
    if not isinstance(summary, str) or not summary.strip():
        return has_match, "Missing summary in model response."
    return has_match, summary.strip()


def parse_likely_compare_response(
    text: str, candidate_ids: set[str]
) -> tuple[Decision, str, str | None]:
    """Parse the very-likely comparison response.

    Expected JSON: {"decision": "match|unsure", "study_id": "<id>", "reason": "<text>"}.
    If decision == match, study_id must exist and be in candidate_ids.
    """
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
