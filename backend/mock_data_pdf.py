"""Mock PDF data for testing PDF evaluation endpoints."""
from __future__ import annotations

import os
import sys

from pdf_utils import encode_pdf_to_base64
from schemas import ReportPdfDto, StudyDto

# Load the realistic medical research PDF
_PDF_PATH = os.path.join(os.path.dirname(__file__), "mock_vitamin_d_study.pdf")
try:
    with open(_PDF_PATH, "rb") as f:
        _PDF_BYTES = f.read()
    _PDF_BASE64 = encode_pdf_to_base64(_PDF_BYTES)
except FileNotFoundError:
    print(f"ERROR: Mock PDF file not found at {_PDF_PATH}", file=sys.stderr)
    print("Please ensure mock_vitamin_d_study.pdf exists in the backend directory.", file=sys.stderr)
    sys.exit(1)

# Mock PDF report with realistic medical research content
MOCK_PDF_REPORT = ReportPdfDto(
    CENTRALReportID=None,
    CRGReportID=1001,
    Title="Vitamin D Supplementation and Bone Mineral Density in Older Adults",
    Year=2022,
    Authors="Amanda Smith; Benjamin Lee",
    City="Boston",
    PDFContent=_PDF_BASE64,
)

# Reuse the same studies from mock_data.py
MOCK_STUDIES_PDF = [
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="180",
        TrialistContactDetails=None,
        Countries="US",
        CENTRALSubmissionStatus="Submitted",
        Duration="9 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2003,
        DateEntered="2022-06-20",
        Comparison="Vitamin D plus calcium vs placebo",
        CENTRALStudyID=5003,
        DateToCENTRAL="2022-07-15",
        ISRCTN="ISRCTN99887766",
        ShortName="Vitamin D and calcium in older adults",
        DateEdited="2022-08-01",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT09876543",
    ),
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="150",
        TrialistContactDetails=None,
        Countries="UK",
        CENTRALSubmissionStatus="Submitted",
        Duration="6 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2002,
        DateEntered="2021-09-10",
        Comparison="High fiber vs standard diet",
        CENTRALStudyID=5002,
        DateToCENTRAL="2021-10-01",
        ISRCTN="ISRCTN87654321",
        ShortName="Dietary fiber and microbiome",
        DateEdited="2021-11-02",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT07654321",
    ),
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="200",
        TrialistContactDetails=None,
        Countries="US; Canada",
        CENTRALSubmissionStatus="Submitted",
        Duration="12 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2001,
        DateEntered="2022-12-01",
        Comparison="Vitamin D vs placebo",
        CENTRALStudyID=5001,
        DateToCENTRAL="2023-01-05",
        ISRCTN="ISRCTN12345678",
        ShortName="Vitamin D bone density trial",
        DateEdited="2023-01-15",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT01234567",
    ),
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="220",
        TrialistContactDetails=None,
        Countries="Canada",
        CENTRALSubmissionStatus="Submitted",
        Duration="10 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2004,
        DateEntered="2021-03-12",
        Comparison="Resistance training vs usual care",
        CENTRALStudyID=5004,
        DateToCENTRAL="2021-04-02",
        ISRCTN="ISRCTN44556677",
        ShortName="Resistance training for fall prevention",
        DateEdited="2021-04-20",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT05554444",
    ),
    StudyDto(
        StatusofStudy="Completed",
        NumberParticipants="90",
        TrialistContactDetails=None,
        Countries="US",
        CENTRALSubmissionStatus="Submitted",
        Duration="4 months",
        Notes=None,
        UDef4=None,
        CRGStudyID=2005,
        DateEntered="2020-05-12",
        Comparison="Omega-3 supplement vs placebo",
        CENTRALStudyID=5005,
        DateToCENTRAL="2020-06-01",
        ISRCTN="ISRCTN11112222",
        ShortName="Omega-3 and cognitive outcomes",
        DateEdited="2020-06-15",
        UDef6=None,
        Search_Tagged=False,
        TrialRegistrationID="NCT01112223",
    ),
]
