import { notFound } from "next/navigation";
import { StudyDetailContent } from "./components/study-detail-content";

// Mock data generator based on the provided schema
function getMockStudy(id: string) {
  const studies = {
    "1": {
      CENTRALStudyID: 1001,
      CRGStudyID: 2001,
      ShortName: "COVID-VAC-2024",
      StatusofStudy: "Completed",
      TrialistContactDetails:
        "Dr. Sarah Johnson, sjohnson@research.edu, +1-555-0123",
      CENTRALSubmissionStatus: "Approved",
      Notes:
        "Large-scale multi-center trial examining long-term vaccine efficacy",
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
          Title:
            "Long-term efficacy of mRNA COVID-19 vaccines in diverse populations",
          Notes: "Primary outcome paper",
          ReportNumber: 1,
          OriginalTitle:
            "Long-term efficacy of mRNA COVID-19 vaccines in diverse populations",
          Authors: "Johnson S, Smith M, Chen L, et al.",
          Journal: "New England Journal of Medicine",
          Year: 2024,
          Volume: 390,
          Issue: "15",
          Pages: "1423-1438",
          Language: "English",
          Abstract:
            "Background: Long-term efficacy data for mRNA COVID-19 vaccines remain limited. Methods: We conducted a randomized, double-blind, placebo-controlled trial involving 2,847 participants across 5 countries...",
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
          Medium: "Journal Report",
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
          OriginalTitle:
            "Safety profile and adverse events in COVID-19 vaccine trial",
          Authors: "Smith M, Johnson S, Lee K, et al.",
          Journal: "The Lancet",
          Year: 2024,
          Volume: 403,
          Issue: "10",
          Pages: "234-245",
          Language: "English",
          Abstract:
            "We report safety outcomes from our large-scale vaccine trial, including detailed analysis of adverse events...",
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
          Medium: "Journal Report",
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
        {
          id: 1,
          name: "mRNA COVID-19 Vaccine (30μg)",
          type: "Active Comparator",
        },
        { id: 2, name: "Placebo (Saline)", type: "Placebo Comparator" },
      ],
      conditions: [
        { id: 1, name: "COVID-19", category: "Infectious Disease" },
        { id: 2, name: "SARS-CoV-2 Infection", category: "Infectious Disease" },
      ],
      outcomes: [
        {
          id: 1,
          name: "Symptomatic COVID-19 infection",
          type: "Primary",
          timeframe: "18 months",
        },
        {
          id: 2,
          name: "Severe COVID-19 disease",
          type: "Primary",
          timeframe: "18 months",
        },
        {
          id: 3,
          name: "Hospitalization rate",
          type: "Secondary",
          timeframe: "18 months",
        },
        {
          id: 4,
          name: "Adverse events",
          type: "Secondary",
          timeframe: "18 months",
        },
        {
          id: 5,
          name: "Antibody levels",
          type: "Secondary",
          timeframe: "Months 0, 3, 6, 12, 18",
        },
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
        {
          id: 1,
          name: "Dr. Sarah Johnson",
          role: "Principal Investigator",
          affiliation: "Harvard Medical School",
          email: "sjohnson@research.edu",
        },
        {
          id: 2,
          name: "Dr. Michael Smith",
          role: "Co-Investigator",
          affiliation: "Johns Hopkins University",
          email: "msmith@jhu.edu",
        },
        {
          id: 3,
          name: "Dr. Li Chen",
          role: "Co-Investigator",
          affiliation: "University of Toronto",
          email: "lchen@utoronto.ca",
        },
        {
          id: 4,
          name: "Dr. Emma Williams",
          role: "Statistician",
          affiliation: "Oxford University",
          email: "ewilliams@ox.ac.uk",
        },
        {
          id: 5,
          name: "Dr. Hans Mueller",
          role: "Site Coordinator",
          affiliation: "Charité Berlin",
          email: "hmueller@charite.de",
        },
      ],
    },
    "2": {
      CENTRALStudyID: 1002,
      CRGStudyID: 2002,
      ShortName: "DIAB-PREV-2024",
      StatusofStudy: "Active",
      TrialistContactDetails:
        "Dr. Robert Chen, rchen@diabetes.org, +1-555-0456",
      CENTRALSubmissionStatus: "In Progress",
      Notes:
        "Lifestyle intervention study for diabetes prevention in high-risk individuals",
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
          Title:
            "Intensive lifestyle intervention for diabetes prevention: 12-month interim results",
          Notes: "Interim analysis",
          ReportNumber: 1,
          OriginalTitle:
            "Intensive lifestyle intervention for diabetes prevention: 12-month interim results",
          Authors: "Chen R, Martinez J, Silva A, et al.",
          Journal: "Diabetes Care",
          Year: 2024,
          Volume: 47,
          Issue: "8",
          Pages: "1234-1245",
          Language: "English",
          Abstract:
            "Objective: To evaluate the effectiveness of intensive lifestyle intervention in preventing type 2 diabetes in high-risk populations...",
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
          Medium: "Journal Report",
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
        {
          id: 1,
          name: "Intensive lifestyle intervention (diet + exercise)",
          type: "Experimental",
        },
        { id: 2, name: "Standard care", type: "Active Comparator" },
        {
          id: 3,
          name: "Metformin (850mg twice daily)",
          type: "Active Comparator",
        },
      ],
      conditions: [
        { id: 1, name: "Prediabetes", category: "Metabolic Disease" },
        {
          id: 2,
          name: "Impaired glucose tolerance",
          category: "Metabolic Disease",
        },
        { id: 3, name: "Obesity", category: "Metabolic Disease" },
      ],
      outcomes: [
        {
          id: 1,
          name: "Incidence of type 2 diabetes",
          type: "Primary",
          timeframe: "24 months",
        },
        {
          id: 2,
          name: "Body weight change",
          type: "Secondary",
          timeframe: "24 months",
        },
        {
          id: 3,
          name: "HbA1c levels",
          type: "Secondary",
          timeframe: "Months 0, 6, 12, 18, 24",
        },
        {
          id: 4,
          name: "Quality of life",
          type: "Secondary",
          timeframe: "24 months",
        },
      ],
      participants: [
        {
          id: 1,
          description: "Adults with prediabetes",
          ageRange: "35-70 years",
          count: 1234,
        },
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
        {
          id: 1,
          name: "Dr. Robert Chen",
          role: "Principal Investigator",
          affiliation: "Stanford University",
          email: "rchen@stanford.edu",
        },
        {
          id: 2,
          name: "Dr. Juan Martinez",
          role: "Co-Investigator",
          affiliation: "UNAM Mexico",
          email: "jmartinez@unam.mx",
        },
        {
          id: 3,
          name: "Dr. Ana Silva",
          role: "Co-Investigator",
          affiliation: "University of São Paulo",
          email: "asilva@usp.br",
        },
      ],
    },
  };

  return studies[id as keyof typeof studies] || null;
}

// Mock relevance studies data - similar studies sorted by relevance
function getMockRelevanceStudies() {
  return [
    {
      Linked: false,
      CRGStudyID: 5364,
      Relevance: 0.9984484910964966,
      ShortName: "Naber 2001",
      NumberParticipants: 114,
      Duration: "12 weeks",
      Comparison:
        "Olanzapine vs. Clozapine Olanzapine vs. Clozapine Olanzapine vs. Clozapine",
      StatusofStudy: "Completed",
      CENTRALSubmissionStatus: "Published",
      TrialistContactDetails: "Dr. Naber, University Hospital",
      Countries: "Germany//France//Italy",
      ISRCTN: "ISRCTN12345678",
      Notes: "Primary efficacy study",
      UDef4: "Phase 3",
      reports: [
        {
          CENTRALReportID: 6056,
          CRGReportID: 6056,
          Title:
            "Subjective well-being under neuroleptic treatment with olanzapine versus clozapine: first results from a double-blind clinical trial using the swn self-rating scale",
          Abstract:
            "This study evaluated subjective well-being in patients with schizophrenia treated with olanzapine or clozapine using the Subjective Well-Being under Neuroleptic Treatment (SWN) scale. Results showed significant improvements in both treatment groups, with olanzapine demonstrating non-inferiority to clozapine in terms of subjective well-being outcomes.",
        },
        {
          CENTRALReportID: 8098,
          CRGReportID: 8098,
          Title:
            "Olanzapine vs. clozapine: findings on subjective well-being from a double-blind clinical trial",
          Abstract:
            "A double-blind clinical trial comparing olanzapine and clozapine in patients with treatment-resistant schizophrenia. The study focused on patient-reported outcomes and subjective well-being measures, finding comparable efficacy between the two treatments.",
        },
        {
          CENTRALReportID: 8054,
          CRGReportID: 8054,
          Title:
            "Effects of olanzapine versus clozapine on executive functions in schizophrenia",
          Abstract:
            "This study examined the impact of olanzapine and clozapine on cognitive function, specifically executive functions, in patients with schizophrenia. Both treatments showed improvements in cognitive performance, with no significant differences between groups.",
        },
        {
          CENTRALReportID: 9692,
          CRGReportID: 9692,
          Title:
            "Effects of olanzapine versus clozapine on executive functions in schizophrenia",
          Abstract:
            "A comprehensive evaluation of executive function outcomes in schizophrenia patients treated with either olanzapine or clozapine. The study assessed various cognitive domains including working memory, attention, and problem-solving abilities.",
        },
        {
          CENTRALReportID: null,
          CRGReportID: 12318,
          Title:
            "Randomized double blind comparison of olanzapine vs clozapine on subjective well-being and clinical outcome in patients with schizophrenia",
          Abstract:
            "A randomized, double-blind study comparing olanzapine and clozapine in patients with schizophrenia. Primary outcomes included subjective well-being measures and clinical efficacy. Results demonstrated non-inferiority of olanzapine compared to clozapine.",
        },
        {
          CENTRALReportID: null,
          CRGReportID: 12657,
          Title:
            "Influence of atypical neuroleptics on executive functioning in patients with schizophrenia: a randomized, double-blind comparison of olanzapine vs clozapine",
          Abstract:
            "This randomized, double-blind trial investigated the effects of olanzapine and clozapine on executive functioning in patients with schizophrenia. Both treatments showed positive effects on cognitive function, with improvements in various executive function domains.",
        },
        {
          CENTRALReportID: 11476,
          CRGReportID: 11476,
          Title: "Subjective effects of antipsychotic treatment [editorial]",
          Abstract:
            "An editorial discussing the importance of patient-reported outcomes and subjective well-being in antipsychotic treatment. The article emphasizes the need to consider patient perspectives alongside clinical efficacy measures.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 5243,
      Relevance: 0.7474576830863953,
      ShortName: "Bitter 1999",
      NumberParticipants: 150,
      Duration: "16 weeks",
      Comparison: "{Clozapine vs. Olanzapine}",
      StatusofStudy: "Completed",
      CENTRALSubmissionStatus: "Published",
      TrialistContactDetails: "Dr. Bitter, Medical Center",
      Countries: "Hungary//Austria",
      ISRCTN: "ISRCTN87654321",
      Notes: "Comparative study",
      UDef4: "Phase 2",
      reports: [
        {
          CENTRALReportID: 5001,
          CRGReportID: 6001,
          Title:
            "Comparative study of clozapine and olanzapine in treatment-resistant schizophrenia",
          Abstract:
            "A comparative study evaluating the efficacy and safety of clozapine versus olanzapine in patients with treatment-resistant schizophrenia. The study assessed both clinical outcomes and tolerability profiles of both medications.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 3035,
      Relevance: 0.7398083209991455,
      ShortName: "Beuzen 1998",
      NumberParticipants: 180,
      Duration: "18 Weeks",
      Comparison: "{Clozapine vs. Olanzapine}",
      reports: [
        {
          CENTRALReportID: 5002,
          CRGReportID: 6002,
          Title:
            "Long-term efficacy comparison of clozapine and olanzapine in chronic schizophrenia",
          Abstract:
            "Long-term follow-up study comparing the efficacy of clozapine and olanzapine in patients with chronic schizophrenia. The study evaluated sustained treatment response and long-term outcomes over an extended period.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 6015,
      Relevance: 0.6845645904541016,
      ShortName: "Sharma 2002a",
      NumberParticipants: "Unclear",
      Duration: "",
      Comparison: "Clozapine vs. Olanzapine",
      reports: [
        {
          CENTRALReportID: 5003,
          CRGReportID: 6003,
          Title:
            "Efficacy and safety of clozapine versus olanzapine in treatment-resistant patients",
          Abstract:
            "A study examining the efficacy and safety profiles of clozapine and olanzapine specifically in treatment-resistant schizophrenia patients. The research focused on both therapeutic outcomes and adverse event profiles.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 8724,
      Relevance: 0.679603099822998,
      ShortName: "Moresco 2004",
      NumberParticipants: 23,
      Duration: "",
      Comparison: "Olanzapine vs. Clozapine",
      reports: [
        {
          CENTRALReportID: 5004,
          CRGReportID: 6004,
          Title: "Small-scale comparison of olanzapine and clozapine efficacy",
          Abstract:
            "A small-scale study comparing the efficacy of olanzapine and clozapine in a limited patient population. The study provided preliminary insights into the comparative effectiveness of these antipsychotic medications.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 7557,
      Relevance: 0.6795826554298401,
      ShortName: "Wang 2003c",
      NumberParticipants: 122,
      Duration: "",
      Comparison: "Olanzapine vs. Clozapine",
      reports: [
        {
          CENTRALReportID: 5005,
          CRGReportID: 6005,
          Title:
            "Asian population study: olanzapine versus clozapine in schizophrenia",
          Abstract:
            "A study examining the efficacy and tolerability of olanzapine versus clozapine specifically in Asian populations with schizophrenia. The research considered ethnic and genetic factors that may influence treatment response.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 11088,
      Relevance: 0.6791346073150635,
      ShortName: "NCT00169065",
      NumberParticipants: 35,
      Duration: "",
      Comparison: "Chlorpromazine vs. Clozapine",
      reports: [
        {
          CENTRALReportID: 5006,
          CRGReportID: 6006,
          Title:
            "Comparison of chlorpromazine and clozapine in treatment-resistant schizophrenia",
          Abstract:
            "A comparative study evaluating chlorpromazine, a first-generation antipsychotic, against clozapine in patients with treatment-resistant schizophrenia. The study assessed both efficacy and side effect profiles.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 4093,
      Relevance: 0.6700208187103271,
      ShortName: "Mergl 1999",
      NumberParticipants: 16,
      Duration: "",
      Comparison: "Olanzapine vs. Clozapine",
      reports: [
        {
          CENTRALReportID: 5007,
          CRGReportID: 6007,
          Title:
            "Pilot study: olanzapine versus clozapine in early-stage schizophrenia",
          Abstract:
            "A pilot study investigating the comparative efficacy of olanzapine and clozapine in patients with early-stage schizophrenia. The study aimed to assess treatment response in newly diagnosed patients.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 5125,
      Relevance: 0.6698141098022461,
      ShortName: "Schuld 2000",
      NumberParticipants: 18,
      Duration: "",
      Comparison: "Clozapine vs. Olanzapine",
      reports: [
        {
          CENTRALReportID: 5008,
          CRGReportID: 6008,
          Title: "Short-term comparison of clozapine and olanzapine effects",
          Abstract:
            "A short-term study comparing the immediate effects and early response patterns of clozapine and olanzapine in patients with schizophrenia. The study focused on rapid treatment response and early symptom improvement.",
        },
      ],
    },
    {
      Linked: false,
      CRGStudyID: 4980,
      Relevance: 0.6555784940719604,
      ShortName: "Fleming 1999",
      NumberParticipants: 9,
      Duration: "",
      Comparison: "Olanzapine vs. Clozapine",
      reports: [
        {
          CENTRALReportID: 5009,
          CRGReportID: 6009,
          Title:
            "Case series: olanzapine and clozapine in refractory schizophrenia",
          Abstract:
            "A case series examining individual patient responses to olanzapine and clozapine in treatment-refractory schizophrenia. The study provided detailed clinical observations and treatment outcomes for each case.",
        },
      ],
    },
  ];
}

export default async function ReportsPage() {
  const study = getMockStudy("1");

  if (!study) {
    notFound();
  }

  // Convert study reports to the format needed for ReportsList
  const allReports = study.reports.map((report) => ({
    CENTRALReportID: report.CENTRALReportID,
    CRGReportID: report.CRGReportID,
    Title: report.Title,
    Abstract: report.Abstract,
    Year: report.Year,
    DatetoCENTRAL: report.DatetoCENTRAL,
    Dateentered: report.Dateentered,
    NumberParticipants: study.NumberParticipants,
    Assigned: report.CENTRALReportID ? true : false,
    AssignedTo: report.CENTRALReportID
      ? `Study ${study.CENTRALStudyID}`
      : undefined,
  }));

  return (
    <StudyDetailContent
      reports={allReports}
      relevanceStudies={getMockRelevanceStudies()}
    />
  );
}
