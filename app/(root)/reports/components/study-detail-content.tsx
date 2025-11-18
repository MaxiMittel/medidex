"use client";

import { useState } from "react";
import { StudyRelevanceTable } from "./study-relevance-table";
import { ReportsList } from "./reports-list";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";

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
    <PanelGroup direction="horizontal" className="h-screen">
      <Panel
        defaultSize={40}
        minSize={25}
        className="border-r bg-background min-w-0"
      >
        <div className="h-full p-4 md:px-6 overflow-hidden">
          <ReportsList reports={reports} />
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

      <Panel defaultSize={60} minSize={35} className="min-w-0">
        <div className="h-full flex flex-col min-w-0 overflow-hidden">
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
      </Panel>
    </PanelGroup>
  );
}
