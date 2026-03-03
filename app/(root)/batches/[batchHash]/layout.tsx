import { type ReactNode } from "react";
import axios from "axios";
import { notFound } from "next/navigation";
import { ReportDetailDto } from "@/types/apiDTOs";
import { ReportColumnClient } from "./components/report-column-client";
import { getBatchReports as fetchBatchReports } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";

interface ReportColumnProps {
    children: ReactNode;
    params: Promise<{
        batchHash: string;
    }>;
}

async function getBatchReports(batchHash: string): Promise<ReportDetailDto[]> {
    const headers = await getMeerkatHeaders();

    try {
        const reports = await fetchBatchReports(batchHash, { headers });
        return reports ?? [];
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            notFound();
        }

        throw new Error("Failed to load batch reports.");
    }
}

export default async function ReportColumn({ children, params }: ReportColumnProps) {
    const resolvedParams = await params;
    const batchHash = resolvedParams?.batchHash;

    if (!batchHash) {
        notFound();
    }

    const reports = await getBatchReports(batchHash);

    return (
        <ReportColumnClient batchHash={batchHash} reports={reports}>
            {children}
        </ReportColumnClient>
    );
}