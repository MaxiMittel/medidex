import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyOverview } from "./study-overview";
import { StudyReports } from "./study-reports";
import { StudyDetails } from "./study-details";
import { StudyParticipants } from "./study-participants";
import { StudyTimeline } from "./study-timeline";
import { StudyActions } from "./study-actions";
import { StudySummary } from "./study-summary";

// Mock data generator based on the provided schema
function getMockStudy(id: string) {
  const studies = {
    "1": {
      CENTRALStudyID: 1001,
      CRGStudyID: 2001,
      ShortName: "COVID-VAC-2024",
      StatusofStudy: "Completed",
      TrialistContactDetails: "Dr. Sarah Johnson, sjohnson@research.edu, +1-555-0123",
      CENTRALSubmissionStatus: "Approved",
      Notes: "Large-scale multi-center trial examining long-term vaccine efficacy",
      DateEntered: "2024-01-15",
      DateToCENTRAL: "2024-02-01",
      DateEdited: "2024-10-20",
      Search_Tagged: true,
      NumberParticipants: "2,847",
      Countries: "USA//Canada//UK//Germany//France",
      Duration: "18 months",
      UDef4: "Phase 3",
      Comparison: "mRNA vaccine vs. placebo",
      ISRCTN: "ISRCTN12345678",
      UDef6: "Multi-center",
      TrialRegistrationID: "NCT04567890",
      reports: [
        {
          CENTRALReportID: 5001,
          CRGReportID: 6001,
          Title: "Long-term efficacy of mRNA COVID-19 vaccines in diverse populations",
          Notes: "Primary outcome paper",
          ReportNumber: 1,
          OriginalTitle: "Long-term efficacy of mRNA COVID-19 vaccines in diverse populations",
          Authors: "Johnson S, Smith M, Chen L, et al.",
          Journal: "New England Journal of Medicine",
          Year: 2024,
          Volume: 390,
          Issue: "15",
          Pages: "1423-1438",
          Language: "English",
          Abstract: "Background: Long-term efficacy data for mRNA COVID-19 vaccines remain limited. Methods: We conducted a randomized, double-blind, placebo-controlled trial involving 2,847 participants across 5 countries...",
          CENTRALSubmissionStatus: "Published",
          CopyStatus: "Available",
          DatetoCENTRAL: "2024-08-15",
          Dateentered: "2024-08-01",
          DateEdited: "2024-08-20",
          Editors: "Thompson R, Williams K",
          Publisher: "Massachusetts Medical Society",
          City: "Boston",
          DupString: "johnson2024long",
          TypeofReportID: 1,
          PublicationTypeID: 1,
          Edition: "1st",
          Medium: "Journal Article",
          StudyDesign: "Randomized Controlled Trial",
          DOI: "10.1056/NEJMoa2024001",
          UDef3: "High impact",
          ISBN: "",
          UDef5: "Q1 Journal",
          PMID: "39145678",
          TrialRegistrationID: "NCT04567890",
          UDef9: "",
          UDef10: "",
          UDef8: "Primary",
          PDFLinks: "https://example.com/pdf1.pdf",
        },
        {
          CENTRALReportID: 5002,
          CRGReportID: 6002,
          Title: "Safety profile and adverse events in COVID-19 vaccine trial",
          Notes: "Secondary analysis - safety outcomes",
          ReportNumber: 2,
          OriginalTitle: "Safety profile and adverse events in COVID-19 vaccine trial",
          Authors: "Smith M, Johnson S, Lee K, et al.",
          Journal: "The Lancet",
          Year: 2024,
          Volume: 403,
          Issue: "10",
          Pages: "234-245",
          Language: "English",
          Abstract: "We report safety outcomes from our large-scale vaccine trial, including detailed analysis of adverse events...",
          CENTRALSubmissionStatus: "Published",
          CopyStatus: "Available",
          DatetoCENTRAL: "2024-09-10",
          Dateentered: "2024-09-01",
          DateEdited: "2024-09-15",
          Editors: "Brown A",
          Publisher: "Elsevier",
          City: "London",
          DupString: "smith2024safety",
          TypeofReportID: 1,
          PublicationTypeID: 1,
          Edition: "1st",
          Medium: "Journal Article",
          StudyDesign: "Safety Analysis",
          DOI: "10.1016/S0140-6736(24)01234-5",
          UDef3: "High impact",
          ISBN: "",
          UDef5: "Q1 Journal",
          PMID: "39234567",
          TrialRegistrationID: "NCT04567890",
          UDef9: "",
          UDef10: "",
          UDef8: "Secondary",
          PDFLinks: "https://example.com/pdf2.pdf",
        },
      ],
      interventions: [
        { id: 1, name: "mRNA COVID-19 Vaccine (30μg)", type: "Active Comparator" },
        { id: 2, name: "Placebo (Saline)", type: "Placebo Comparator" },
      ],
      conditions: [
        { id: 1, name: "COVID-19", category: "Infectious Disease" },
        { id: 2, name: "SARS-CoV-2 Infection", category: "Infectious Disease" },
      ],
      outcomes: [
        { id: 1, name: "Symptomatic COVID-19 infection", type: "Primary", timeframe: "18 months" },
        { id: 2, name: "Severe COVID-19 disease", type: "Primary", timeframe: "18 months" },
        { id: 3, name: "Hospitalization rate", type: "Secondary", timeframe: "18 months" },
        { id: 4, name: "Adverse events", type: "Secondary", timeframe: "18 months" },
        { id: 5, name: "Antibody levels", type: "Secondary", timeframe: "Months 0, 3, 6, 12, 18" },
      ],
      participants: [
        { id: 1, description: "Adults", ageRange: "18-65 years", count: 2145 },
        { id: 2, description: "Elderly", ageRange: "65+ years", count: 702 },
        { id: 3, description: "Male", count: 1423 },
        { id: 4, description: "Female", count: 1424 },
        { id: 5, description: "With comorbidities", count: 856 },
        { id: 6, description: "Healthcare workers", count: 423 },
      ],
      design: {
        type: "Randomized Controlled Trial",
        phase: "Phase 3",
        allocation: "Randomized",
        masking: "Double-blind (participant, investigator)",
        assignment: "Parallel",
        enrollment: 2847,
        arms: 2,
      },
      persons: [
        { id: 1, name: "Dr. Sarah Johnson", role: "Principal Investigator", affiliation: "Harvard Medical School", email: "sjohnson@research.edu" },
        { id: 2, name: "Dr. Michael Smith", role: "Co-Investigator", affiliation: "Johns Hopkins University", email: "msmith@jhu.edu" },
        { id: 3, name: "Dr. Li Chen", role: "Co-Investigator", affiliation: "University of Toronto", email: "lchen@utoronto.ca" },
        { id: 4, name: "Dr. Emma Williams", role: "Statistician", affiliation: "Oxford University", email: "ewilliams@ox.ac.uk" },
        { id: 5, name: "Dr. Hans Mueller", role: "Site Coordinator", affiliation: "Charité Berlin", email: "hmueller@charite.de" },
      ],
    },
    "2": {
      CENTRALStudyID: 1002,
      CRGStudyID: 2002,
      ShortName: "DIAB-PREV-2024",
      StatusofStudy: "Active",
      TrialistContactDetails: "Dr. Robert Chen, rchen@diabetes.org, +1-555-0456",
      CENTRALSubmissionStatus: "In Progress",
      Notes: "Lifestyle intervention study for diabetes prevention in high-risk individuals",
      DateEntered: "2024-02-01",
      DateToCENTRAL: "2024-03-15",
      DateEdited: "2024-10-25",
      Search_Tagged: true,
      NumberParticipants: "1,234",
      Countries: "USA//Mexico//Brazil//Spain",
      Duration: "24 months",
      UDef4: "Phase 2",
      Comparison: "Lifestyle intervention vs. standard care",
      ISRCTN: "ISRCTN87654321",
      UDef6: "Multi-center",
      TrialRegistrationID: "NCT04678901",
      reports: [
        {
          CENTRALReportID: 5003,
          CRGReportID: 6003,
          Title: "Intensive lifestyle intervention for diabetes prevention: 12-month interim results",
          Notes: "Interim analysis",
          ReportNumber: 1,
          OriginalTitle: "Intensive lifestyle intervention for diabetes prevention: 12-month interim results",
          Authors: "Chen R, Martinez J, Silva A, et al.",
          Journal: "Diabetes Care",
          Year: 2024,
          Volume: 47,
          Issue: "8",
          Pages: "1234-1245",
          Language: "English",
          Abstract: "Objective: To evaluate the effectiveness of intensive lifestyle intervention in preventing type 2 diabetes in high-risk populations...",
          CENTRALSubmissionStatus: "Published",
          CopyStatus: "Available",
          DatetoCENTRAL: "2024-06-20",
          Dateentered: "2024-06-01",
          DateEdited: "2024-06-25",
          Editors: "Garcia M",
          Publisher: "American Diabetes Association",
          City: "Arlington",
          DupString: "chen2024intensive",
          TypeofReportID: 1,
          PublicationTypeID: 1,
          Edition: "1st",
          Medium: "Journal Article",
          StudyDesign: "Randomized Controlled Trial",
          DOI: "10.2337/dc24-0123",
          UDef3: "High impact",
          ISBN: "",
          UDef5: "Q1 Journal",
          PMID: "38567890",
          TrialRegistrationID: "NCT04678901",
          UDef9: "",
          UDef10: "",
          UDef8: "Interim",
          PDFLinks: "https://example.com/pdf3.pdf",
        },
      ],
      interventions: [
        { id: 1, name: "Intensive lifestyle intervention (diet + exercise)", type: "Experimental" },
        { id: 2, name: "Standard care", type: "Active Comparator" },
        { id: 3, name: "Metformin (850mg twice daily)", type: "Active Comparator" },
      ],
      conditions: [
        { id: 1, name: "Prediabetes", category: "Metabolic Disease" },
        { id: 2, name: "Impaired glucose tolerance", category: "Metabolic Disease" },
        { id: 3, name: "Obesity", category: "Metabolic Disease" },
      ],
      outcomes: [
        { id: 1, name: "Incidence of type 2 diabetes", type: "Primary", timeframe: "24 months" },
        { id: 2, name: "Body weight change", type: "Secondary", timeframe: "24 months" },
        { id: 3, name: "HbA1c levels", type: "Secondary", timeframe: "Months 0, 6, 12, 18, 24" },
        { id: 4, name: "Quality of life", type: "Secondary", timeframe: "24 months" },
      ],
      participants: [
        { id: 1, description: "Adults with prediabetes", ageRange: "35-70 years", count: 1234 },
        { id: 2, description: "Male", count: 567 },
        { id: 3, description: "Female", count: 667 },
        { id: 4, description: "BMI > 25", count: 1098 },
        { id: 5, description: "Family history of diabetes", count: 789 },
      ],
      design: {
        type: "Randomized Controlled Trial",
        phase: "Phase 2",
        allocation: "Randomized",
        masking: "Open-label",
        assignment: "Parallel",
        enrollment: 1234,
        arms: 3,
      },
      persons: [
        { id: 1, name: "Dr. Robert Chen", role: "Principal Investigator", affiliation: "Stanford University", email: "rchen@stanford.edu" },
        { id: 2, name: "Dr. Juan Martinez", role: "Co-Investigator", affiliation: "UNAM Mexico", email: "jmartinez@unam.mx" },
        { id: 3, name: "Dr. Ana Silva", role: "Co-Investigator", affiliation: "University of São Paulo", email: "asilva@usp.br" },
      ],
    },
  };

  return studies[id as keyof typeof studies] || null;
}

export default async function StudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const study = getMockStudy(resolvedParams.id);

  if (!study) {
    notFound();
  }

  return (
    <div className="p-4 md:px-8 md:py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{study.ShortName}</h1>
          <p className="text-sm text-muted-foreground">
            Study ID: {study.CENTRALStudyID} • Trial Registration: {study.TrialRegistrationID}
          </p>
        </div>
        {/* Quick actions */}
        <StudyActions studyId={resolvedParams.id} studyName={study.ShortName} />
      </div>

      {/* Summary */}
      <StudySummary study={study} reportCount={study.reports.length} />

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <StudyOverview study={study} />
          <StudyParticipants participants={study.participants} />
          <StudyDetails
            interventions={study.interventions}
            conditions={study.conditions}
            outcomes={study.outcomes}
            design={study.design}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <StudyTimeline study={study} />
          <StudyReports reports={study.reports} persons={study.persons} />
        </div>
      </div>
    </div>
  );
}

