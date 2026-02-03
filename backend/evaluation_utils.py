from __future__ import annotations

from config import logger
from llm import MODEL
from schemas import EvalState, StudyDto


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


def invoke_structured(state: EvalState, messages: list, schema: object):
    llm = get_llm(state)
    last_exc: Exception | None = None
    for method in ("json_schema", "function_calling"):
        try:
            structured_llm = llm.with_structured_output(
                schema,
                method=method,
                strict=True,
            )
            return structured_llm.invoke(messages)
        except Exception as exc:
            last_exc = exc
            logger.info(
                "invoke_structured: method=%s error=%s",
                method,
                exc.__class__.__name__,
            )
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
