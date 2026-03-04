import StudyList, {StudyListSkeleton} from "./components/study-list";
import { Suspense } from "react";

interface BatchStudyPageProps {
  params: {
    batchHash: string;
    reportId: string;
  };
  searchParams: {
    k?: string;
  };
}

export default async function BatchStudyPage({ params, searchParams }: BatchStudyPageProps) {
  console.log("Batch Study Page Loaded")
  return (
    <Suspense fallback={<StudyListSkeleton />}>
      <StudyList params={params} searchParams={searchParams} />
    </Suspense>
  );
}