from __future__ import annotations

from schemas import StudyDto


# Global state tracker to remember current study across nodes
_current_study = None


def summarize_stream_event(event: dict) -> dict:
    """
    Summarize stream events from LangGraph updates.
    With stream_mode="updates", we receive {node_name: return_value} for each node.
    """
    global _current_study
    
    if not isinstance(event, dict) or not event:
        return None

    node, update = next(iter(event.items()))
    update = update or {}
    summary: dict[str, object] = {"event": "node", "node": node}

    def extract_study_info(value: object) -> dict:
        if isinstance(value, StudyDto):
            return {"study_id": value.CRGStudyID, "short_name": value.ShortName}
        if isinstance(value, dict):
            return {
                "study_id": value.get("CRGStudyID"),
                "short_name": value.get("ShortName"),
            }
        return {}

    # Handle each node type
    if node in {"load_next_initial", "load_next_unsure"}:
        current = update.get("current")
        _current_study = current  # Remember for next nodes
        info = extract_study_info(current)
        if info.get("study_id") is None:
            summary["message"] = "No more studies."
        else:
            summary["message"] = f"Loaded study with ID {info.get('study_id')} ({info.get('short_name')})."
        summary["details"] = info
    
    elif node == "classify_initial":
        # classify_initial returns: {study_id, decision, reason, not_matches, unsure, likely_matches, idx}
        # But study_id is NOT in state schema, so use _current_study instead
        study_id = update.get("study_id")
        if not study_id and _current_study:
            study_info = extract_study_info(_current_study)
            study_id = study_info.get("study_id")
        
        decision = update.get("decision")
        reason = update.get("reason")
        idx = update.get("idx")
        
        summary["message"] = f"Initial classification for Study ID {study_id}: {decision}. {reason}"
        summary["details"] = {
            "study_id": study_id,
            "decision": decision,
            "reason": reason,
            "idx": idx,
        }
    
    elif node == "classify_unsure":
        # classify_unsure returns: {study_id, decision, reason, match, not_matches, unsure, unsure_idx}
        # But study_id is NOT in state schema, so use _current_study instead
        study_id = update.get("study_id")
        if not study_id and _current_study:
            study_info = extract_study_info(_current_study)
            study_id = study_info.get("study_id")
        
        decision = update.get("decision")
        reason = update.get("reason")
        
        summary["message"] = f"Unsure re-evaluation for Study ID {study_id}: {decision}. {reason}"
        summary["details"] = {
            "study_id": study_id,
            "decision": decision,
            "reason": reason,
        }
    
    elif node == "select_very_likely":
        # select_very_likely returns: {very_likely, reason}
        very_likely = update.get("very_likely", [])
        selected_ids = [item.get("study_id") for item in very_likely if isinstance(item, dict)]
        reason = update.get("reason")
        
        if selected_ids:
            summary["message"] = f"Selected very_likely candidates: {', '.join(map(str, selected_ids))}. {reason or ''}"
        else:
            summary["message"] = f"No very_likely candidates selected. {reason or ''}"
        summary["details"] = {
            "very_likely_ids": selected_ids,
            "reason": reason,
        }
    
    elif node == "compare_very_likely":
        # compare_very_likely returns: {decision, match, reason}
        decision = update.get("decision")
        match = update.get("match")
        reason = update.get("reason")
        match_id = match.get("study_id") if isinstance(match, dict) else None
        
        if decision == "match":
            summary["message"] = f"Match found! Study ID {match_id} is the final match. {reason or ''}"
        else:
            summary["message"] = f"No match found. {reason or ''}"
        
        summary["details"] = {
            "decision": decision,
            "match_study_id": match_id,
            "reason": reason,
        }
    
    elif node == "summarize_evaluation":
        # summarize_evaluation returns: {evaluation_summary}
        eval_summary = update.get("evaluation_summary", {})
        has_match = eval_summary.get("has_match")
        summary_text = eval_summary.get("summary", "Evaluation complete.")
        
        if has_match is True:
            summary["message"] = f"Summary (match found): {summary_text}"
        elif has_match is False:
            summary["message"] = f"Summary (no match): {summary_text}"
        else:
            summary["message"] = f"Summary: {summary_text}"
        summary["details"] = eval_summary
    
    else:
        # Internal routing nodes we don't show
        return None

    return summary
