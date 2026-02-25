"use client";

import { useEffect } from "react";
import { ReportsList } from "@/components/ui/study-view/reports-list";
import { useReportStore } from "@/hooks/use-report-store";
import { ReportDetailDto } from "../../../../../types/apiDTOs";

interface ReportListClientProps {
  reports: ReportDetailDto[];
}

export default function ReportListClient({
  reports,
}: ReportListClientProps) {
  const setReports = useReportStore((s) => s.setReports)
  //const reports = useReportStore((s) => s.reports)

  useEffect(() => {
    setReports(reports);
  }, [reports, setReports]);

  return (
    <ReportsList
      reports={reports}
    />
  );
}
