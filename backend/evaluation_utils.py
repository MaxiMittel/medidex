from __future__ import annotations

import os
import time

from .config import logger
from .llm import MODEL
from .schemas import EvalState, StudyDto


def get_llm(state: EvalState):
    llm = state.get("llm")
    return llm if llm is not None else MODEL


def get_prompt(state: EvalState, key: str, default: str) -> str:
    overrides = state.get("prompt_overrides") or {}
    if isinstance(overrides, dict):
        override = overrides.get(key)
        if isinstance(override, str) and override.strip():
            return override
    return default


def get_background_prompt(state: EvalState, default: str) -> str:
    overrides = state.get("prompt_overrides") or {}
    if isinstance(overrides, dict):
        override = overrides.get("background_prompt")
        if isinstance(override, str) and override.strip():
            return override
    return default


def apply_background_prompt(prompt: str, background: str) -> str:
    if not background.strip():
        return prompt
    if background.strip() in prompt:
        return prompt
    return f"{background} {prompt}"


def append_prompt_note(prompt: str, note: str) -> str:
    if not note.strip():
        return prompt
    return f"{prompt} {note}"


def _get_llm_retry_settings() -> tuple[int, float]:
    try:
        max_retries = int(os.getenv("LLM_STRUCTURED_RETRIES", "1"))
    except ValueError:
        max_retries = 1
    try:
        base_backoff = float(os.getenv("LLM_STRUCTURED_RETRY_BACKOFF_SECONDS", "0.5"))
    except ValueError:
        base_backoff = 0.5
    return max(0, max_retries), max(0.0, base_backoff)


def invoke_structured(state: EvalState, messages: list, schema: object):
    llm = get_llm(state)
    max_retries, base_backoff = _get_llm_retry_settings()
    total_attempts = max_retries + 1
    last_exc: Exception | None = None
    for method in ("json_schema", "function_calling"):
        try:
            structured_llm = llm.with_structured_output(
                schema,
                method=method,
                strict=True,
            )
        except Exception as exc:
            last_exc = exc
            logger.info(
                "invoke_structured: method=%s setup_error=%s",
                method,
                exc.__class__.__name__,
            )
            continue

        for attempt in range(total_attempts):
            try:
                return structured_llm.invoke(messages)
            except Exception as exc:
                last_exc = exc
                attempt_num = attempt + 1
                logger.info(
                    "invoke_structured: method=%s attempt=%s/%s error=%s",
                    method,
                    attempt_num,
                    total_attempts,
                    exc.__class__.__name__,
                )
                if attempt < max_retries:
                    time.sleep(base_backoff * (2 ** attempt))
    if last_exc:
        raise last_exc
    raise RuntimeError("invoke_structured: unknown error")


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
