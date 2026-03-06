import { ReportDetailDto } from "@/types/apiDTOs";

export type ReportFilterType = "all" | "assigned" | "unassigned" | "newStudy" | "withPdf" | "withoutPdf";

const toTimestamp = (value: Date | string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const isNewStudyAssignment = (
  studyCreatedAt: Date | string | number | null | undefined,
  reportCreatedAt: Date | string | number | null | undefined
) => {
  const studyTimestamp = toTimestamp(studyCreatedAt);
  const reportTimestamp = toTimestamp(reportCreatedAt);
  return studyTimestamp !== null && reportTimestamp !== null && studyTimestamp > reportTimestamp;
};

// Fallback type for StudyDto if not imported
type StudyDto = { createdAt: Date | string | number | null | undefined };

export function filterReports(
  reports: ReportDetailDto[],
  searchQuery: string,
  assignmentFilter: ReportFilterType
): ReportDetailDto[] {
  return reports.filter((report) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        report.report.title.toLowerCase().includes(query) ||
        report.report.abstract?.toLowerCase().includes(query) ||
        report.report.reportId.toString().includes(query);
      if (!matchesSearch) return false;
    }

    console.log("filter " + assignmentFilter );
    // Assignment filter
    if (assignmentFilter === "assigned") {
      return report.assignedStudies.length > 0;
    }
    if (assignmentFilter === "unassigned") {
      return report.assignedStudies.length == 0;
    }
    if (assignmentFilter === "withPdf") {
      return report.hasPdf ?? false; 
    }
    if (assignmentFilter === "withoutPdf") {
      return (report.hasPdf ?? false) == false;
    }
    if (assignmentFilter === "newStudy") {
      return report.assignedStudies.some((study: StudyDto) =>
        isNewStudyAssignment(study.createdAt, report.report.createdAt)
      );
    }

    return true;
  });
}
