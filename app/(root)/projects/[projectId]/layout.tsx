import { Suspense, type ReactNode } from "react";
import axios from "axios";
import { notFound } from "next/navigation";
import { ReportDetailDto } from "@/types/apiDTOs";
import { ReportColumnClient } from "./components/report-column-client";
import { getProjectReports as fetchProjectReports } from "@/lib/api/projectApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportColumnProps {
    children: ReactNode;
    params: Promise<{
        projectId: string;
    }>;
}

async function getProjectReports(projectId: string): Promise<ReportDetailDto[]> {
    const headers = await getMeerkatHeaders();

    try {
        const reports = await fetchProjectReports(projectId, true, { headers });
        return reports ?? [];
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            notFound();
        }

        throw new Error("Failed to load project reports.");
    }
}

export default async function ReportColumn({ children, params }: ReportColumnProps) {
    const resolvedParams = await params;
    const projectId = resolvedParams?.projectId;

    if (!projectId) {
        notFound();
    }

    const reports = await getProjectReports(projectId);

    const detailsContent = (
        <Suspense fallback={<ReportDetailsSkeleton />}>
            {children ?? <ReportDetailsSkeleton />}
        </Suspense>
    );

    return (
        <ReportColumnClient projectId={projectId} reports={reports}>
            {detailsContent}
        </ReportColumnClient>
    );
}

function ReportDetailsSkeleton() {
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