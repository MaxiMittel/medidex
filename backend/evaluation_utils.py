from __future__ import annotations

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
