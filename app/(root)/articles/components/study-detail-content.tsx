"use client";

import { useState } from "react";
import { StudyRelevanceTable } from "./study-relevance-table";
import { ReportsList } from "./reports-list";

interface StudyDetailContentProps {
  reports: Array<{
    CENTRALReportID?: number | null;
    CRGReportID: number;
    Title: string;
    Abstract?: string;
    Year?: number;
    DatetoCENTRAL?: string;
    Dateentered?: string;
    NumberParticipants?: string | number;
    Assigned?: boolean;
    AssignedTo?: string;
  }>;
  relevanceStudies: any[];
}

export function StudyDetailContent({
  reports,
  relevanceStudies,
}: StudyDetailContentProps) {
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null);
  const [selectedStudyName, setSelectedStudyName] = useState<string | null>(
    null
  );

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Column - Reports List (Full Height) */}
      <div className="w-1/3 border-r overflow-hidden shrink-0">
        <div className="h-full p-4 md:px-6">
          <ReportsList reports={reports} />
        </div>
      </div>

      {/* Right Column - Relevance Table */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Relevance Studies Table */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:px-8">
          <StudyRelevanceTable
            studies={relevanceStudies}
            onStudySelect={(studyId) => {
              setSelectedStudyId(studyId);
              if (studyId) {
                const study = relevanceStudies.find(
                  (s) => s.CRGStudyID === studyId
                );
                setSelectedStudyName(study?.ShortName || null);
              } else {
                setSelectedStudyName(null);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
