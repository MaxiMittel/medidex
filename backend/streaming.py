from __future__ import annotations

from schemas import StudyDto


# Global state tracker to remember current study across nodes
_current_study = None


def summarize_stream_event(event: dict) -> dict:
    global _current_study
    
    if not isinstance(event, dict) or not event:
        return {"event": "unknown", "message": "Empty stream event."}

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

    match node:
        case "load_next_initial" | "load_next_unsure":
            current = update.get("current")
            _current_study = current  # Remember for next nodes
            info = extract_study_info(current)
            if info.get("study_id") is None:
                summary["message"] = "No more studies."
            else:
                summary["message"] = (
                    f"Loaded study with ID {info.get('study_id')} ({info.get('short_name')})."
                )
                summary["details"] = info
        case "prepare_report_pdf":
            status = update.get("pdf_status")
            if status == "disabled":
                summary["message"] = "Report PDF inclusion disabled."
            else:
                attachment = update.get("report_pdf_attachment")
                if attachment:
                    summary["message"] = "Attached report PDF for evaluation."
                    summary["details"] = {
                        "report_id": attachment.get("report_id"),
                        "title": attachment.get("title"),
                    }
                else:
                    summary["message"] = "No report PDF attached."
        case "classify_initial":
            decision = update.get("decision")
            reason = update.get("reason")
            idx = update.get("idx")
            study_id = update.get("study_id")
            # Fallback: if study_id is missing, extract from _current_study
            if not study_id and _current_study:
                study_info = extract_study_info(_current_study)
                study_id = study_info.get("study_id")
            if study_id:
                summary["message"] = (
                    f"Initial classification for Study ID {study_id}: {decision}. {reason}"
                )
            else:
                summary["message"] = f"Initial classification: {decision}. {reason}"
            summary["details"] = {
                "study_id": study_id,
                "decision": update.get("decision"),
                "reason": reason,
                "idx": idx,
            }
        case "select_very_likely":
            very_likely = update.get("very_likely", []) or []
            selected_ids = [
                item.get("study_id") for item in very_likely if isinstance(item, dict)
            ]
            reason = update.get("reason")
            summary["message"] = "Selected very_likely candidates."
            summary["details"] = {
                "very_likely_ids": selected_ids,
                "reason": reason,
            }
            if selected_ids:
                summary["message"] = (
                    f"Selected very_likely candidates: {', '.join(selected_ids)}. {reason}"
                )
            else:
                summary["message"] = f"No very_likely candidates selected. {reason}"
        case "compare_very_likely":
            match = update.get("match")
            decision = update.get("decision")
            reason = update.get("reason")
            match_id = match.get("study_id") if isinstance(match, dict) else None
            summary["message"] = "Compared very_likely candidates."
            summary["details"] = {
                "decision": decision,
                "match_study_id": match_id,
                "reason": reason,
            }
            if decision == "match" and match_id:
                summary["message"] = f"Match found: {match_id}. {reason}"
            else:
                summary["message"] = f"No match from very_likely. {reason}"
        case "prepare_unsure_review":
            queue = update.get("unsure_queue", []) or []
            summary["message"] = f"Prepared unsure review queue ({len(queue)} studies)."
            summary["details"] = {"count": len(queue)}
        case "classify_unsure":
            decision = update.get("decision")
            reason = update.get("reason")
            study_id = update.get("study_id")
            # Fallback: if study_id is missing, extract from _current_study
            if not study_id and _current_study:
                study_info = extract_study_info(_current_study)
                study_id = study_info.get("study_id")
            summary["message"] = f"Unsure re-evaluation: {decision}. {reason}"
            summary["details"] = {
                "study_id": study_id,
                "decision": decision,
                "reason": reason,
            }
        case "summarize_evaluation":
            evaluation_summary = (
                update.get("evaluation_summary", {}) if isinstance(update, dict) else {}
            )
            has_match = evaluation_summary.get("has_match")
            summary_text = evaluation_summary.get("summary")
            if has_match is True:
                summary["message"] = f"Summary (match): {summary_text}"
            elif has_match is False:
                summary["message"] = f"Summary (no match): {summary_text}"
            else:
                summary["message"] = f"Summary: {summary_text}"
            summary["details"] = evaluation_summary
        case "match_not_found_end":
            summary["message"] = "No match found after all reviews."
        case _:
            summary["message"] = "Node completed."
            summary["details"] = update

    return summary
