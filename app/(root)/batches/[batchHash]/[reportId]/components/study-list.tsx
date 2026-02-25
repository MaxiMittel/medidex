import { StudyRelevanceTable } from "@/components/ui/study-view/study-relevance-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { SimilarStudiesResponseDto } from "@/types/apiDTOs";
import type { RelevanceStudy } from "@/types/reports";
import { getSimilarStudiesByReport } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

interface StudyListProps {
  params: {
    batchHash: string;
    reportId: string;
  };
  searchParams: {
    k?: string | string[];
  };
}

const mapResponseToRelevanceStudies = (
  response: SimilarStudiesResponseDto
): RelevanceStudy[] => {
  const lengths = [
    response.CRGStudyID.length,
    response.Relevance.length,
    response.ShortName.length,
    response.NumberParticipants.length,
    response.Duration.length,
    response.Comparison.length,
    response.Countries.length,
    response.DateEntered.length,
    response.DateEdited.length,
    response.StatusofStudy.length,
  ];
  const entryCount = Math.min(...lengths);
  const studies: RelevanceStudy[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    const countries = response.Countries[index];
    const dateEntered = response.DateEntered[index];
    const dateEdited = response.DateEdited[index];
    const status = response.StatusofStudy[index];

    studies.push({
      Linked: false,
      CRGStudyID: response.CRGStudyID[index],
      Relevance: response.Relevance[index],
      ShortName: response.ShortName[index],
      NumberParticipants: response.NumberParticipants[index],
      Duration: response.Duration[index],
      Comparison: response.Comparison[index],
      Countries: countries || undefined,
      DateEntered: dateEntered || undefined,
      DateEdited: dateEdited || undefined,
      StatusofStudy: status || undefined,
      reports: [],
    });
  }

  return studies;
};

export default async function StudyList({ params, searchParams }: StudyListProps) {

  const { batchHash, reportId } = await params;
  const reportIdNumber = Number(reportId);
  const requestedK = Array.isArray(searchParams?.k)
    ? searchParams.k[0]
    : searchParams?.k;
  const parsedK = Number(requestedK);
  const k = Number.isFinite(parsedK) && parsedK > 0 ? parsedK : 10;

  const headers = await getMeerkatHeaders();
  const response = await getSimilarStudiesByReport(reportIdNumber, undefined, {
    headers,
    params: { k },
  });
  const studies = mapResponseToRelevanceStudies(response);

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden p-4 md:px-8">
        <StudyRelevanceTable
          studies={studies}
          currentBatchHash={batchHash}
          currentReportId={reportIdNumber}
        />
    </div>
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
