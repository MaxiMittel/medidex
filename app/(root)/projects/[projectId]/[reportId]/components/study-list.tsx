import axios from "axios";
import { notFound } from "next/navigation";
import { StudyRelevanceTable } from "@/components/ui/study-view/study-relevance-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { SimilarStudyResponseDto } from "@/types/apiDTOs";
import type { RelevanceStudy } from "@/types/reports";
import { getSimilarStudiesByReport } from "@/lib/api/reportApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

interface StudyListProps {
  params: {
    projectId: string;
    reportId: string;
  };
  searchParams: {
    k?: string;
  };
}

const mapResponseToRelevanceStudies = (
  response: SimilarStudyResponseDto[]
): RelevanceStudy[] => {
  return response.map((study) => ({
    ...study,
    isLinked: false
  }));
};

export default async function StudyList({ params, searchParams }: StudyListProps) {

  const { projectId, reportId } = await params;
  const { k } = await searchParams;
  const source = projectId;
  const reportIdNumber = Number(reportId);

  const headers = await getMeerkatHeaders();
  let response: SimilarStudyResponseDto[] = [];

  try {
    response = await getSimilarStudiesByReport(reportIdNumber, undefined, {
      headers,
      params: { k, source },
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }

    throw error;
  }

  const studies = mapResponseToRelevanceStudies(response);

  return (
    <StudyRelevanceTable
          studies={studies}
          projectId={projectId}
          reportId={reportIdNumber}
        />
  );
}

export function StudyListSkeleton() {
  const rowPlaceholders = Array.from({ length: 4 });

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden p-4 md:px-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex-1 mt-4 space-y-4 overflow-hidden">
        {rowPlaceholders.map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card/70 p-4 space-y-3"
          >
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
