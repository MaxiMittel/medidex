from __future__ import annotations

BACKGROUND_PROMPT = (
    "You are a clinical research assistant tasked with determining whether a new report belongs to an existing candidate study."
    # "report to a candidate study, with the following priority order: "
    # "1. Trial registration number"
    # "2. Number of participants "
    # "3. Interventions "
    # "4. Conditions of participants "
    # "5. Author(s)."
)

PDF_ATTACHMENT_NOTE = (
    "If provided, the PDF attachment is the report being matched. The text payload "
    "includes pdf_attachment with attachment_index, report_id, and title. Use this "
    "attachment as supporting evidence."
)

DEFAULT_EVAL_PROMPT = (
    f"{BACKGROUND_PROMPT} "
    "Determine whether the study is relevant to the report's intent. This is the first pass: "
    "respond ONLY with one of not_match, unsure, or likely_match. Never respond match "
    "in this pass. Respond ONLY as json with keys: decision (not_match|unsure|likely_match) "
    "and reason."
)

DEFAULT_LIKELY_GROUP_PROMPT = (
    f"{BACKGROUND_PROMPT} "
    "You are reviewing studies previously marked as likely_match. Select 2 studies to "
    "mark as very_likely for a final comparison. Explain why you picked them but not the "
    "other studies. If none are strong, return an empty list. Respond ONLY as json "
    "with keys: very_likely_ids (array of study_id strings) and reason."
)

DEFAULT_LIKELY_COMPARE_PROMPT = (
    f"{BACKGROUND_PROMPT} "
    "You are comparing the 2 very_likely studies to decide if any is a definitive match. "
    "Choose at most one match if you are highly confident; otherwise respond unsure. "
    "Explain why you picked that study and not the other. Respond ONLY as json with keys: decision "
    "(match|unsure), study_id (required if match), and reason."
)

DEFAULT_UNSURE_REVIEW_PROMPT = (
    f"{BACKGROUND_PROMPT} "
    "You are reviewing unsure studies. Use the rejected likely_match list as historical "
    "context. Only choose match if you are highly confident; otherwise respond unsure or "
    "not_match. "
    "Respond ONLY as json with keys: decision (match|unsure|not_match) and reason."
)

DEFAULT_SUMMARY_PROMPT = (
    f"{BACKGROUND_PROMPT} "
    "You are summarizing the evaluation results for the report. Use the report details "
    "and prior decisions. If there is a match, explain why it matches and explicitly "
    "state why the other studies are not matched. If there is no match, explain why no "
    "study matches, and suggest the creation of a new study with certain fields. You "
    "Respond ONLY as json with keys: has_match (boolean) and summary."
)
