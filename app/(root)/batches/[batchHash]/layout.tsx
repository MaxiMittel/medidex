import { Suspense } from "react";
import LayoutProps from "next";
import ReportList, { ReportListSkeleton } from "./components/report-list";
import ReportStudyView from './components/report-study-view';
import { BatchAssignmentProvider } from "@/hooks/use-batch-assignment-context";

export default async function ReportColumn({ params, children }: LayoutProps<"/batches/[batchHash]">) {
    const { batchHash } = await params;

    return (
        <BatchAssignmentProvider batchHash={batchHash}>
            <ReportStudyView
                left=
                {
                    <Suspense fallback={<ReportListSkeleton />}>
                        <ReportList batchHash={batchHash} />
                    </Suspense>
                }
                right={children}
            />
        </BatchAssignmentProvider>
    );
}