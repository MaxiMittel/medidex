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

PDF_ATTACHMENT_PAYLOAD_NOTE = (
    "The text payload includes pdf_attachment with attachment_index, report_id, and title."
)

PDF_ATTACHMENT_NOTE = (
    "If provided, the PDF attachment is the report being matched. Use this attachment "
    "as supporting evidence."
)

SUMMARY_MARKDOWN_NOTE = (
    "Return the summary field in markdown. Do not wrap the output in code fences."
)

from constants import (
    CENTRAL_SUBMISSION_STATUS_OPTIONS,
    COUNTRY_OPTIONS,
    DURATION_UNCERTAIN_VALUE,
    DURATION_UNITS,
    STATUS_OF_STUDY_OPTIONS,
)

_COUNTRY_OPTIONS_TEXT = ", ".join(COUNTRY_OPTIONS)
_STATUS_OPTIONS_TEXT = ", ".join(STATUS_OF_STUDY_OPTIONS)
_CENTRAL_STATUS_OPTIONS_TEXT = ", ".join(CENTRAL_SUBMISSION_STATUS_OPTIONS)
_DURATION_UNITS_TEXT = "|".join(DURATION_UNITS)

SUGGEST_NEW_STUDY_PROMPT = (
    "You are suggesting the creation of a new study based on the report and the evaluation context. "
    "Return a single new_study object that fits the add-study form. "
    f"Allowed status_of_study values: {_STATUS_OPTIONS_TEXT}. "
    f"Allowed central_submission_status values: {_CENTRAL_STATUS_OPTIONS_TEXT}. "
    f"Allowed countries values: {_COUNTRY_OPTIONS_TEXT}. "
    f"duration must be '{DURATION_UNCERTAIN_VALUE}' or '<number> <unit>' where unit is {_DURATION_UNITS_TEXT}. "
    "number_of_participants must be a numeric string. "
    "Example output: "
    "{"
    "\"new_study\":{"
    "\"short_name\":\"Zhang 2025 - Group counseling for schizophrenia\","
    "\"status_of_study\":\"Planned\","
    "\"countries\":\"Unclear\","
    "\"central_submission_status\":\"Pending\","
    "\"duration\":\"3 months\","
    "\"number_of_participants\":\"600\","
    "\"comparison\":\"Group psychological counseling vs usual care\""
    "}"
    "}"
)

DEFAULT_EVAL_PROMPT = (
    "Determine whether the study is relevant to the report's intent. This is the first pass: "
    "respond ONLY with one of not_match, unsure, or likely_match. Never respond match "
    "in this pass."
)

DEFAULT_LIKELY_GROUP_PROMPT = (
    "You are reviewing studies previously marked as likely_match. Select 2 studies to "
    "mark as very_likely for a final comparison. Explain why you picked them but not the "
    "other studies. If none are strong, return an empty list."
)

DEFAULT_LIKELY_COMPARE_PROMPT = (
    "You are comparing the 2 very_likely studies to decide if any is a definitive match. "
    "Choose at most one match if you are highly confident; otherwise respond unsure. "
    "Explain why you picked that study and not the other."
)

DEFAULT_UNSURE_REVIEW_PROMPT = (
    "You are reviewing unsure studies. Use the rejected likely_match list as historical "
    "context. Only choose match if you are highly confident; otherwise respond unsure or "
    "not_match."
)

DEFAULT_SUMMARY_PROMPT = (
    "You are summarizing the evaluation results for the report. Use the report details "
    "and prior decisions. If there is a match, explain why it matches and explicitly "
    "state why the other studies are not matched. If there is no match, explain why no "
    "study matches."
)
