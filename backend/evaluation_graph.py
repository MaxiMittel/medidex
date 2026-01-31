from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from .config import logger
from .evaluation_utils import (
    get_bucket_entry,
    get_study_by_id,
    remove_from_bucket,
    upsert_bucket,
)
from .llm import MODEL
from .llm_payloads import (
    build_likely_compare_payload,
    build_likely_group_payload,
    build_summary_payload,
    build_unsure_review_payload,
    build_user_payload,
)
from .parsers import (
    parse_initial_response,
    parse_likely_compare_response,
    parse_likely_group_response,
    parse_summary_response,
    parse_unsure_review_response,
)
from .prompts import (
    DEFAULT_EVAL_PROMPT,
    DEFAULT_LIKELY_COMPARE_PROMPT,
    DEFAULT_LIKELY_GROUP_PROMPT,
    DEFAULT_SUMMARY_PROMPT,
    DEFAULT_UNSURE_REVIEW_PROMPT,
)
from .schemas import EvalState


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


def load_next_initial(state: EvalState) -> dict:
    """Load the next study for the initial pass, or mark completion."""
    idx = state["idx"]
    logger.info("load_next_initial: idx=%s total=%s", idx, len(state["studies"]))
    if idx >= len(state["studies"]):
        logger.info("load_next_initial: no_more_studies")
        return {"current": None}

    current = state["studies"][idx]
    logger.info(
        "load_next_initial: study_id=%s short_name=%s",
        current.CRGStudyID,
        current.ShortName,
    )
    return {
        "current": current,
        "decision": None,
        "reason": None,
    }


def route_after_initial_load(state: EvalState) -> str:
    """Route to initial classification or to the likely-match stage when done."""
    next_step = "no_more_initial" if state.get("current") is None else "has_study"
    logger.info("route_after_initial_load: next=%s", next_step)
    return next_step


def classify_initial(state: EvalState) -> dict:
    """Run first-pass LLM classification and place the study into a bucket."""
    current = state["current"]
    if current is None:
        logger.info("classify_initial: no_current_study")
        return {"decision": "unsure", "reason": "No study loaded."}

    logger.info("classify_initial: study_id=%s", current.CRGStudyID)
    user_payload = build_user_payload(state["report"], current)
    prompt = get_prompt(state, "initial_eval_prompt", DEFAULT_EVAL_PROMPT)
    logger.info("classify_initial: prompt_used=%s", prompt[:60])
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        messages.append(HumanMessage(content=user_payload))
        response = get_llm(state).invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        decision, reason = parse_initial_response(text)
        logger.info("classify_initial: decision=%s", decision)
    except Exception as exc:
        decision, reason = "unsure", f"LLM call failed: {exc.__class__.__name__}"
        logger.info("classify_initial: error=%s", exc.__class__.__name__)
        logger.info("classify_initial: reason=%s", str(exc))
    idx = state["idx"]

    study_id = str(current.CRGStudyID) if current else f"index-{idx}"
    result = {"study_id": study_id, "decision": decision, "reason": reason}

    not_matches = list(state["not_matches"])
    unsure = list(state["unsure"])
    likely_matches = list(state["likely_matches"])

    if decision == "not_match":
        not_matches.append(result)
    elif decision == "likely_match":
        likely_matches.append(result)
    else:
        unsure.append(result)

    return {
        "study_id": study_id,
        "decision": decision,
        "reason": reason,
        "not_matches": not_matches,
        "unsure": unsure,
        "likely_matches": likely_matches,
        "idx": idx + 1,
    }


def select_very_likely(state: EvalState) -> dict:
    """Choose up to two very-likely studies from the likely-match bucket."""
    candidates = list(state.get("likely_matches", []))
    if not candidates:
        logger.info("select_very_likely: no_candidates")
        return {
            "decision": "unsure",
            "reason": "No likely matches to review.",
            "likely_matches": [],
            "very_likely": [],
        }

    candidate_ids = {str(item.get("study_id")) for item in candidates if item.get("study_id")}
    payload = build_likely_group_payload(state["report"], candidates, state["studies"])
    prompt = get_prompt(state, "likely_group_prompt", DEFAULT_LIKELY_GROUP_PROMPT)
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        messages.append(HumanMessage(content=payload))
        response = get_llm(state).invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        selected_ids, reason = parse_likely_group_response(text, candidate_ids)
        logger.info("select_very_likely: selected=%s", selected_ids)
    except Exception as exc:
        selected_ids, reason = [], f"LLM call failed: {exc.__class__.__name__}"
        logger.info("select_very_likely: error=%s", exc.__class__.__name__)
        logger.info("select_very_likely: reason=%s", str(exc))

    selected_set = set(selected_ids)
    likely_matches: list[dict] = []
    very_likely: list[dict] = []
    unsure = list(state["unsure"])
    rejected_likely = list(state.get("rejected_likely", []))

    for item in candidates:
        study_id = str(item.get("study_id"))
        prior_reason = item.get("reason")
        if study_id in selected_set:
            likely_matches.append(
                {"study_id": study_id, "decision": "likely_match", "reason": reason}
            )
            very_likely.append(
                {
                    "study_id": study_id,
                    "prior_reason": prior_reason,
                    "group_reason": reason,
                }
            )
        else:
            unsure = upsert_bucket(
                unsure,
                {
                    "study_id": study_id,
                    "decision": "unsure",
                    "reason": f"Not selected as very_likely: {reason}",
                },
            )
            rejected_likely.append(
                {
                    "study_id": study_id,
                    "initial_reason": prior_reason,
                    "review_reason": reason,
                }
            )

    return {
        "decision": "unsure",
        "reason": reason,
        "likely_matches": likely_matches,
        "very_likely": very_likely,
        "unsure": unsure,
        "rejected_likely": rejected_likely,
    }


def route_after_very_likely_selection(state: EvalState) -> str:
    """Route to comparison if very-likely exists, else move to unsure review."""
    next_step = "has_very_likely" if state.get("very_likely") else "no_very_likely"
    logger.info("route_after_very_likely_selection: next=%s", next_step)
    return next_step


def compare_very_likely(state: EvalState) -> dict:
    """Compare very-likely studies to confirm a single match or defer to unsure."""
    candidates = list(state.get("very_likely", []))
    if not candidates:
        logger.info("compare_very_likely: no_candidates")
        return {
            "decision": "unsure",
            "reason": "No very_likely candidates to compare.",
            "very_likely": [],
        }

    candidate_ids = {str(item.get("study_id")) for item in candidates if item.get("study_id")}
    payload = build_likely_compare_payload(state["report"], candidates, state["studies"])
    prompt = get_prompt(state, "likely_compare_prompt", DEFAULT_LIKELY_COMPARE_PROMPT)
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        messages.append(HumanMessage(content=payload))
        response = get_llm(state).invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        decision, reason, study_id = parse_likely_compare_response(text, candidate_ids)
        logger.info("compare_very_likely: decision=%s", decision)
    except Exception as exc:
        decision, reason, study_id = "unsure", f"LLM call failed: {exc.__class__.__name__}", None
        logger.info("compare_very_likely: error=%s", exc.__class__.__name__)
        logger.info("compare_very_likely: reason=%s", str(exc))

    match = state["match"]
    likely_matches = list(state.get("likely_matches", []))
    unsure = list(state["unsure"])
    rejected_likely = list(state.get("rejected_likely", []))

    if decision == "match" and study_id:
        if match is None:
            match = {"study_id": study_id, "decision": "match", "reason": reason}
        remaining_very_likely = [
            item for item in candidates if str(item.get("study_id")) != study_id
        ]
        for item in candidates:
            cid = str(item.get("study_id"))
            likely_matches = remove_from_bucket(likely_matches, cid)
        return {
            "decision": decision,
            "reason": reason,
            "match": match,
            "likely_matches": likely_matches,
            "very_likely": remaining_very_likely,
        }

    for item in candidates:
        cid = str(item.get("study_id"))
        prior_reason = item.get("prior_reason")
        likely_matches = remove_from_bucket(likely_matches, cid)
        unsure = upsert_bucket(
            unsure,
            {
                "study_id": cid,
                "decision": "unsure",
                "reason": f"Very likely but no definitive match: {reason}",
            },
        )
        rejected_likely.append(
            {
                "study_id": cid,
                "initial_reason": prior_reason,
                "review_reason": reason,
            }
        )

    return {
        "decision": decision,
        "reason": reason,
        "match": match,
        "likely_matches": likely_matches,
        "unsure": unsure,
        "rejected_likely": rejected_likely,
    }


def route_after_very_likely_compare(state: EvalState) -> str:
    """Route to summary if a match is found, otherwise continue to unsure review."""
    next_step = "match_found" if state.get("match") is not None else "no_match_after_compare"
    logger.info("route_after_very_likely_compare: next=%s", next_step)
    return next_step


def prepare_unsure_review(state: EvalState) -> dict:
    """Initialize the unsure queue for a second-pass review."""
    queue = [str(item.get("study_id")) for item in state.get("unsure", []) if item.get("study_id")]
    logger.info("prepare_unsure_review: count=%s", len(queue))
    return {
        "unsure_queue": queue,
        "unsure_idx": 0,
        "current": None,
        "decision": None,
        "reason": None,
    }


def load_next_unsure(state: EvalState) -> dict:
    """Load the next unsure study to re-evaluate, or mark completion."""
    idx = state["unsure_idx"]
    queue = state.get("unsure_queue", [])
    logger.info("load_next_unsure: idx=%s total=%s", idx, len(queue))
    while idx < len(queue):
        study_id = queue[idx]
        current = get_study_by_id(state["studies"], study_id)
        if current is not None:
            logger.info(
                "load_next_unsure: study_id=%s short_name=%s",
                current.CRGStudyID,
                current.ShortName,
            )
            return {
                "current": current,
                "decision": None,
                "reason": None,
                "unsure_idx": idx,
            }
        logger.info("load_next_unsure: missing_study_id=%s", study_id)
        idx += 1

    logger.info("load_next_unsure: no_more_unsure")
    return {"current": None, "unsure_idx": idx}


def route_after_unsure_load(state: EvalState) -> str:
    """Route based on whether a match already exists, or if more unsure remain."""
    if state.get("match") is not None:
        next_step = "match_found"
    elif state.get("current") is None:
        next_step = "match_not_found"
    else:
        next_step = "has_unsure"
    logger.info("route_after_unsure_load: next=%s", next_step)
    return next_step


def classify_unsure(state: EvalState) -> dict:
    """Re-evaluate an unsure study and update buckets or set a final match."""
    current = state["current"]
    if current is None:
        logger.info("classify_unsure: no_current_study")
        return {"decision": "unsure", "reason": "No study loaded."}

    study_id = str(current.CRGStudyID)
    prior_entry = get_bucket_entry(state.get("unsure", []), study_id)
    prior_reason = prior_entry.get("reason") if prior_entry else None

    logger.info("classify_unsure: study_id=%s", study_id)
    payload = build_unsure_review_payload(
        state["report"],
        state.get("rejected_likely", []),
        current,
        prior_reason,
        state["studies"],
    )
    prompt = get_prompt(state, "unsure_review_prompt", DEFAULT_UNSURE_REVIEW_PROMPT)
    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        messages.append(HumanMessage(content=payload))
        response = get_llm(state).invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        decision, reason = parse_unsure_review_response(text)
        logger.info("classify_unsure: decision=%s", decision)
    except Exception as exc:
        decision, reason = "unsure", f"LLM call failed: {exc.__class__.__name__}"
        logger.info("classify_unsure: error=%s", exc.__class__.__name__)
        logger.info("classify_unsure: reason=%s", str(exc))

    match = state["match"]
    not_matches = list(state["not_matches"])
    unsure = list(state["unsure"])

    if decision == "match":
        if match is None:
            match = {"study_id": study_id, "decision": "match", "reason": reason}
        unsure = remove_from_bucket(unsure, study_id)
    elif decision == "not_match":
        unsure = remove_from_bucket(unsure, study_id)
        not_matches = upsert_bucket(
            not_matches,
            {"study_id": study_id, "decision": "not_match", "reason": reason},
        )
    else:
        unsure = upsert_bucket(
            unsure,
            {"study_id": study_id, "decision": "unsure", "reason": reason},
        )

    return {
        "decision": decision,
        "reason": reason,
        "match": match,
        "not_matches": not_matches,
        "unsure": unsure,
        "unsure_idx": state["unsure_idx"] + 1,
    }


def match_not_found_end(state: EvalState) -> dict:
    """Terminal node when no match is found after all reviews."""
    logger.info("match_not_found_end: no_match")
    return {}


def summarize_evaluation(state: EvalState) -> dict:
    """Summarize the full evaluation state into a final explanation."""
    payload = build_summary_payload(
        state["report"],
        state["studies"],
        state.get("match"),
        state.get("not_matches", []),
        state.get("unsure", []),
        state.get("likely_matches", []),
        state.get("very_likely", []),
    )
    prompt = get_prompt(state, "summary_prompt", DEFAULT_SUMMARY_PROMPT)

    try:
        messages: list[SystemMessage | HumanMessage] = [SystemMessage(content=prompt)]
        messages.append(HumanMessage(content=payload))
        response = get_llm(state).invoke(messages)
        content = response.content
        text = content if isinstance(content, str) else json.dumps(content, ensure_ascii=True)
        has_match, summary = parse_summary_response(text)
        logger.info("summarize_evaluation: has_match=%s", has_match)
    except Exception as exc:
        has_match, summary = None, f"LLM call failed: {exc.__class__.__name__}"
        logger.info("summarize_evaluation: error=%s", exc.__class__.__name__)
        logger.info("summarize_evaluation: reason=%s", str(exc))

    return {
        "evaluation_summary": {
            "has_match": has_match,
            "summary": summary,
        }
    }


def build_graph():
    """Construct the LangGraph workflow and its routing rules.

    Flow:
    - Initial pass: load_next_initial -> classify_initial -> (loop) -> select_very_likely
    - Likely pass: select_very_likely -> compare_very_likely -> summarize_evaluation
      (or -> prepare_unsure_review if no definitive match)
    - Unsure pass: prepare_unsure_review -> load_next_unsure -> classify_unsure (loop)
      -> match_not_found_end -> summarize_evaluation
    """
    logger.info("build_graph: init")
    graph = StateGraph(EvalState)
    graph.add_node("load_next_initial", load_next_initial)
    graph.add_node("classify_initial", classify_initial)
    graph.add_node("select_very_likely", select_very_likely)
    graph.add_node("compare_very_likely", compare_very_likely)
    graph.add_node("prepare_unsure_review", prepare_unsure_review)
    graph.add_node("load_next_unsure", load_next_unsure)
    graph.add_node("classify_unsure", classify_unsure)
    graph.add_node("match_not_found_end", match_not_found_end)
    graph.add_node("summarize_evaluation", summarize_evaluation)

    graph.set_entry_point("load_next_initial")
    graph.add_conditional_edges(
        "load_next_initial",
        route_after_initial_load,
        {"has_study": "classify_initial", "no_more_initial": "select_very_likely"},
    )
    graph.add_edge("classify_initial", "load_next_initial")

    graph.add_conditional_edges(
        "select_very_likely",
        route_after_very_likely_selection,
        {"has_very_likely": "compare_very_likely", "no_very_likely": "prepare_unsure_review"},
    )
    graph.add_conditional_edges(
        "compare_very_likely",
        route_after_very_likely_compare,
        {"match_found": "summarize_evaluation", "no_match_after_compare": "prepare_unsure_review"},
    )

    graph.add_edge("prepare_unsure_review", "load_next_unsure")
    graph.add_conditional_edges(
        "load_next_unsure",
        route_after_unsure_load,
        {
            "has_unsure": "classify_unsure",
            "match_not_found": "match_not_found_end",
            "match_found": "summarize_evaluation",
        },
    )
    graph.add_edge("classify_unsure", "load_next_unsure")
    graph.add_edge("match_not_found_end", "summarize_evaluation")
    graph.add_edge("summarize_evaluation", END)
    return graph.compile()


GRAPH = build_graph()
